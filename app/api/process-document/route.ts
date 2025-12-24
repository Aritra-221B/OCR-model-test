import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";

// Mock Property Database
const MOCK_PROPERTIES = [
    {
        id: "prop_1",
        name: "123 George St, Sydney",
        address: "123 George St, Sydney NSW 2000",
        abn: "12 345 678 901", // Mock ABN associated with this property's expenses
    },
    {
        id: "prop_2",
        name: "456 Smith St, Melbourne",
        address: "456 Smith St, Melbourne VIC 3000",
        abn: "98 765 432 109",
    },
];

interface ExtractedData {
    date: string | null;
    amount: string | null;
    vendor: string | null;
    category: string | null;
    abn: string | null;
    propertyId: string | null;
    propertyName: string | null;
    lineItems: any[];
    rawText: string;
}

// Helper to extract data using Regex
function extractData(text: string): ExtractedData {
    const lines = text.split("\n");
    let date = null;
    let amount = null;
    let vendor = null;
    let category = "Uncategorized";
    let abn = null;
    let propertyId = null;
    let propertyName = null;
    const lineItems = [];

    // Regex Patterns
    const datePattern = /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/;
    const amountPattern = /\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/;
    const abnPattern = /\b(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/;

    // Keywords for categorization
    const categoryKeywords: { [key: string]: string } = {
        "management fee": "Management Fees",
        "rent": "Rent",
        "repair": "Repairs & Maintenance",
        "plumbing": "Repairs & Maintenance",
        "electrical": "Repairs & Maintenance",
        "council rates": "Council Rates",
        "water": "Water Charges",
        "insurance": "Insurance",
        "interest": "Loan Interest",
    };

    // 1. Extract ABN
    const abnMatch = text.match(abnPattern);
    if (abnMatch) {
        abn = abnMatch[0].replace(/\s/g, "");
    }

    // 2. Extract Date (First valid date found)
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
        let expenseDate = dateMatch[0];
        // Try to standardize date format to YYYY-MM-DD
        const parts = expenseDate.split(/[-/]/);
        if (parts.length === 3) {
            // Assuming DD/MM/YYYY
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            expenseDate = `${year}-${month}-${day}`;
        }
        date = expenseDate;
    }

    // 3. Extract Total Amount (Max amount found usually, or look for "Total")
    // Simple strategy: Find all amounts, pick the largest one as Total
    const amounts = text.match(new RegExp(amountPattern, "g"));
    if (amounts) {
        const numericAmounts = amounts.map((a) =>
            parseFloat(a.replace(/[^0-9.]/g, ""))
        );
        const maxAmount = Math.max(...numericAmounts);
        amount = maxAmount.toFixed(2);
    }

    // 4. Categorization & Vendor
    const lowerText = text.toLowerCase();
    for (const [keyword, cat] of Object.entries(categoryKeywords)) {
        if (lowerText.includes(keyword)) {
            category = cat;
            break;
        }
    }

    // Simple Vendor Guessing (First line or based on keywords)
    if (lines.length > 0) {
        // Filter out empty lines
        const nonEmptyLines = lines.filter(l => l.trim().length > 0);
        if (nonEmptyLines.length > 0) {
            vendor = nonEmptyLines[0].trim();
        }
    }

    // 5. Property Matching (Auto-Assignment)
    // Match by ABN first, then Address
    const matchedByAbn = MOCK_PROPERTIES.find((p) => abn && p.abn.replace(/\s/g, "") === abn);
    if (matchedByAbn) {
        propertyId = matchedByAbn.id;
        propertyName = matchedByAbn.name;
    } else {
        // Fuzzy address match
        const matchedByAddress = MOCK_PROPERTIES.find((p) =>
            lowerText.includes(p.address.toLowerCase()) ||
            lowerText.includes(p.name.toLowerCase())
        );
        if (matchedByAddress) {
            propertyId = matchedByAddress.id;
            propertyName = matchedByAddress.name;
        }
    }

    // 6. Line Item Extraction (Basic)
    // Look for lines that have a date, description, and amount
    for (const line of lines) {
        const lDate = line.match(datePattern);
        const lAmount = line.match(amountPattern);
        if (lDate && lAmount) {
            lineItems.push({
                date: lDate[0],
                description: line.replace(lDate[0], "").replace(lAmount[0], "").trim(),
                amount: lAmount[1]
            });
        }
    }

    return {
        date,
        amount,
        vendor,
        category,
        abn,
        propertyId,
        propertyName,
        lineItems,
        rawText: text,
    };
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        if (file.type === "application/pdf") {
            return NextResponse.json({ error: "PDF support coming soon" }, { status: 501 });
        } else if (file.type.startsWith("image/")) {
            // Handle Image (Tesseract)
            try {
                const { data: { text: ocrText } } = await Tesseract.recognize(
                    buffer,
                    "eng",
                    { logger: (m) => console.log(m) }
                );
                text = ocrText;
                console.log("--- Extracted OCR Text Start ---");
                console.log(text);
                console.log("--- Extracted OCR Text End ---");
            } catch (error) {
                console.error("OCR Error:", error);
                return NextResponse.json(
                    { error: "Failed to perform OCR" },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Unsupported file type" },
                { status: 400 }
            );
        }

        // Extract Data
        const extractedData = extractData(text);

        return NextResponse.json({
            success: true,
            data: extractedData,
        });

    } catch (error) {
        console.error("Processing Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
