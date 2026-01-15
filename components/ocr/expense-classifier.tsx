"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";

interface LineItem {
    description: string;
    moneyIn: string | null;
    moneyOut: string | null;
}

interface Property {
    propertyName: string;
    lineItems: LineItem[];
}

export interface OCRResult {
    agencyName: string;
    folioNumber: string;
    properties: Property[];
}

interface ExpenseClassifierProps {
    ocrData?: OCRResult | null;
}

export function ExpenseClassifier({ ocrData }: ExpenseClassifierProps) {
    const [selectedProperty, setSelectedProperty] = useState<string>("");
    const [selectedDescription, setSelectedDescription] = useState<string>("");

    // Reset description when property changes
    useEffect(() => {
        setSelectedDescription("");
    }, [selectedProperty]);

    const properties = useMemo(() => {
        return ocrData?.properties || [];
    }, [ocrData]);

    const currentProperty = useMemo(() => {
        return properties.find((p) => p.propertyName === selectedProperty);
    }, [properties, selectedProperty]);

    const lineItems = useMemo(() => {
        return currentProperty?.lineItems || [];
    }, [currentProperty]);

    const currentLineItem = useMemo(() => {
        return lineItems.find((item) => item.description === selectedDescription);
    }, [lineItems, selectedDescription]);

    const classifierResult = useMemo(() => {
        if (!currentLineItem) return null;

        if (currentLineItem.moneyIn) {
            return {
                type: "Income",
                amount: currentLineItem.moneyIn,
            };
        } else if (currentLineItem.moneyOut) {
            return {
                type: "Expense",
                amount: currentLineItem.moneyOut,
            };
        }
        return null;
    }, [currentLineItem]);

    if (!ocrData) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Expense Classifier
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800">
                        Select Property
                    </label>
                    <div className="relative">
                        <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900 font-medium"
                        >
                            <option value="">Select Property</option>
                            {properties.map((prop, idx) => (
                                <option key={idx} value={prop.propertyName}>
                                    {prop.propertyName}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Transaction Type Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800">
                        Transaction Type
                    </label>
                    <div className="relative">
                        <select
                            value={selectedDescription}
                            onChange={(e) => setSelectedDescription(e.target.value)}
                            disabled={!selectedProperty}
                            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200 text-gray-900 font-medium"
                        >
                            <option value="">Select Type</option>
                            {lineItems.map((item, idx) => (
                                <option key={idx} value={item.description}>
                                    {item.description}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Calculated Results */}
                {classifierResult && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-800">
                                Income/Expense
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-900">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm ${classifierResult.type === "Income"
                                        ? "bg-green-100 text-green-800 border border-green-200"
                                        : "bg-red-100 text-red-800 border border-red-200"
                                        }`}
                                >
                                    {classifierResult.type}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-800">
                                Amount
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-900 font-bold font-mono text-lg tracking-tight">
                                ${classifierResult.amount}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
