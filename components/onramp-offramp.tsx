"use client";

import React, { useState } from "react";
import { ArrowDown, ChevronDown, Phone, Send } from "lucide-react";
import { parsePhoneNumber } from "libphonenumber-js";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import ConfirmationModal from "./confirmation-modal";
import Receipt from "./receipt";

interface Token {
  symbol: string;
  name: string;
  icon: React.ReactElement;
  color: string;
}

interface PaymentProvider {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  logo: string;
  phonePrefix: string;
}

const availableTokens: Token[] = [
  {
    symbol: "RLUSD",
    name: "Ripple USD",
    icon: <RLUSDIcon />,
    color: "#0085FF",
  },
];

const paymentProviders: PaymentProvider[] = [
  {
    id: "mpesa-ke",
    name: "M-Pesa",
    country: "Kenya",
    countryCode: "KE",
    logo: "/assets/mpesa-logo.png",
    phonePrefix: "+254",
  },
  {
    id: "mtn-ug",
    name: "MTN Mobile Money",
    country: "Uganda",
    countryCode: "UG",
    logo: "/assets/mtn-logo.png",
    phonePrefix: "+256",
  },
  {
    id: "opay-ng",
    name: "OPay",
    country: "Nigeria",
    countryCode: "NG",
    logo: "/assets/opay-logo.png",
    phonePrefix: "+234",
  },
];

const MOCK_EXCHANGE_RATE = 150; // 1 USD = 150 KES (adjust per provider)

export default function CashInOut() {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "pay">("deposit");
  const [fiatAmount, setFiatAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedToken] = useState<Token>(availableTokens[0]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(paymentProviders[0]);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pay tab specific states
  const [recipientPhone, setRecipientPhone] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  // Modal states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const handleFiatChange = (value: string) => {
    setFiatAmount(value);
    const crypto = (parseFloat(value) / MOCK_EXCHANGE_RATE).toFixed(2);
    setCryptoAmount(isNaN(parseFloat(crypto)) ? "" : crypto);
  };

  const handleCryptoChange = (value: string) => {
    setCryptoAmount(value);
    const fiat = (parseFloat(value) * MOCK_EXCHANGE_RATE).toFixed(2);
    setFiatAmount(isNaN(parseFloat(fiat)) ? "" : fiat);
  };

  const validatePhone = (phone: string, provider: PaymentProvider): boolean => {
    try {
      const phoneNum = parsePhoneNumber(phone, provider.countryCode as any);
      return phoneNum.isValid();
    } catch {
      return false;
    }
  };

  const getCurrencySymbol = () => {
    switch (selectedProvider.country) {
      case "Kenya": return "KES";
      case "Uganda": return "UGX";
      case "Nigeria": return "NGN";
      default: return "KES";
    }
  };

  const handleDepositClick = () => {
    if (!fiatAmount || parseFloat(fiatAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!validatePhone(phoneNumber, selectedProvider)) {
      toast.error(`Please enter a valid ${selectedProvider.country} phone number`);
      return;
    }
    setShowConfirmation(true);
  };

  const handleWithdrawClick = () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
      toast.error("Please enter a valid crypto amount");
      return;
    }
    if (!validatePhone(phoneNumber, selectedProvider)) {
      toast.error(`Please enter a valid ${selectedProvider.country} phone number`);
      return;
    }
    setShowConfirmation(true);
  };

  const handlePayClick = () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!validatePhone(recipientPhone, selectedProvider)) {
      toast.error(`Please enter a valid ${selectedProvider.country} phone number`);
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmTransaction = () => {
    setShowConfirmation(false);
    setIsProcessing(true);

    const loadingMessage = activeTab === "deposit"
      ? `Initiating ${selectedProvider.name} payment...`
      : activeTab === "withdraw"
        ? "Processing withdrawal..."
        : "Processing payment...";

    toast.loading(loadingMessage, { duration: 2000 });

    setTimeout(() => {
      setIsProcessing(false);

      // Create transaction record
      const transaction = {
        type: activeTab,
        amount: activeTab === "pay" ? payAmount : cryptoAmount,
        token: selectedToken.symbol,
        fiatAmount: activeTab === "pay"
          ? `${(parseFloat(payAmount) * MOCK_EXCHANGE_RATE).toFixed(2)} ${getCurrencySymbol()}`
          : `${fiatAmount} ${getCurrencySymbol()}`,
        phone: activeTab === "pay" ? phoneNumber : phoneNumber,
        recipientPhone: activeTab === "pay" ? recipientPhone : undefined,
        provider: selectedProvider.name,
        transactionId: `TXN${Date.now().toString().slice(-8)}`,
        timestamp: new Date(),
        status: "success" as const,
        note: activeTab === "pay" ? payNote : undefined,
      };

      setLastTransaction(transaction);
      setShowReceipt(true);

      // Clear form
      if (activeTab === "pay") {
        setPayAmount("");
        setRecipientPhone("");
        setPayNote("");
      } else {
        setFiatAmount("");
        setCryptoAmount("");
        setPhoneNumber("");
      }

      toast.success("Transaction completed successfully!");
    }, 2000);
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="relative w-full max-w-md mx-auto">
        <div className="rounded-[20px] bg-white shadow-md dark:bg-gray-800">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("deposit")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "deposit"
                ? "text-[#6B48FF] border-b-2 border-[#6B48FF]"
                : "text-gray-500 dark:text-gray-400"
                }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "withdraw"
                ? "text-[#6B48FF] border-b-2 border-[#6B48FF]"
                : "text-gray-500 dark:text-gray-400"
                }`}
            >
              Withdraw
            </button>
            <button
              onClick={() => setActiveTab("pay")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "pay"
                ? "text-[#6B48FF] border-b-2 border-[#6B48FF]"
                : "text-gray-500 dark:text-gray-400"
                }`}
            >
              Pay
            </button>
          </div>

          <div className="p-6">
            {/* Payment Provider Selector */}
            <div className="mb-4">
              <label className="block text-sm text-[#666666] dark:text-gray-400 mb-2">
                Payment Provider
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium dark:text-white">{selectedProvider.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{selectedProvider.country}</div>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 dark:text-gray-400" />
                </button>

                {isProviderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                    {paymentProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => {
                          setSelectedProvider(provider);
                          setIsProviderDropdownOpen(false);
                          setPhoneNumber("");
                          setRecipientPhone("");
                        }}
                        className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium dark:text-white">{provider.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{provider.country}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {activeTab === "pay" ? (
              // Pay Tab Content
              <>
                <div className="mb-4">
                  <label className="block text-sm text-[#666666] dark:text-gray-400 mb-2">
                    Recipient Phone Number
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{selectedProvider.phonePrefix}</span>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder={selectedProvider.country === "Kenya" ? "712345678" : selectedProvider.country === "Uganda" ? "712345678" : "8012345678"}
                      className="flex-1 border-none bg-transparent outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-[#666666] dark:text-gray-400 mb-2">
                    Amount ({selectedToken.symbol})
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: selectedToken.color }}
                    >
                      {selectedToken.icon}
                    </div>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 border-none bg-transparent outline-none text-lg font-medium dark:text-white"
                    />
                  </div>
                  <div className="text-sm text-[#666666] dark:text-gray-400 mt-1">
                    ≈ {(parseFloat(payAmount || "0") * MOCK_EXCHANGE_RATE).toFixed(2)} {getCurrencySymbol()}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-[#666666] dark:text-gray-400 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handlePayClick}
                  disabled={isProcessing}
                  className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Send Payment"}
                </button>
              </>
            ) : (
              // Deposit/Withdraw Tab Content
              <>
                {/* From Section */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-[#666666] dark:text-gray-400">
                      {activeTab === "deposit" ? "You pay" : "You send"}
                    </span>
                    {activeTab === "deposit" ? (
                      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="font-medium dark:text-white">{selectedProvider.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                        <div
                          className="flex h-[24px] w-[24px] items-center justify-center rounded-full"
                          style={{ backgroundColor: selectedToken.color }}
                        >
                          {selectedToken.icon}
                        </div>
                        <span className="font-medium dark:text-white">{selectedToken.symbol}</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="number"
                    value={activeTab === "deposit" ? fiatAmount : cryptoAmount}
                    onChange={(e) =>
                      activeTab === "deposit"
                        ? handleFiatChange(e.target.value)
                        : handleCryptoChange(e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
                  />
                  <div className="text-sm text-[#666666] dark:text-gray-400">
                    {activeTab === "deposit" ? `${getCurrencySymbol()} ${fiatAmount || "0.00"}` : `~${cryptoAmount || "0.00"} ${selectedToken.symbol}`}
                  </div>
                </div>

                {/* Arrow */}
                <div className="relative flex justify-center my-4">
                  <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <ArrowDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>

                {/* To Section */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-[#666666] dark:text-gray-400">
                      You receive
                    </span>
                    {activeTab === "deposit" ? (
                      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                        <div
                          className="flex h-[24px] w-[24px] items-center justify-center rounded-full"
                          style={{ backgroundColor: selectedToken.color }}
                        >
                          {selectedToken.icon}
                        </div>
                        <span className="font-medium dark:text-white">{selectedToken.symbol}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="font-medium dark:text-white">{selectedProvider.name}</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={activeTab === "deposit" ? cryptoAmount : fiatAmount}
                    readOnly
                    placeholder="0.00"
                    className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
                  />
                  <div className="text-sm text-[#666666] dark:text-gray-400">
                    {activeTab === "deposit" ? `~${cryptoAmount || "0.00"} ${selectedToken.symbol}` : `${getCurrencySymbol()} ${fiatAmount || "0.00"}`}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="mb-4">
                  <label className="block text-sm text-[#666666] dark:text-gray-400 mb-2">
                    {activeTab === "deposit" ? "Your" : "Recipient"} Phone Number
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{selectedProvider.phonePrefix}</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={selectedProvider.country === "Kenya" ? "712345678" : selectedProvider.country === "Uganda" ? "712345678" : "8012345678"}
                      className="flex-1 border-none bg-transparent outline-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Exchange Rate Info */}
                <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                    <span className="font-medium dark:text-white">1 USD = {MOCK_EXCHANGE_RATE} {getCurrencySymbol()}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={activeTab === "deposit" ? handleDepositClick : handleWithdrawClick}
                  disabled={isProcessing}
                  className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : activeTab === "deposit" ? `Deposit with ${selectedProvider.name}` : `Withdraw to ${selectedProvider.name}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmTransaction}
          transaction={{
            type: activeTab,
            amount: activeTab === "pay" ? payAmount : (activeTab === "deposit" ? fiatAmount : cryptoAmount),
            token: selectedToken.symbol,
            fiatAmount: activeTab === "pay"
              ? (parseFloat(payAmount) * MOCK_EXCHANGE_RATE).toFixed(2)
              : fiatAmount,
            phone: phoneNumber,
            recipientPhone: activeTab === "pay" ? recipientPhone : undefined,
            provider: selectedProvider.name,
            currency: getCurrencySymbol(),
            note: activeTab === "pay" ? payNote : undefined,
          }}
          isProcessing={isProcessing}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <Receipt
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          transaction={lastTransaction}
        />
      )}
    </>
  );
}

function RLUSDIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="white">
      <circle cx="12" cy="12" r="10" fill="#0085FF" />
      <text x="12" y="16" fontSize="12" fontWeight="bold" textAnchor="middle" fill="white">$</text>
    </svg>
  );
}
