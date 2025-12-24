"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExpenseFormData {
    expenseDate: string;
    property: string;
    category: string;
    amount: string;
    propertyType: string;
    description: string;
}

interface ExpenseFormProps {
    initialData?: Partial<ExpenseFormData>;
}

export function ExpenseForm({ initialData }: ExpenseFormProps) {
    const [formData, setFormData] = useState<ExpenseFormData>({
        expenseDate: "",
        property: "",
        category: "",
        amount: "",
        propertyType: "",
        description: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({
                ...prev,
                ...initialData,
            }));
        }
    }, [initialData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Expense Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expense Date */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Expense Date<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            name="expenseDate"
                            value={formData.expenseDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {/* <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" /> */}
                    </div>
                </div>

                {/* Select Property */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Select Property<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            name="property"
                            value={formData.property}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="">Select Property</option>
                            <option value="1/35 Hurley St, Pimpama QLD">1/35 Hurley St, Pimpama QLD</option>
                            <option value="2a/35 Hurley St, Pimpama QLD">2a/35 Hurley St, Pimpama QLD</option>
                            <option value="37 Coveny St, Doonside NSW">37 Coveny St, Doonside NSW</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Select Category */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Select Category<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="">Select Category</option>
                            <option value="Management Fee">Management Fee</option>
                            <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                            <option value="Rates & Taxes">Rates & Taxes</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Utilities">Utilities</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Amount inclusive GST */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Amount inclusive GST<span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="amount"
                        placeholder="Amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Property Type
                    </label>
                    <input
                        type="text"
                        name="propertyType"
                        placeholder="Property Type"
                        value={formData.propertyType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Description */}
            <div className="mt-6 space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Description(Optional)
                </label>
                <textarea
                    name="description"
                    placeholder="Description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
            </div>

            <div className="mt-8 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
                    Save
                </button>
            </div>
        </div>
    );
}
