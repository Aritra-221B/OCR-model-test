"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ocr/file-upload";
import { DocumentList, Document } from "@/components/ocr/document-list";
import { ExpenseForm, ExpenseFormData } from "@/components/ocr/expense-form";
import { ExpenseClassifier, OCRResult } from "@/components/ocr/expense-classifier";

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
  const [ocrData, setOcrData] = useState<OCRResult | null>({
    "agencyName": "Horizon Housing Realty Ltd",
    "folioNumber": "OWN05518",
    "properties": [
      {
        "propertyName": "1/35 Hurley St, Pimpama QLD",
        "lineItems": [
          {
            "description": "Rent",
            "moneyIn": "14680.00",
            "moneyOut": null
          },
          {
            "description": "Landlord Protection Insurance",
            "moneyIn": null,
            "moneyOut": "1795.00"
          },
          {
            "description": "Administration Expenses",
            "moneyIn": null,
            "moneyOut": "1.00"
          },
          {
            "description": "Plumbing",
            "moneyIn": null,
            "moneyOut": "209.00"
          },
          {
            "description": "Management Fee",
            "moneyIn": null,
            "moneyOut": "1291.84"
          },
          {
            "description": "Pest Control",
            "moneyIn": null,
            "moneyOut": "180.00"
          },
          {
            "description": "Council - Rates",
            "moneyIn": null,
            "moneyOut": "1816.52"
          },
          {
            "description": "Council - Water",
            "moneyIn": null,
            "moneyOut": "1018.23"
          }
        ]
      },
      {
        "propertyName": "2a/35 Hurley St, Pimpama QLD",
        "lineItems": [
          {
            "description": "Rent",
            "moneyIn": "12760.00",
            "moneyOut": null
          },
          {
            "description": "Administration Expenses",
            "moneyIn": null,
            "moneyOut": "1.00"
          },
          {
            "description": "Management Fee",
            "moneyIn": null,
            "moneyOut": "1122.88"
          },
          {
            "description": "Pest Control",
            "moneyIn": null,
            "moneyOut": "180.00"
          },
          {
            "description": "Rent",
            "moneyIn": "1500.00",
            "moneyOut": null
          },
          {
            "description": "Letting Fee",
            "moneyIn": null,
            "moneyOut": "319.00"
          },
          {
            "description": "Management Fee",
            "moneyIn": null,
            "moneyOut": "148.50"
          }
        ]
      }
    ]
  } as unknown as OCRResult);

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

      // Update OCR data from API if available (assuming API aligns, otherwise keep mock for now or update logic)
      if (data.properties) {
        setOcrData(data as OCRResult);
      }

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

        <ExpenseClassifier ocrData={ocrData} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <ExpenseForm initialData={extractedData} />
        </div>

        <DocumentList documents={documents} />
      </div>
    </div>
  );
}
