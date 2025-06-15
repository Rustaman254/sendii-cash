"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useSwitchChain, useEstimateGas } from "wagmi";
import Moralis from "moralis";
import { ArrowDown, ChevronDown, Info, X } from "lucide-react";
import type { JSX } from "react/jsx-runtime";
import { erc20Abi, formatEther, encodeFunctionData } from "viem";

const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImI3Yjk2Y2M4LTcxYTQtNDAyYi1hZTNmLTYzZjU0NDlmZDk2YyIsIm9yZ0lkIjoiNDUzOTQ5IiwidXNlcklkIjoiNDY3MDUxIiwidHlwZUlkIjoiYjQ3Y2IwODYtNWEwNy00MzZjLWE4OWUtZDQwYTU5NjE1NTBkIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDk5MTcyMTUsImV4cCI6NDkwNTY3NzIxNX0.BkhhOqwKCOi2Eul58baCHMKyQ97vWd4bmTTdRSFvlSc";

const MOCK_TOKEN_PRICES: { [key: string]: number } = {
  USDC: 1.0,
  DAI: 1.0,
  WETH: 2000.0,
  ETH: 2000.0,
};

const TOKEN_LIST = [
  { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`, decimals: 6 },
  { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917EF0Cb" as `0x${string}`, decimals: 18 },
  // { symbol: "WETH", address: "0x4200000000000000000000000000000000000006" as `0x${string}`, decimals: 18 },
  { symbol: "ETH", address: "0x0000000000000000000000000000000000000000" as `0x${string}`, decimals: 18 },
];

const DUST_AGGREGATOR_ADDRESS = "0x4B09cb9a3930df1aD6C92D49dcA395F9714a773d" as `0x${string}`;
const DUST_AGGREGATOR_ABI = [
  {
    inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
    name: "depositDust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "tokens", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "depositDustBatch",
    outputs: [],
    stateMutability: "payable",
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
      { indexed: false, name: "tokens", type: "address[]" },
      { indexed: false, name: "amounts", type: "uint256[]" },
    ],
    name: "DustBatchDeposited",
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

function useEstimateConsolidationGas(
  selectedFromTokens: Token[],
  selectedToToken: Token,
  account: `0x${string}` | undefined,
  isConnected: boolean,
) {
  const [estimatedGas, setEstimatedGas] = useState<string>("0");

  useEffect(() => {
    if (!isConnected || !account || selectedFromTokens.length === 0) {
      setEstimatedGas("0");
      return;
    }

    const estimateGas = async () => {
      try {
        let totalGas = BigInt(0);
        const tokens = selectedFromTokens.map((token) => token.address);
        const amounts = selectedFromTokens.map((token) =>
          BigInt(Number(token.balance) * 10 ** token.decimals),
        );
        const ethAmount = selectedFromTokens
          .filter((token) => token.address === "0x0000000000000000000000000000000000000000")
          .reduce((sum, token) => sum + Number(token.balance) * 10 ** token.decimals, 0);

        // Check allowances for ERC-20 tokens
        for (const token of selectedFromTokens.filter(
          (t) => t.address !== "0x0000000000000000000000000000000000000000",
        )) {
          const amount = BigInt(Number(token.balance) * 10 ** token.decimals);
          const { data: allowance } = useReadContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [account, DUST_AGGREGATOR_ADDRESS],
          });
          if (!allowance || allowance < amount) {
            const calldata = encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [DUST_AGGREGATOR_ADDRESS, amount],
            });
            const { data: gas } = useEstimateGas({
              to: token.address,
              data: calldata,
              account,
            });
            if (gas) totalGas += gas;
          }
        }

        // Estimate gas for batch deposit
        const depositCalldata = encodeFunctionData({
          abi: DUST_AGGREGATOR_ABI,
          functionName: "depositDustBatch",
          args: [tokens, amounts],
        });
        const { data: depositGas } = useEstimateGas({
          to: DUST_AGGREGATOR_ADDRESS,
          data: depositCalldata,
          value: BigInt(ethAmount),
          account,
        });
        if (depositGas) totalGas += depositGas;

        // Estimate gas for swap
        const swapCalldata = encodeFunctionData({
          abi: DUST_AGGREGATOR_ABI,
          functionName: "swapDust",
          args: [tokens, selectedToToken.address],
        });
        const { data: swapGas } = useEstimateGas({
          to: DUST_AGGREGATOR_ADDRESS,
          data: swapCalldata,
          account,
        });
        if (swapGas) totalGas += swapGas;

        setEstimatedGas(formatEther(totalGas * BigInt(1 * 10 ** 9))); 
      } catch (error) {
        console.error("Gas estimation failed:", error);
        setEstimatedGas("0");
      }
    };

    estimateGas();
  }, [selectedFromTokens, selectedToToken, account, isConnected]);

  return estimatedGas;
}

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
  const [selectedThreshold, setSelectedThreshold] = useState(thresholdOptions[0]);
  const [isThresholdDropdownOpen, setIsThresholdDropdownOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>(availableTokens);
  const [isLoading, setIsLoading] = useState(false);

  // Use custom hook for gas estimation
  const estimatedGas = useEstimateConsolidationGas(selectedFromTokens, selectedToToken, account, isConnected);

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

  const checkAllowance = async (tokenAddress: `0x${string}`, amount: bigint) => {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") return true;
    const { data: allowance } = useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account!, DUST_AGGREGATOR_ADDRESS],
    });
    return allowance && allowance >= amount;
  };

  const depositDustBatch = async () => {
    if (!isConnected || !account || selectedFromTokens.length === 0) return;
    try {
      const tokens = selectedFromTokens.map((token) => token.address);
      const amounts = selectedFromTokens.map((token) =>
        BigInt(Number(token.balance) * 10 ** token.decimals),
      );
      const ethAmount = selectedFromTokens
        .filter((token) => token.address === "0x0000000000000000000000000000000000000000")
        .reduce((sum, token) => sum + Number(token.balance) * 10 ** token.decimals, 0);

      await writeContractAsync({
        address: DUST_AGGREGATOR_ADDRESS,
        abi: DUST_AGGREGATOR_ABI,
        functionName: "depositDustBatch",
        args: [tokens, amounts],
        value: BigInt(ethAmount),
      });
      alert(`Deposited ${selectedFromTokens.length} tokens successfully!`);
      fetchDustAssets(account!);
    } catch (error) {
      console.error("Batch deposit failed:", error);
      throw error;
    }
  };

  const swapDust = async () => {
    if (!isConnected || !account || selectedFromTokens.length === 0) return;
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
      throw error;
    }
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
      // Calculate ETH amount to deposit
      const ethToken = selectedFromTokens.find(
        (token) => token.address === "0x0000000000000000000000000000000000000000",
      );
      const ethAmount = ethToken ? BigInt(Number(ethToken.balance) * 10 ** ethToken.decimals) : BigInt(0);

      // Get current ETH balance
      const moralisChain = chainId === 8453 ? "0x2105" : "0x14a34";
      const nativeResponse = await Moralis.EvmApi.balance.getNativeBalance({
        chain: moralisChain,
        address: account,
      });
      const ethBalance = BigInt(nativeResponse.toJSON().balance);

      // Convert estimatedGas to Wei
      const gasInWei = BigInt(Math.ceil(Number(estimatedGas) * 10 ** 18));

      // Check if enough ETH remains for gas
      if (ethBalance < ethAmount + gasInWei) {
        alert(
          `Insufficient ETH for gas fees. You need at least ${(Number(formatEther(ethAmount + gasInWei))).toFixed(6)} ETH, but you have ${formatEther(ethBalance)} ETH.`,
        );
        setIsLoading(false);
        return;
      }

      // Approve ERC-20 tokens if needed
      for (const token of selectedFromTokens.filter(
        (t) => t.address !== "0x0000000000000000000000000000000000000000",
      )) {
        const amount = BigInt(Number(token.balance) * 10 ** token.decimals);
        const hasEnoughAllowance = await checkAllowance(token.address, amount);
        if (!hasEnoughAllowance) {
          await writeContractAsync({
            address: token.address,
            abi: erc20Abi,
            functionName: "approve",
            args: [DUST_AGGREGATOR_ADDRESS, amount],
          });
        }
      }

      // Batch deposit
      await depositDustBatch();

      // Swap dust
      await swapDust();

      setShowConfirmSend(true);
    } catch (error: any) {
      console.error("Consolidation failed:", error);
      if (error.message.includes("User denied transaction signature")) {
        alert("Transaction was rejected. Please approve the transaction in your wallet.");
      } else {
        alert("Consolidation failed. Please try again.");
      }
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
                    {tokens.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        No tokens with non-zero balance available.
                      </div>
                    ) : (
                      tokens.map((token) => {
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
                      })
                    )}
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
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
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
                            <div className="text-sm text-gray-500 dark:text-gray-400">{token.name}</div>
                          </div>
                        </div>
                        {/* <div className="text-right">
                          <div className="text-sm font-medium dark:text-white">{token.balance}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{token.value}</div>
                        </div> */}
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
            <div className="flex items-center text-xs text-sm text-gray-500 dark:text-gray-400">
              Estimated Gas Fee: {Number(estimatedGas).toFixed(4)} ETH (~${(Number(estimatedGas) * 2000).toFixed(2)})
              <Info className="ml-1 text-sm" />
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
              Confirm Consolidation
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
    </div>
  );
};

function USDCIcon() {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" data-name="86977684-12db-4850-8f30-233a7c267d11" viewBox="0 0 2000 2000">
    <path d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z" fill="#2775ca"/>
    <path d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z" fill="#fff"/>
    <path d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z" fill="#fff"/>
  </svg>
  );
}

function DAIIcon() {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" version="1.1" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 444.44 444.44">
  <g id="Layer_x0020_1">
    <metadata id="CorelCorpID_0Corel-Layer"/>
    <path fill="#F5AC37" fill-rule="nonzero" d="M222.22 0c122.74,0 222.22,99.5 222.22,222.22 0,122.74 -99.48,222.22 -222.22,222.22 -122.72,0 -222.22,-99.49 -222.22,-222.22 0,-122.72 99.5,-222.22 222.22,-222.22z"/>
    <path fill="#FEFEFD" fill-rule="nonzero" d="M230.41 237.91l84.44 0c1.8,0 2.65,0 2.78,-2.36 0.69,-8.59 0.69,-17.23 0,-25.83 0,-1.67 -0.83,-2.36 -2.64,-2.36l-168.05 0c-2.08,0 -2.64,0.69 -2.64,2.64l0 24.72c0,3.19 0,3.19 3.33,3.19l82.78 0zm77.79 -59.44c0.24,-0.63 0.24,-1.32 0,-1.94 -1.41,-3.07 -3.08,-6 -5.02,-8.75 -2.92,-4.7 -6.36,-9.03 -10.28,-12.92 -1.85,-2.35 -3.99,-4.46 -6.39,-6.25 -12.02,-10.23 -26.31,-17.47 -41.67,-21.11 -7.75,-1.74 -15.67,-2.57 -23.61,-2.5l-74.58 0c-2.08,0 -2.36,0.83 -2.36,2.64l0 49.3c0,2.08 0,2.64 2.64,2.64l160.27 0c0,0 1.39,-0.28 1.67,-1.11l-0.68 0zm0 88.33c-2.36,-0.26 -4.74,-0.26 -7.1,0l-154.02 0c-2.08,0 -2.78,0 -2.78,2.78l0 48.2c0,2.22 0,2.78 2.78,2.78l71.11 0c3.4,0.26 6.8,0.02 10.13,-0.69 10.32,-0.74 20.47,-2.98 30.15,-6.67 3.52,-1.22 6.92,-2.81 10.13,-4.72l0.97 0c16.67,-8.67 30.21,-22.29 38.75,-39.01 0,0 0.97,-2.1 -0.12,-2.65zm-191.81 78.75l0 -0.83 0 -32.36 0 -10.97 0 -32.64c0,-1.81 0,-2.08 -2.22,-2.08l-30.14 0c-1.67,0 -2.36,0 -2.36,-2.22l0 -26.39 32.22 0c1.8,0 2.5,0 2.5,-2.36l0 -26.11c0,-1.67 0,-2.08 -2.22,-2.08l-30.14 0c-1.67,0 -2.36,0 -2.36,-2.22l0 -24.44c0,-1.53 0,-1.94 2.22,-1.94l29.86 0c2.08,0 2.64,0 2.64,-2.64l0 -74.86c0,-2.22 0,-2.78 2.78,-2.78l104.16 0c7.56,0.3 15.07,1.13 22.5,2.5 15.31,2.83 30.02,8.3 43.47,16.11 8.92,5.25 17.13,11.59 24.44,18.89 5.5,5.71 10.46,11.89 14.86,18.47 4.37,6.67 8,13.8 10.85,21.25 0.35,1.94 2.21,3.25 4.15,2.92l24.86 0c3.19,0 3.19,0 3.33,3.06l0 22.78c0,2.22 -0.83,2.78 -3.06,2.78l-19.17 0c-1.94,0 -2.5,0 -2.36,2.5 0.76,8.46 0.76,16.95 0,25.41 0,2.36 0,2.64 2.65,2.64l21.93 0c0.97,1.25 0,2.5 0,3.76 0.14,1.61 0.14,3.24 0,4.85l0 16.81c0,2.36 -0.69,3.06 -2.78,3.06l-26.25 0c-1.83,-0.35 -3.61,0.82 -4.03,2.64 -6.25,16.25 -16.25,30.82 -29.17,42.5 -4.72,4.25 -9.68,8.25 -14.86,11.94 -5.56,3.2 -10.97,6.53 -16.67,9.17 -10.49,4.72 -21.49,8.2 -32.78,10.41 -10.72,1.92 -21.59,2.79 -32.5,2.64l-96.39 0 0 -0.14z"/>
  </g>
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
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" version="1.1" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 784.37 1277.39">
    <g id="Layer_x0020_1">
      <metadata id="CorelCorpID_0Corel-Layer"/>
      <g id="_1421394342400">
      <g>
        <polygon fill="#343434" fill-rule="nonzero" points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54 "/>
        <polygon fill="#8C8C8C" fill-rule="nonzero" points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33 "/>
        <polygon fill="#3C3C3B" fill-rule="nonzero" points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89 "/>
        <polygon fill="#8C8C8C" fill-rule="nonzero" points="392.07,1277.38 392.07,956.52 -0,724.89 "/>
        <polygon fill="#141414" fill-rule="nonzero" points="392.07,882.29 784.13,650.54 392.07,472.33 "/>
        <polygon fill="#393939" fill-rule="nonzero" points="0,650.54 392.07,882.29 392.07,472.33 "/>
      </g>
      </g>
    </g>
    </svg>
  );
}

export default CryptoSwap;