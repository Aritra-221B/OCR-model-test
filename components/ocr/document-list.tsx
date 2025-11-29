"use client";

import {
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Trash2,
    MoreVertical,
    DollarSign,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProcessingStatus = "success" | "failed" | "processing";
type AcceptanceStatus = "accepted" | "rejected" | "pending";

interface Document {
    id: string;
    fileName: string;
    vendor: string;
    amount: string;
    category: string;
    confidence: number;
    uploadDate: string;
    status: ProcessingStatus;
    acceptanceStatus: AcceptanceStatus;
}

const mockDocuments: Document[] = [
    {
        id: "1",
        fileName: "receipt_home_depot_jan.jpg",
        vendor: "Home Depot",
        amount: "$245.67",
        category: "Maintenance",
        confidence: 95,
        uploadDate: "18/01/2024",
        status: "success",
        acceptanceStatus: "accepted",
    },
    {
        id: "2",
        fileName: "utility_bill_december.pdf",
        vendor: "Pacific Gas & Electric",
        amount: "$187.34",
        category: "Utilities",
        confidence: 98,
        uploadDate: "15/01/2024",
        status: "success",
        acceptanceStatus: "pending",
    },
    {
        id: "3",
        fileName: "repair_invoice.jpg",
        vendor: "-",
        amount: "-",
        category: "-",
        confidence: 0,
        uploadDate: "20/01/2024",
        status: "processing",
        acceptanceStatus: "pending",
    },
    {
        id: "4",
        fileName: "insurance_premium.pdf",
        vendor: "-",
        amount: "-",
        category: "-",
        confidence: 0,
        uploadDate: "12/01/2024",
        status: "failed",
        acceptanceStatus: "rejected",
    },
];

export function DocumentList() {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">History</h2>
                <div className="flex gap-2">
                    {/* Placeholder for filters or search if needed */}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">File Name</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Confidence</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Acceptance</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {mockDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    {doc.status === "success" && (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    )}
                                    {doc.status === "processing" && (
                                        <Clock className="w-5 h-5 text-yellow-500" />
                                    )}
                                    {doc.status === "failed" && (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {doc.fileName}
                                </td>
                                <td className="px-6 py-4">{doc.vendor}</td>
                                <td className="px-6 py-4">{doc.amount}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {doc.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {doc.status === "success" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {doc.confidence}%
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">{doc.uploadDate}</td>
                                <td className="px-6 py-4">
                                    {doc.acceptanceStatus === "accepted" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Accepted
                                        </span>
                                    )}
                                    {doc.acceptanceStatus === "rejected" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Rejected
                                        </span>
                                    )}
                                    {doc.acceptanceStatus === "pending" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
