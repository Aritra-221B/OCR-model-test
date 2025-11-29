"use client";

import { FileUpload } from "@/components/ocr/file-upload";
import { DocumentList } from "@/components/ocr/document-list";

export default function OCRPage() {
    const handleFileSelect = (file: File) => {
        console.log("File selected:", file.name);
        // TODO: Implement file upload logic
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

                <DocumentList />
            </div>
        </div>
    );
}
