import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";

import { extractData } from "@/app/api/ocr-parser";

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
