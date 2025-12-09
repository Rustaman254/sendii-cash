"use client";

import { useState } from "react";
import OnrampOfframp from "@/components/onramp-offramp";
import TransactionHistory from "@/components/transaction-history";
import Header from "@/components/header";
import WagmiProviderWrapper from "./WagmiProviderWrapper";
import { ArrowLeftRight, History } from "lucide-react";

export default function Home() {
  const [activeView, setActiveView] = useState<"swap" | "history">("swap");

  return (
    <WagmiProviderWrapper>
      <main className="flex min-h-screen flex-col bg-[#ECECEC] dark:bg-gray-900">
        <Header />

        {/* Navigation Tabs */}
        <div className="flex justify-center pt-6 px-4">
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
            <button
              onClick={() => setActiveView("swap")}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${activeView === "swap"
                  ? "bg-[#6B48FF] text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Swap
            </button>
            <button
              onClick={() => setActiveView("history")}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${activeView === "history"
                  ? "bg-[#6B48FF] text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <History className="h-4 w-4" />
              History
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-4">
          {activeView === "swap" ? <OnrampOfframp /> : <TransactionHistory />}
        </div>
      </main>
    </WagmiProviderWrapper>
  );
}

