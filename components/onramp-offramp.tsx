"use client";

import React, { useState } from "react";
import { ArrowDown, ChevronDown, Phone, Wallet } from "lucide-react";
import { parsePhoneNumber } from "libphonenumber-js";
import toast, { Toaster } from "react-hot-toast";

interface Token {
  symbol: string;
  name: string;
  icon: JSX.Element;
  color: string;
}

const availableTokens: Token[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: <USDCIcon />,
    color: "#2775CA",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    icon: <USDTIcon />,
    color: "#26A17B",
  },
  {
    symbol: "DAI",
    name: "DAI Stablecoin",
    icon: <DAIIcon />,
    color: "#F5AC37",
  },
];

const MOCK_EXCHANGE_RATE = 150; // 1 USD = 150 KES

export default function OnrampOfframp() {
  const [activeTab, setActiveTab] = useState<"onramp" | "offramp">("onramp");
  const [kesAmount, setKesAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token>(availableTokens[0]);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleKesChange = (value: string) => {
    setKesAmount(value);
    const crypto = (parseFloat(value) / MOCK_EXCHANGE_RATE).toFixed(2);
    setCryptoAmount(isNaN(parseFloat(crypto)) ? "" : crypto);
  };

  const handleCryptoChange = (value: string) => {
    setCryptoAmount(value);
    const kes = (parseFloat(value) * MOCK_EXCHANGE_RATE).toFixed(2);
    setKesAmount(isNaN(parseFloat(kes)) ? "" : kes);
  };

  const validatePhone = (phone: string): boolean => {
    try {
      const phoneNum = parsePhoneNumber(phone, "KE");
      return phoneNum.isValid();
    } catch {
      return false;
    }
  };

  const handleOnramp = () => {
    if (!kesAmount || parseFloat(kesAmount) <= 0) {
      toast.error("Please enter a valid KES amount");
      return;
    }
    if (!validatePhone(phoneNumber)) {
      toast.error("Please enter a valid Kenyan phone number");
      return;
    }

    setIsProcessing(true);
    toast.loading("Initiating M-Pesa payment...", { duration: 2000 });
    
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`M-Pesa prompt sent to ${phoneNumber}. Check your phone to complete payment.`);
    }, 2000);
  };

  const handleOfframp = () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
      toast.error("Please enter a valid crypto amount");
      return;
    }
    if (!validatePhone(phoneNumber)) {
      toast.error("Please enter a valid Kenyan phone number");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing withdrawal...", { duration: 2000 });
    
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`KES ${kesAmount} will be sent to ${phoneNumber} via M-Pesa`);
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
              onClick={() => setActiveTab("onramp")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === "onramp"
                  ? "text-[#6B48FF] border-b-2 border-[#6B48FF]"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Buy Crypto
            </button>
            <button
              onClick={() => setActiveTab("offramp")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === "offramp"
                  ? "text-[#6B48FF] border-b-2 border-[#6B48FF]"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Sell Crypto
            </button>
          </div>

          <div className="p-6">
            {/* From Section */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-[#666666] dark:text-gray-400">
                  {activeTab === "onramp" ? "You pay" : "You send"}
                </span>
                {activeTab === "onramp" ? (
                  <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="font-medium dark:text-white">M-Pesa</span>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                      className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div
                        className="mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full"
                        style={{ backgroundColor: selectedToken.color }}
                      >
                        {selectedToken.icon}
                      </div>
                      <span className="font-medium dark:text-white">{selectedToken.symbol}</span>
                      <ChevronDown className="ml-1 h-4 w-4 dark:text-gray-400" />
                    </button>

                    {isTokenDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                        {availableTokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setSelectedToken(token);
                              setIsTokenDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full"
                              style={{ backgroundColor: token.color }}
                            >
                              {token.icon}
                            </div>
                            <div className="text-left">
                              <div className="font-medium dark:text-white">{token.symbol}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <input
                type="number"
                value={activeTab === "onramp" ? kesAmount : cryptoAmount}
                onChange={(e) =>
                  activeTab === "onramp"
                    ? handleKesChange(e.target.value)
                    : handleCryptoChange(e.target.value)
                }
                placeholder="0.00"
                className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
              />
              <div className="text-sm text-[#666666] dark:text-gray-400">
                {activeTab === "onramp" ? `KES ${kesAmount || "0.00"}` : `~$${cryptoAmount || "0.00"}`}
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
                  {activeTab === "onramp" ? "You receive" : "You receive"}
                </span>
                {activeTab === "onramp" ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                      className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div
                        className="mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full"
                        style={{ backgroundColor: selectedToken.color }}
                      >
                        {selectedToken.icon}
                      </div>
                      <span className="font-medium dark:text-white">{selectedToken.symbol}</span>
                      <ChevronDown className="ml-1 h-4 w-4 dark:text-gray-400" />
                    </button>

                    {isTokenDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                        {availableTokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setSelectedToken(token);
                              setIsTokenDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full"
                              style={{ backgroundColor: token.color }}
                            >
                              {token.icon}
                            </div>
                            <div className="text-left">
                              <div className="font-medium dark:text-white">{token.symbol}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="font-medium dark:text-white">M-Pesa</span>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={activeTab === "onramp" ? cryptoAmount : kesAmount}
                readOnly
                placeholder="0.00"
                className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
              />
              <div className="text-sm text-[#666666] dark:text-gray-400">
                {activeTab === "onramp" ? `~$${cryptoAmount || "0.00"}` : `KES ${kesAmount || "0.00"}`}
              </div>
            </div>

            {/* M-Pesa Phone Number */}
            <div className="mb-4">
              <label className="block text-sm text-[#666666] dark:text-gray-400 mb-2">
                M-Pesa Phone Number
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-gray-500 dark:text-gray-400">+254</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="712345678"
                  className="flex-1 border-none bg-transparent outline-none dark:text-white"
                />
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                <span className="font-medium dark:text-white">1 USD = {MOCK_EXCHANGE_RATE} KES</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={activeTab === "onramp" ? handleOnramp : handleOfframp}
              disabled={isProcessing}
              className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : activeTab === "onramp" ? "Buy with M-Pesa" : "Sell for M-Pesa"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function USDCIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000" className="h-5 w-5">
      <path d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z" fill="#2775ca"/>
      <path d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z" fill="#fff"/>
    </svg>
  );
}

function USDTIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000" className="h-5 w-5">
      <path d="M1000 0c552.26 0 1000 447.74 1000 1000s-447.76 1000-1000 1000S0 1552.38 0 1000 447.68 0 1000 0" fill="#26a17b"/>
      <path d="M1123.42 866.76V718h340.18V491.34H537.28V718H877.5v148.64C601 879.34 393.1 934.1 393.1 999.7s208 120.36 484.4 133.14v476.5h246V1132.8c276-12.74 483.48-67.46 483.48-133s-207.48-120.26-483.48-133m0 225.64v-.12c-6.94.44-42.6 2.58-122 2.58-63.48 0-108.14-1.8-123.88-2.62v.2C633.34 1081.66 451 1039.12 451 988.22S633.36 894.84 877.62 884v166.1c16 1.1 61.76 3.8 124.92 3.8 75.86 0 114-3.16 121-3.8V884c243.8 10.86 425.72 53.44 425.72 104.16s-182 93.32-425.72 104.18" fill="#fff"/>
    </svg>
  );
}

function DAIIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444.44 444.44" className="h-5 w-5">
      <path fill="#F5AC37" d="M222.22 0c122.74 0 222.22 99.5 222.22 222.22 0 122.74-99.48 222.22-222.22 222.22-122.72 0-222.22-99.49-222.22-222.22C0 99.5 99.5 0 222.22 0z"/>
      <path fill="#FEFEFD" d="M230.41 237.91h84.44c1.8 0 2.65 0 2.78-2.36.69-8.59.69-17.23 0-25.83 0-1.67-.83-2.36-2.64-2.36h-168.05c-2.08 0-2.64.69-2.64 2.64v24.72c0 3.19 0 3.19 3.33 3.19h82.78z"/>
    </svg>
  );
}
