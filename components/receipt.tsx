"use client";

import React from "react";
import { X, CheckCircle, Download, Share2 } from "lucide-react";
import Image from "next/image";

interface ReceiptProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: {
        type: "deposit" | "withdraw" | "pay";
        amount: string;
        token: string;
        fiatAmount: string;
        phone: string;
        recipientPhone?: string;
        provider: string;
        transactionId: string;
        timestamp: Date;
        status: "success" | "pending" | "failed";
        note?: string;
    };
}

export default function Receipt({ isOpen, onClose, transaction }: ReceiptProps) {
    if (!isOpen) return null;

    const getStatusColor = () => {
        switch (transaction.status) {
            case "success":
                return "text-green-600 dark:text-green-400";
            case "pending":
                return "text-yellow-600 dark:text-yellow-400";
            case "failed":
                return "text-red-600 dark:text-red-400";
        }
    };

    const getStatusText = () => {
        switch (transaction.status) {
            case "success":
                return "Transaction Successful";
            case "pending":
                return "Transaction Pending";
            case "failed":
                return "Transaction Failed";
        }
    };

    const handleDownload = () => {
        // Mock download functionality
        alert("Receipt download functionality - to be implemented");
    };

    const handleShare = () => {
        // Mock share functionality
        alert("Receipt share functionality - to be implemented");
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-[20px] max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between rounded-t-[20px]">
                    <h2 className="text-lg font-bold dark:text-white">Transaction Receipt</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Status Icon */}
                    <div className="flex flex-col items-center mb-6">
                        {transaction.status === "success" && (
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        )}
                        <h3 className={`text-xl font-bold ${getStatusColor()}`}>
                            {getStatusText()}
                        </h3>
                    </div>

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img src="/assets/Logo/logo_main-removebg-preview.png" alt="SendiiCash" className="w-40 rounded-lg" />
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <div className="text-center mb-2">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Amount</div>
                                <div className="text-3xl font-bold dark:text-white">
                                    {transaction.amount} {transaction.token}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    ≈ {transaction.fiatAmount}
                                </div>
                            </div>
                        </div>

                        {/* Transaction Type */}
                        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Type</span>
                            <span className="font-medium dark:text-white capitalize">
                                {transaction.type}
                            </span>
                        </div>

                        {/* Payment Provider */}
                        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Provider</span>
                            <span className="font-medium dark:text-white">{transaction.provider}</span>
                        </div>

                        {/* Phone Number */}
                        {transaction.type !== "pay" && (
                            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Phone Number</span>
                                <span className="font-medium dark:text-white">{transaction.phone}</span>
                            </div>
                        )}

                        {/* Recipient (for Pay) */}
                        {transaction.type === "pay" && (
                            <>
                                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">From</span>
                                    <span className="font-medium dark:text-white">{transaction.phone}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">To</span>
                                    <span className="font-medium dark:text-white">{transaction.recipientPhone}</span>
                                </div>
                            </>
                        )}

                        {/* Note (if exists) */}
                        {transaction.note && (
                            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Note</span>
                                <span className="font-medium dark:text-white text-right max-w-[200px]">
                                    {transaction.note}
                                </span>
                            </div>
                        )}

                        {/* Transaction ID */}
                        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
                            <span className="font-medium dark:text-white font-mono text-sm">
                                {transaction.transactionId}
                            </span>
                        </div>

                        {/* Date & Time */}
                        <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Date & Time</span>
                            <span className="font-medium dark:text-white">
                                {transaction.timestamp.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            <span className="font-medium dark:text-white">Download</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="font-medium dark:text-white">Share</span>
                        </button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-3 py-3 rounded-lg bg-[#6B48FF] text-white font-medium hover:bg-[#5a3dd9] transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
