"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFileSelect?: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                validateAndSetFile(file);
            }
        },
        [onFileSelect]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                validateAndSetFile(file);
            }
        },
        [onFileSelect]
    );

    const validateAndSetFile = (file: File) => {
        const validTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf",
        ];
        if (validTypes.includes(file.type)) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            if (onFileSelect) {
                onFileSelect(file);
            }
        } else {
            alert("Please upload a valid file (JPG, PNG, PDF)");
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div className="w-full h-[600px]">
            <div
                className={cn(
                    "relative w-full h-full border-2 border-dashed rounded-lg transition-colors overflow-hidden",
                    isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300",
                    !selectedFile && "hover:border-gray-400 cursor-pointer bg-white",
                    selectedFile && "border-gray-200 bg-gray-900"
                )}
                onDragOver={!selectedFile ? handleDragOver : undefined}
                onDragLeave={!selectedFile ? handleDragLeave : undefined}
                onDrop={!selectedFile ? handleDrop : undefined}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileInput}
                />

                {selectedFile && previewUrl ? (
                    <>
                        {selectedFile.type === "application/pdf" ? (
                            <iframe
                                src={previewUrl}
                                className="w-full h-full"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearFile();
                            }}
                            className="absolute bottom-8 right-8 p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="p-4 bg-gray-100 rounded-full">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="space-y-1 text-center">
                            <p className="text-lg font-medium text-gray-900">
                                Click or drag file to this area to upload
                            </p>
                            <p className="text-sm text-gray-500">
                                (.jpg, .jpeg, .png, .pdf)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
