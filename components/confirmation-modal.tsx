"use client";

import React from "react";
import { X, AlertCircle } from "lucide-react";
import Image from "next/image";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    transaction: {
        type: "deposit" | "withdraw" | "pay";
        amount: string;
        token: string;
        fiatAmount: string;
        phone: string;
        recipientPhone?: string;
        provider: string;
        currency: string;
        note?: string;
    };
    isProcessing?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    transaction,
    isProcessing = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getTitle = () => {
        switch (transaction.type) {
            case "deposit":
                return "Confirm Deposit";
            case "withdraw":
                return "Confirm Withdrawal";
            case "pay":
                return "Confirm Payment";
        }
    };

    const getDescription = () => {
        switch (transaction.type) {
            case "deposit":
                return `You will receive ${transaction.amount} ${transaction.token} after payment confirmation`;
            case "withdraw":
                return `${transaction.fiatAmount} ${transaction.currency} will be sent to your ${transaction.provider} account`;
            case "pay":
                return `${transaction.amount} ${transaction.token} will be sent to ${transaction.recipientPhone}`;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-[20px] max-w-md w-full">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between rounded-t-[20px]">
                    <h2 className="text-lg font-bold dark:text-white">{getTitle()}</h2>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <img src="/assets/Logo/logo_main-removebg-preview.png" alt="SendiiCash" className="w-40 rounded-lg" />
                    </div>

                    {/* Alert */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                {getDescription()}
                            </p>
                        </div>
                    </div>

                    {/* Transaction Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 space-y-3">
                        {/* Amount */}
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Amount</span>
                            <div className="text-right">
                                <div className="font-bold text-lg dark:text-white">
                                    {transaction.amount} {transaction.token}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ≈ {transaction.fiatAmount} {transaction.currency}
                                </div>
                            </div>
                        </div>

                        {/* Provider */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-400">Provider</span>
                            <span className="font-medium dark:text-white">{transaction.provider}</span>
                        </div>

                        {/* Phone Number(s) */}
                        {transaction.type !== "pay" ? (
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">Phone Number</span>
                                <span className="font-medium dark:text-white">{transaction.phone}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                                    <span className="text-gray-600 dark:text-gray-400">From</span>
                                    <span className="font-medium dark:text-white">{transaction.phone}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                                    <span className="text-gray-600 dark:text-gray-400">To</span>
                                    <span className="font-medium dark:text-white">{transaction.recipientPhone}</span>
                                </div>
                            </>
                        )}

                        {/* Note (if exists) */}
                        {transaction.note && (
                            <div className="flex justify-between items-start pt-3 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">Note</span>
                                <span className="font-medium dark:text-white text-right max-w-[200px]">
                                    {transaction.note}
                                </span>
                            </div>
                        )}

                        {/* Transaction Type */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-400">Type</span>
                            <span className="font-medium dark:text-white capitalize">{transaction.type}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium dark:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className="flex-1 py-3 rounded-lg bg-[#6B48FF] text-white font-medium hover:bg-[#5a3dd9] transition-colors disabled:opacity-50"
                        >
                            {isProcessing ? "Processing..." : "Confirm"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
