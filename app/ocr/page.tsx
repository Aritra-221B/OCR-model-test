"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ocr/file-upload";
import { DocumentList, Document } from "@/components/ocr/document-list";
import { ExpenseForm, ExpenseFormData } from "@/components/ocr/expense-form";

export default function OCRPage() {
    const [documents, setDocuments] = useState<Document[]>([
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
    ]);

    const [extractedData, setExtractedData] = useState<Partial<ExpenseFormData>>({});

    const handleFileSelect = async (file: File) => {
        const tempId = Math.random().toString(36).substring(7);
        const newDoc: Document = {
            id: tempId,
            fileName: file.name,
            vendor: "-",
            amount: "-",
            category: "-",
            confidence: 0,
            uploadDate: new Date().toLocaleDateString("en-GB"),
            status: "processing",
            acceptanceStatus: "pending",
        };

        setDocuments((prev) => [newDoc, ...prev]);
        setExtractedData({}); // Reset form data on new upload

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/process-document", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();

            // Update document list
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === tempId
                        ? {
                            ...doc,
                            status: "success",
                            vendor: data.vendor || "Unknown",
                            amount: data.amount || "-",
                            category: data.category || "Uncategorized",
                            confidence: data.confidence,
                        }
                        : doc
                )
            );

            // Update form data
            setExtractedData({
                expenseDate: data.expenseDate,
                property: data.property,
                category: data.category,
                amount: data.amount,
                propertyType: data.propertyType,
                description: data.description,
            });

        } catch (error) {
            console.error("Error processing document:", error);
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === tempId
                        ? { ...doc, status: "failed" }
                        : doc
                )
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
                    <p className="text-lg text-gray-600">
                        Upload receipts, invoices, or bills to automatically extract expense
                        data
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <FileUpload onFileSelect={handleFileSelect} />
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <ExpenseForm initialData={extractedData} />
                </div>

                <DocumentList documents={documents} />
            </div>
        </div>
    );
}
