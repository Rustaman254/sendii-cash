"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useSwitchChain } from "wagmi";
import Moralis from "moralis";
import { ArrowDown, ChevronDown, Info, X } from "lucide-react";
import type { JSX } from "react/jsx-runtime";
import { erc20Abi } from "viem";

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

const MOCK_TOKEN_PRICES: { [key: string]: number } = {
  USDC: 1.0,
  DAI: 1.0,
  WETH: 2000.0,
  ETH: 2000.0,
};

const TOKEN_LIST = [
  { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`, decimals: 6 },
  { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917EF0Cb" as `0x${string}`, decimals: 18 },
  { symbol: "WETH", address: "0x4200000000000000000000000000000000000006" as `0x${string}`, decimals: 18 },
  { symbol: "ETH", address: "0x0000000000000000000000000000000000000000" as `0x${string}`, decimals: 18 },
];

const DUST_AGGREGATOR_ADDRESS = "0x4FC57BaB376146209E67a529f99ECb51B70b423f" as `0x${string}`;
const DUST_AGGREGATOR_ABI = [
  {
    inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
    name: "depositDust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokens", type: "address[]" }, { name: "tokenOut", type: "address" }],
    name: "swapDust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "DustDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "tokenOut", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "DustSwapped",
    type: "event",
  },
];

interface Token {
  symbol: string;
  name: string;
  icon: JSX.Element;
  balance: string;
  value: string;
  color: string;
  address: `0x${string}`;
  decimals: number;
}

const availableTokens: Token[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: <USDCIcon />,
    balance: "0",
    value: "$0.00",
    color: "#2775CA",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
    decimals: 6,
  },
  {
    symbol: "DAI",
    name: "DAI Stablecoin",
    icon: <DAIIcon />,
    balance: "0",
    value: "$0.00",
    color: "#F5AC37",
    address: "0x50c5725949A6F0c72E6C4a641F24049A917EF0Cb" as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    icon: <WETHIcon />,
    balance: "0",
    value: "$0.00",
    color: "#627EEA",
    address: "0x4200000000000000000000000000000000000006" as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "ETH",
    name: "Base Ether",
    icon: <ETHIcon />,
    balance: "0",
    value: "$0.00",
    color: "#3C3C3D",
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    decimals: 18,
  },
];

const thresholdOptions = [
  { label: "$10", value: 10 },
  { label: "$100", value: 100 },
  { label: "$1000", value: 1000 },
  { label: "MAX", value: "MAX" },
];

// type ModalType = "lend" | "borrow" | "stake" | null;

const CryptoSwap: React.FC = () => {
  const { address: account, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [selectedFromTokens, setSelectedFromTokens] = useState<Token[]>([]);
  const [selectedToToken, setSelectedToToken] = useState<Token>(availableTokens[3]); 
  const [fromAmount, setFromAmount] = useState("0");
  const [toAmount, setToAmount] = useState("0");
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  // const [activeModal, setActiveModal] = useState<ModalType>(null);
  // const [lendAmount, setLendAmount] = useState("");
  // const [borrowAmount, setBorrowAmount] = useState("");
  // const [stakeAmount, setStakeAmount] = useState("");
  const [selectedThreshold, setSelectedThreshold] = useState(thresholdOptions[0]);
  const [isThresholdDropdownOpen, setIsThresholdDropdownOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>(availableTokens);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeMoralis = async () => {
      await Moralis.start({
        apiKey: MORALIS_API_KEY,
      });
    };
    initializeMoralis();
  }, []);

  useEffect(() => {
    if (isConnected && account && chainId) {
      if (chainId !== 8453 && chainId !== 84532) {
        switchChain({ chainId: 84532 }); 
      } else {
        fetchDustAssets(account);
      }
    }
  }, [isConnected, account, chainId]);

  const fetchDustAssets = async (address: string) => {
    setIsLoading(true);
    try {
      const moralisChain = chainId === 8453 ? "0x2105" : "0x14a34"; 

      const tokenResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain: moralisChain,
        address,
      });

      const nativeResponse = await Moralis.EvmApi.balance.getNativeBalance({
        chain: moralisChain,
        address,
      });

      const updatedTokens = await Promise.all(
        availableTokens.map(async (token) => {
          if (token.address === "0x0000000000000000000000000000000000000000") {
            const balance = (Number(nativeResponse.toJSON().balance) / 10 ** 18).toFixed(4);
            const usdValue = Number(balance) * MOCK_TOKEN_PRICES.ETH;
            return {
              ...token,
              balance,
              value: `$${usdValue.toFixed(2)}`,
            };
          } else {
            const moralisToken = tokenResponse.toJSON().find(
              (t: any) => t.token_address.toLowerCase() === token.address.toLowerCase(),
            );
            if (moralisToken) {
              const balance = (Number(moralisToken.balance) / 10 ** moralisToken.decimals).toFixed(4);
              const usdValue = Number(balance) * (MOCK_TOKEN_PRICES[token.symbol] || 1.0);
              return {
                ...token,
                balance,
                value: `$${usdValue.toFixed(2)}`,
              };
            }
            return token;
          }
        }),
      );

      const nonZeroTokens = updatedTokens.filter((token) => Number(token.balance) > 0);
      const dustTokens = nonZeroTokens.filter((token) => {
        const value = Number.parseFloat(token.value.replace("$", ""));
        return value > 0 && (selectedThreshold.value === "MAX" || value < Number(selectedThreshold.value));
      });

      setTokens(nonZeroTokens);
      setSelectedFromTokens(dustTokens);
      updateToAmount(dustTokens);
    } catch (error) {
      console.error("Failed to fetch dust assets:", error);
      alert("Failed to fetch dust assets.");
    }
    setIsLoading(false);
  };

  const depositDust = async (tokenAddress: `0x${string}`, amount: string, decimals: number) => {
    if (!isConnected || !account) return;
    try {
      if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        await writeContractAsync({
          address: DUST_AGGREGATOR_ADDRESS,
          abi: DUST_AGGREGATOR_ABI,
          functionName: "depositDust",
          args: [tokenAddress, BigInt(Number(amount) * 10 ** decimals)],
          value: BigInt(Number(amount) * 10 ** decimals),
        });
      } else {
        await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [DUST_AGGREGATOR_ADDRESS, BigInt(Number(amount) * 10 ** decimals)],
        });
        await writeContractAsync({
          address: DUST_AGGREGATOR_ADDRESS,
          abi: DUST_AGGREGATOR_ABI,
          functionName: "depositDust",
          args: [tokenAddress, BigInt(Number(amount) * 10 ** decimals)],
        });
      }
      alert(`Deposited ${amount} of ${tokens.find((t) => t.address === tokenAddress)?.symbol} successfully!`);
      fetchDustAssets(account!);
    } catch (error) {
      console.error("Deposit failed:", error);
      alert("Deposit failed.");
    }
  };

  const swapDust = async () => {
    if (!isConnected || !account || selectedFromTokens.length === 0) return;
    setIsLoading(true);
    try {
      const tokenAddresses = selectedFromTokens.map((token) => token.address);
      const tokenOut = selectedToToken.address;
      await writeContractAsync({
        address: DUST_AGGREGATOR_ADDRESS,
        abi: DUST_AGGREGATOR_ABI,
        functionName: "swapDust",
        args: [tokenAddresses, tokenOut],
      });
      alert("Dust swapped successfully!");
      setSelectedFromTokens([]);
      setFromAmount("0");
      setToAmount("0");
      fetchDustAssets(account!);
    } catch (error) {
      console.error("Swap failed:", error);
      alert("Swap failed.");
    }
    setIsLoading(false);
  };

  const sendToWallet = async () => {
    if (!isConnected || !account) return;
    setIsLoading(true);
    try {
      alert(`Sent ${toAmount} ${selectedToToken.symbol} to wallet successfully!`);
      setShowConfirmSend(false);
      fetchDustAssets(account!);
    } catch (error) {
      console.error("Send to wallet failed:", error);
      alert("Send to wallet failed.");
    }
    setIsLoading(false);
  };

  const updateToAmount = (fromTokens: Token[]) => {
    const totalFromValue = fromTokens.reduce((sum, token) => {
      const value = Number.parseFloat(token.value.replace("$", ""));
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    setFromAmount(totalFromValue.toFixed(4));

    const fromValue = totalFromValue;
    const toTokenPrice = MOCK_TOKEN_PRICES[selectedToToken.symbol] || 1.0;
    const calculatedToAmount = fromValue > 0 ? (fromValue / toTokenPrice).toFixed(4) : "0.0000";
    setToAmount(isNaN(Number(calculatedToAmount)) ? "0.0000" : calculatedToAmount);
  };

  const handleFromTokenSelect = (token: Token) => {
    const isAlreadySelected = selectedFromTokens.some((t) => t.symbol === token.symbol);
    let newSelection: Token[];
    if (isAlreadySelected) {
      newSelection = selectedFromTokens.filter((t) => t.symbol !== token.symbol);
    } else {
      newSelection = [...selectedFromTokens, token];
    }
    setSelectedFromTokens(newSelection);
    updateToAmount(newSelection);
  };

  const handleToTokenSelect = (token: Token) => {
    setSelectedToToken(token);
    setIsToDropdownOpen(false);
    updateToAmount(selectedFromTokens);
  };

  const removeFromToken = (token: Token) => {
    const newSelection = selectedFromTokens.filter((t) => t.symbol !== token.symbol);
    setSelectedFromTokens(newSelection);
    updateToAmount(newSelection);
  };

  const handleConsolidate = async () => {
    if (!isConnected || !account) return;
    setIsLoading(true);
    try {
      for (const token of selectedFromTokens.filter((t) => t.address !== "0x0000000000000000000000000000000000000000")) {
        await writeContractAsync({
          address: token.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [DUST_AGGREGATOR_ADDRESS, BigInt(Number(token.balance) * 10 ** token.decimals)],
        });
      }

      for (const token of selectedFromTokens) {
        await depositDust(token.address, token.balance, token.decimals);
      }

      await swapDust();
      setShowConfirmSend(true);
    } catch (error) {
      console.error("Consolidation failed:", error);
      alert("Consolidation failed.");
    }
    setIsLoading(false);
  };

  const handleThresholdSelect = (threshold: (typeof thresholdOptions)[0]) => {
    setSelectedThreshold(threshold);
    setIsThresholdDropdownOpen(false);
    if (account) {
      fetchDustAssets(account);
    }
  };

  // const openModal = (modalType: ModalType) => {
  //   setActiveModal(modalType);
  // };

  // const closeModal = () => {
  //   setActiveModal(null);
  //   setLendAmount("");
  //   setBorrowAmount("");
  //   setStakeAmount("");
  // };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {isLoading && <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>}
      <div className="rounded-[20px] bg-white shadow-md dark:bg-gray-800">
        <div className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[#666666] dark:text-gray-400">Swap from</span>
            <div className="relative">
              <button
                onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
              >
                {selectedFromTokens.length > 1 ? (
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-2">
                      {selectedFromTokens.slice(0, 2).map((token, i) => (
                        <div
                          key={token.symbol}
                          className="flex h-[30px] w-[30px] items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-800"
                          style={{ backgroundColor: token.color, zIndex: 10 - i }}
                        >
                          {token.icon}
                        </div>
                      ))}
                    </div>
                    <span className="font-medium dark:text-white">{selectedFromTokens.length} tokens</span>
                  </div>
                ) : (
                  <>
                    <div
                      className="mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full"
                      style={{ backgroundColor: selectedFromTokens[0]?.color || "#2775CA" }}
                    >
                      {selectedFromTokens[0]?.icon || <USDCIcon />}
                    </div>
                    <span className="font-medium dark:text-white">{selectedFromTokens[0]?.symbol || "Select"}</span>
                  </>
                )}
                <ChevronDown className="ml-1 h-4 w-4 dark:text-gray-400" />
              </button>

              {isFromDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  <div className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Select dust tokens to consolidate
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {tokens.map((token) => {
                      const isSelected = selectedFromTokens.some((t) => t.symbol === token.symbol);
                      return (
                        <button
                          key={token.symbol}
                          onClick={() => handleFromTokenSelect(token)}
                          className={`flex w-full items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
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
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium dark:text-white">{token.balance}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{token.value}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-1">
            <input
              type="text"
              value={fromAmount}
              readOnly
              className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
            />
            <div className="text-sm text-[#666666] dark:text-gray-400">~${Number(fromAmount).toFixed(2)}</div>
          </div>

          {selectedFromTokens.length > 0 && (
            <div className="mt-2 mb-2">
              <div className="flex flex-wrap gap-1.5">
                {selectedFromTokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs dark:border-gray-700 dark:bg-gray-700"
                  >
                    <div
                      className="mr-1 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ backgroundColor: token.color }}
                    >
                      <span className="text-[8px] text-white">{token.icon}</span>
                    </div>
                    <span className="mr-1 dark:text-white">{token.symbol}</span>
                    <button
                      onClick={() => removeFromToken(token)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#666666] dark:text-gray-400">
              {selectedFromTokens.length > 1
                ? `${selectedFromTokens.length} tokens selected`
                : `${selectedFromTokens[0]?.balance || "0"} ${selectedFromTokens[0]?.symbol || ""} available`}
            </span>
            <div className="relative">
              <button
                onClick={() => setIsThresholdDropdownOpen(!isThresholdDropdownOpen)}
                className="flex items-center rounded-lg bg-[#6B48FF] px-3 py-1 text-xs font-medium text-white hover:bg-[#5a3dd9] transition-colors"
              >
                {selectedThreshold.label}
                <ChevronDown className="ml-1 h-3 w-3" />
              </button>

              {isThresholdDropdownOpen && (
                <div className="absolute right-0 mt-2 w-20 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  {thresholdOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => handleThresholdSelect(option)}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                        selectedThreshold.value === option.value
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "dark:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute -top-5 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <ArrowDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <hr className="w-full border-t border-gray-100 dark:border-gray-700" />
        </div>

        <div className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[#666666] dark:text-gray-400">To</span>
            <div className="relative">
              <button
                onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className="mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full"
                  style={{ backgroundColor: selectedToToken.color }}
                >
                  {selectedToToken.icon}
                </div>
                <span className="font-medium dark:text-white">{selectedToToken.symbol}</span>
                <ChevronDown className="ml-1 h-4 w-4 dark:text-gray-400" />
              </button>

              {isToDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  <div className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Select target token
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {availableTokens.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => handleToTokenSelect(token)}
                        className="flex w-full items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-3">
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
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium dark:text-white">{token.balance}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{token.value}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-1">
            <input
              type="text"
              value={toAmount}
              readOnly
              className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-xs text-[#666666] dark:text-gray-400">
              Estimated Fee: $0.30
              <Info className="ml-1 h-3 w-3" />
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          {!showConfirmSend ? (
            <button
              onClick={handleConsolidate}
              className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || selectedFromTokens.length === 0 || !isConnected}
            >
              Consolidate
            </button>
          ) : (
            <button
              onClick={sendToWallet}
              className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConnected}
            >
              Confirm Send to Wallet
            </button>
          )}
        </div>
      </div>

      {/* Commented out modal for lending, borrowing, staking
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium dark:text-white">
                {activeModal === "lend" && `Lend ${selectedToToken.symbol}`}
                {activeModal === "borrow" && `Borrow ${selectedToTokenSymbol}`}
                {activeModal === "stake" && `Stake ${selectedToToken}`}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 dark:text-gray-400">
              </button>
            </div>

            {activeModal === "lend" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
                  <h3 className="font-medium text-emerald-700 dark:text-emerald-400 mb-3">
Morpho Lending Pool</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Supply APY:</div>
                    <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">5.1%</div>
                    <div className="text-gray-600 dark:text-gray-400">Total Supply:</div>
                    <div className="text-right font-medium">$24.5M"></div>
                    <div className="text-gray-600 dark:text-gray-400">Utilization:</div>
                    <div className="text-right font-medium">68%</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Supply:</div>
                    <div className="text-right font-medium">0 {selectedToTokenSymbol}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supply Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lendAmount}
                      onChange={(e) => setLendAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-right w-full rounded-lg font-medium border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 pr-16 dark:text-white"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedToTokenSymbol}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Available: {selectedToToken.balance} {selectedToTokenSymbol}</span>
                    <button
                      onClick={() => setToAmount(selectedToToken.balance)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
Estimated Earnings</div>
                  <div className="font-medium dark:text-white">
                    {lendAmount ? ((parseFloat(lendAmount). * 5.1) / 100).toFixed(4) : "0.00"} {selectedToTokenSymbol}
                    /year
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Protocol fee: 10%</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button name="text"
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button name="text"
                    disabled={!lendAmount}
                    className="rounded-lg bg-emerald-600 py-2 dark:text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supply
                  </button>
                </div>
              </div>
            )}

            {activeModal === "borrow" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-3">
                    Morpho Borrowing
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Borrow APY:</div>
                    <div className="text-right font-medium text-blue-600 dark:text-blue-400">7.3%</div>
                    <div className="text-gray-600 dark:text-gray-400">Available:</div>
                    <div className="text-right font-medium">$12.3M"></div>
                    <div className="text-gray-600 dark:text-gray-400">Collateral Factor:</div>
                    <div className="text-right font-medium">75%</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Debt:</div>
                    <div className="text-right font-medium">0 {selectedToToken.symbol}></div>
                      </div>
                  </div>

                <div>
                  <label className="font-medium block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Borrow Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target)}value)}
                      placeholder="0.00"
                      className="w-full text-right text-sm font-medium border-rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 pr-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedToToken.symbol>}
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs mt-1">
                    <span>Max</span> {(parseFloat(toAmount) * 0.75).toFixed(2)} {selectedToToken.symbol>}
                    </span>
                    <button name="text"
                      onClick={() => setBorrowAmount((parseFloat(toAmount))) * 0.75).toFixed(2))}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      MAX
                    </button>
                  </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
Interest Cost</div>
                  <div className="font-medium dark:text-white">
                    {borrowAmount ? ((parseFloat(borrowAmount))) * 7.3) / 100).toFixed(2)} {selectedToTokenSymbol}
                    /year
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Health Factor:
                    <div className="text-right font-medium">{borrowAmount
                      ? (75 / ((parseFloat(borrowAmount)) / parseFloat(toAmount)) * 100)).toFixed(2)
                      : "∞"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!borrowAmount}
                    className="rounded-lg bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow
                  </button>
                </div>
              </div>
            )}

            {activeModal === "stake" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
                  <h3 className="font-medium text-purple-700 dark:text-purple-400 mb-3">Staking Pool</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Staking APY:</div>
                    <div className="text-right font-medium text-purple-600 dark:text-purple-400">50%</div>
                    <div className="text-gray-600 dark:text-gray-400">Total Staked:</div>
                    <div className="text-right font-medium">$18.2M</div>
                    <div className="text-gray-600 dark:text-gray-400">Lock Period:</div>
                    <div className="text-right font-medium">30 days</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Stake:</div>
                    <div className="text-right font-medium">0 {selectedToToken.symbol}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stake Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 pr-16 text-right dark:text-white"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedToToken.symbol}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Available: {selectedToToken.balance} {selectedToToken.symbol}</span>
                    <button
                      onClick={() => setStakeAmount(selectedToToken.balance)}
                      className="text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reward Breakdown</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Your Rewards:</span>
                      <span className="font-medium dark:text-white">
                        {stakeAmount ? (((parseFloat(stakeAmount) * 50) / 100) * 0.85).toFixed(4) : "0.0000"} {selectedToToken.symbol}/year
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fee (15%):</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {stakeAmount ? (((parseFloat(stakeAmount) * 50) / 100) * 0.15).toFixed(4) : "0.0000"} {selectedToToken.symbol}/year
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ Staked tokens are locked for 30 days. Early withdrawal incurs a 5% penalty.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!stakeAmount}
                    className="rounded-lg bg-purple-600 py-2 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Stake
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
};

function USDCIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.5 5.2C9.5 4.6 9 4.2 8.3 4.1V3H7.2V4.1C7 4.1 6.7 4.2 6.5 4.2C5.6 4.5 5 5.2 5 6.2C5 7.4 5.8 8 7 8.4L7.2 8.5V11C6.8 10.9 6.4 10.6 6.4 10.1H5C5 11.1 5.7 11.8 7.2 11.9V13H8.3V11.9C9.6 11.8 10.5 11.1 10.5 9.9C10.5 8.7 9.8 8.1 8.5 7.7L8.3 7.6V5.1C8.7 5.2 9 5.5 9 5.9H10.4C10.5 5.7 9.5 5.2 9.5 5.2ZM7.2 7.2L7.1 7.1C6.5 6.9 6.3 6.6 6.3 6.2C6.3 5.7 6.6 5.4 7.2 5.3V7.2ZM8.7 9.8C8.7 10.3 8.3 10.6 7.7 10.7V8.8L7.9 8.9C8.5 9.1 8.7 9.3 8.7 9.8Z"
        fill="white"
      />
    </svg>
  );
}

function DAIIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM10.5 10.5H8.5V11.5H7.5V10.5H5.5V9.5H7.5V8.5H5.5V7.5H7.5V6.5H8.5V7.5H10.5V8.5H8.5V9.5H10.5V10.5Z"
        fill="white"
      />
    </svg>
  );
}

function WETHIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.24902 2V6.435L11.9975 8.11L8.24902 2Z" fill="white" fillOpacity="0.602" />
      <path d="M8.249 2L4.5 8.11L8.249 6.435V2Z" fill="white" />
      <path d="M8.24902 10.9842V13.9975L12 8.80371L8.24902 10.9842Z" fill="white" fillOpacity="0.602" />
      <path d="M8.249 13.9975V10.9837L4.5 8.80371L8.249 13.9975Z" fill="white" />
      <path d="M8.24902 10.2855L11.9975 8.10352L8.24902 6.43652V10.2855Z" fill="white" fillOpacity="0.2" />
      <path d="M4.5 8.10352L8.249 10.2855V6.43652L4.5 8.10352Z" fill="white" fillOpacity="0.602" />
    </svg>
  );
}

function ETHIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0L0 8L8 16L16 8L8 0Z" fill="white" fillOpacity="0.602" />
      <path d="M8 0L0 8L8 10V0Z" fill="white" />
      <path d="M8 16L0 8L8 10V16Z" fill="white" fillOpacity="0.602" />
    </svg>
  );
}

export default CryptoSwap;