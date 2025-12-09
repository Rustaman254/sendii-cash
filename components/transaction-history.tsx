"use client";

import React from "react";
import { CheckCircle, Clock, XCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transaction {
    id: string;
    type: "onramp" | "offramp";
    amount: string;
    token: string;
    kesAmount: string;
    phone: string;
    status: "pending" | "completed" | "failed";
    timestamp: Date;
}

const mockTransactions: Transaction[] = [
    {
        id: "1",
        type: "onramp",
        amount: "100.00",
        token: "USDC",
        kesAmount: "15,000",
        phone: "+254712345678",
        status: "completed",
        timestamp: new Date(Date.now() - 3600000),
    },
    {
        id: "2",
        type: "offramp",
        amount: "50.00",
        token: "USDT",
        kesAmount: "7,500",
        phone: "+254798765432",
        status: "pending",
        timestamp: new Date(Date.now() - 1800000),
    },
    {
        id: "3",
        type: "onramp",
        amount: "200.00",
        token: "DAI",
        kesAmount: "30,000",
        phone: "+254712345678",
        status: "completed",
        timestamp: new Date(Date.now() - 86400000),
    },
];

export default function TransactionHistory() {
    const getStatusIcon = (status: Transaction["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "pending":
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case "failed":
                return <XCircle className="h-5 w-5 text-red-500" />;
        }
    };

    const getStatusBadge = (status: Transaction["status"]) => {
        const styles = {
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="rounded-[20px] bg-white shadow-md dark:bg-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Transaction History</h2>

                <div className="space-y-3">
                    {mockTransactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${tx.type === "onramp"
                                        ? "bg-green-100 dark:bg-green-900/30"
                                        : "bg-blue-100 dark:bg-blue-900/30"
                                    }`}>
                                    {tx.type === "onramp" ? (
                                        <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <ArrowUpRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>

                                <div>
                                    <div className="font-medium dark:text-white">
                                        {tx.type === "onramp" ? "Bought" : "Sold"} {tx.amount} {tx.token}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        KES {tx.kesAmount} • {tx.phone}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatTime(tx.timestamp)}
                                    </div>
                                    <div className="mt-1">
                                        {getStatusBadge(tx.status)}
                                    </div>
                                </div>
                                {getStatusIcon(tx.status)}
                            </div>
                        </div>
                    ))}
                </div>

                {mockTransactions.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No transactions yet
                    </div>
                )}
            </div>
        </div>
    );
}
