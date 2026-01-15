
// Mock Property Database
export const MOCK_PROPERTIES = [
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



export interface LineItem {
    description: string;   // "Account" column
    includedTax: string | null;
    moneyOut: string | null;
    moneyIn: string | null;
}

export interface PropertySection {
    propertyName: string;
    lineItems: LineItem[];
    subtotalMoneyOut: string | null;
    subtotalMoneyIn: string | null;
}

export interface ExtractedData {
    // Folio Metadata
    agencyName: string | null; // e.g. "Horizon Housing Realty Ltd"
    folioNumber: string | null; // e.g. "OWN05518"
    statementPeriod: {
        from: string | null;
        to: string | null;
    };

    // Properties
    properties: PropertySection[];

    // Overall Totals
    totalMoneyIn: string | null;
    totalMoneyOut: string | null;

    // Debug info
    rawText: string;
}

// Helper to extract data using Regex

// --- Strategies ---

interface ParsingStrategy {
    name: string;
    canParse(text: string): boolean;
    parse(text: string): ExtractedData;
}

// 1. Horizon Housing Strategy (Specific)
const HorizonHousingStrategy: ParsingStrategy = {
    name: "Horizon Housing",
    canParse: (text: string) => text.toLowerCase().includes("horizon housing"),
    parse: (text: string): ExtractedData => {
        // Initialize defaults
        let agencyName: string | null = "Horizon Housing Realty Ltd";
        let folioNumber: string | null = null;
        let statementPeriod: { from: string | null; to: string | null } = { from: null, to: null };
        const properties: PropertySection[] = [];
        let totalMoneyIn: string | null = null;
        let totalMoneyOut: string | null = null;

        const lines = text.split("\n");
        let currentProperty: PropertySection | null = null;

        // Patterns (Robust)
        const strictAmountPattern = /((?:\$\s*[\d,]+(?:\.\d{2})?)|(?:[\d,]+\.\d{2}))/;
        const addressPattern = /\d+[\w\s]+(?:Street|St|Road|Rd|Parade|Crescent|Ave|Avenue|Place|Pl|Circuit|Ct|Square|Sq|Dr|Drive)\b/i;
        const cleanAmount = (str: string) => str.replace(/[$,\s]/g, "");

        const getOrCreateProperty = (name: string) => {
            let prop = properties.find(p => p.propertyName === name);
            if (!prop) {
                prop = { propertyName: name, lineItems: [], subtotalMoneyOut: null, subtotalMoneyIn: null };
                properties.push(prop);
            }
            return prop;
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lowerLine = line.toLowerCase();
            if (!line) continue;

            // Header Info (Specific to Horizon) - More permissive matching
            if (lowerLine.includes("folio:") && !folioNumber) folioNumber = line.split(/folio:?/i)[1]?.trim() || null;
            if (lowerLine.includes("from:") && !statementPeriod.from) {
                const match = line.match(/from:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
                if (match) statementPeriod.from = match[1];
            }
            if (lowerLine.includes("to:") && !statementPeriod.to) {
                const match = line.match(/to:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
                if (match) statementPeriod.to = match[1];
            }

            // Property Context
            // Keep specific Horizon checks + Add generic checks
            const matchedMock = MOCK_PROPERTIES.find(p =>
                lowerLine.includes(p.address.toLowerCase()) || (p.name && lowerLine.includes(p.name.toLowerCase()))
            );
            const matchedAddress = line.match(addressPattern);

            if (lowerLine.includes("hurley st") || matchedMock) { // specific user overrides
                const name = matchedMock ? matchedMock.name : line;
                currentProperty = getOrCreateProperty(name);
                continue;
            } else if (matchedAddress && (lowerLine.includes("property:") || lowerLine.includes("purchase"))) {
                currentProperty = getOrCreateProperty(matchedAddress[0]);
                continue;
            }

            // Transactions (Robust Generic Logic)
            const amountMatches = line.match(new RegExp(strictAmountPattern, "g"));
            const hasSummaryKeyword = lowerLine.includes("total") || lowerLine.includes("subtotal") || lowerLine.includes("folio summary") || lowerLine.includes("balance carried");
            const isPotentialMathSummary = amountMatches && amountMatches.length >= 3;
            const isSummaryLine = hasSummaryKeyword || isPotentialMathSummary;

            if (amountMatches && amountMatches.length > 0) {
                const rawTotal = amountMatches[amountMatches.length - 1];
                const amountVal = cleanAmount(rawTotal);

                // A. HANDLE SUMMARIES
                if (isSummaryLine) {
                    if (lowerLine.includes("tax") || lowerLine.includes("gst") || lowerLine.includes("taxon")) {
                        continue;
                    }

                    let mathCheckPassed = false;
                    if (amountMatches.length >= 3) {
                        const valA = parseFloat(cleanAmount(amountMatches[0]));
                        const valB = parseFloat(cleanAmount(amountMatches[1]));
                        const valC = parseFloat(cleanAmount(amountMatches[2]));

                        if (Math.abs(valA - valB - valC) < 0.05) {
                            totalMoneyIn = cleanAmount(amountMatches[0]);
                            totalMoneyOut = cleanAmount(amountMatches[1]);
                            // Do NOT assign to property - this is a Global/Folio summary
                            mathCheckPassed = true;
                            continue;
                        }
                    }

                    if (!hasSummaryKeyword && !mathCheckPassed) {
                        // Fall through
                    } else if (hasSummaryKeyword) {
                        // Global Guard: "Total" at start = Document Level, "Subtotal" = Property Level
                        const isGlobalContext = lowerLine.includes("grand total") ||
                            lowerLine.includes("total amount") ||
                            lowerLine.includes("net amount") ||
                            (lowerLine.startsWith("total") && !lowerLine.includes("tax") && !lowerLine.includes("gst"));

                        const addStrings = (a: string | null, b: string) => {
                            if (!a) return b;
                            return (parseFloat(a) + parseFloat(b)).toFixed(2);
                        };

                        if (amountMatches.length >= 2) {
                            const lastVal = cleanAmount(amountMatches[amountMatches.length - 1]);
                            const secondLastVal = cleanAmount(amountMatches[amountMatches.length - 2]);

                            if (currentProperty && !isGlobalContext) {
                                currentProperty.subtotalMoneyIn = addStrings(currentProperty.subtotalMoneyIn, lastVal);
                                currentProperty.subtotalMoneyOut = addStrings(currentProperty.subtotalMoneyOut, secondLastVal);
                            }

                            if (isGlobalContext || !currentProperty) {
                                totalMoneyIn = lastVal;
                                totalMoneyOut = secondLastVal;
                            }
                        } else {
                            const isIncomeContext = lowerLine.includes("in") || lowerLine.includes("income") || lowerLine.includes("rent") || lowerLine.includes("credit");
                            const isExpenseContext = lowerLine.includes("out") || lowerLine.includes("expense") || lowerLine.includes("debit") || lowerLine.includes("fee");

                            let assigned = false;
                            if (totalMoneyIn && amountVal === totalMoneyIn) {
                                if (currentProperty) currentProperty.subtotalMoneyIn = amountVal;
                                else totalMoneyIn = amountVal;
                                assigned = true;
                            } else if (totalMoneyOut && amountVal === totalMoneyOut) {
                                if (currentProperty) currentProperty.subtotalMoneyOut = amountVal;
                                else totalMoneyOut = amountVal;
                                assigned = true;
                            }

                            if (!assigned) {
                                if (currentProperty) {
                                    if (isIncomeContext) currentProperty.subtotalMoneyIn = amountVal;
                                    else if (isExpenseContext) currentProperty.subtotalMoneyOut = amountVal;
                                    else currentProperty.subtotalMoneyOut = amountVal;
                                }

                                if (!currentProperty || lowerLine.includes("grand total")) {
                                    if (isIncomeContext) totalMoneyIn = amountVal;
                                    else totalMoneyOut = amountVal;
                                }
                            }
                        }
                        continue;
                    }
                }

                // B. HANDLE REGULAR LINE ITEMS
                // Horizon Invoice Format: [Description] [Included Tax] [Money Out] [Money In]
                // Tax is the FIRST amount, Out is second, In is third (if present)
                let taxVal: string | null = null;
                let moneyOutVal: string | null = null;
                let moneyInVal: string | null = null;

                if (amountMatches.length >= 3) {
                    // 3-column format: Tax | Out | In
                    taxVal = cleanAmount(amountMatches[0]);
                    moneyOutVal = cleanAmount(amountMatches[1]);
                    moneyInVal = cleanAmount(amountMatches[2]);
                } else if (amountMatches.length === 2) {
                    // Horizon 2-column format for line items:
                    // - For expense lines (Mgmt Fee, Pest Control): Tax | Out
                    // - For income lines (Rent): Out | In (rare, usually Rent is single amount)
                    const isIncomeContext = lowerLine.includes("rent") || lowerLine.includes("income") || lowerLine.includes("credit") || lowerLine.includes("deposit");

                    if (isIncomeContext) {
                        // Rare case: Two amounts on income line = Out | In
                        moneyOutVal = cleanAmount(amountMatches[0]);
                        moneyInVal = cleanAmount(amountMatches[1]);
                    } else {
                        // Expense line: First = Tax, Second = Out
                        taxVal = cleanAmount(amountMatches[0]);
                        moneyOutVal = cleanAmount(amountMatches[1]);
                    }
                } else {
                    // 1-column: Context-based assignment
                    const isIncomeContext = lowerLine.includes("rent") || lowerLine.includes("income") || lowerLine.includes("credit") || lowerLine.includes("deposit");
                    if (isIncomeContext) {
                        moneyInVal = amountVal;
                    } else {
                        moneyOutVal = amountVal;
                    }
                }

                // CLEAN DESCRIPTION
                let description = line.replace(new RegExp(strictAmountPattern, "g"), "").trim();
                description = description.replace(/\s+/g, " ").trim();

                if (!description.replace(/[^a-zA-Z]/g, "")) continue;

                const isIncome = lowerLine.includes("rent") || lowerLine.includes("income") || lowerLine.includes("credit") || lowerLine.includes("deposit");

                if (!currentProperty) {
                    currentProperty = getOrCreateProperty("General / Uncategorized");
                }

                currentProperty.lineItems.push({
                    description: description,
                    includedTax: taxVal,
                    moneyIn: moneyInVal,
                    moneyOut: moneyOutVal
                });
            }
        }

        // Backfill Logic
        if (properties.length === 1) {
            const prop = properties[0];
            if (!prop.subtotalMoneyIn && totalMoneyIn) prop.subtotalMoneyIn = totalMoneyIn;
            if (!prop.subtotalMoneyOut && totalMoneyOut) prop.subtotalMoneyOut = totalMoneyOut;
        }

        return { agencyName, folioNumber, statementPeriod, properties, totalMoneyIn, totalMoneyOut, rawText: text };
    }
};


// 2. Generic Real Estate Strategy (Fallback)
const GenericRealEstateStrategy: ParsingStrategy = {
    name: "Generic Real Estate",
    canParse: () => true, // Fallback
    parse: (text: string): ExtractedData => {
        // Initialize defaults
        let agencyName: string | null = null;
        let folioNumber: string | null = null;
        let statementPeriod: { from: string | null; to: string | null } = { from: null, to: null };
        let totalMoneyIn: string | null = null;
        let totalMoneyOut: string | null = null;
        const properties: PropertySection[] = [];

        const lines = text.split("\n");
        let currentProperty: PropertySection | null = null;

        // Patterns
        // STRICTER Amount Pattern:
        // 1. Starts with '$' (optional space) then digits (optional decimals) -> e.g. $200, $200.00
        // 2. OR No '$', but MUST have a decimal point followed by 2 digits -> e.g. 200.00
        // Excludes: "2023", "5098", "0433101353"
        const strictAmountPattern = /((?:\$\s*[\d,]+(?:\.\d{2})?)|(?:[\d,]+\.\d{2}))/;
        const addressPattern = /\d+[\w\s]+(?:Street|St|Road|Rd|Parade|Crescent|Ave|Avenue|Place|Pl|Circuit|Ct|Square|Sq|Dr|Drive)\b/i;

        // Helper
        const cleanAmount = (str: string) => str.replace(/[$,\s]/g, "");

        // Helper to get or create property
        const getOrCreateProperty = (name: string) => {
            let prop = properties.find(p => p.propertyName === name);
            if (!prop) {
                prop = { propertyName: name, lineItems: [], subtotalMoneyOut: null, subtotalMoneyIn: null };
                properties.push(prop);
            }
            return prop;
        };

        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // 0. Header Extraction (Generic)
            // Agency Name Heuristic: First few lines, often contains "Pty Ltd", "Real Estate", or is just the first line.
            if (!agencyName && lines.indexOf(line) < 5 && !lowerLine.includes("invoice") && !lowerLine.includes("statement")) {
                // Noise Filter: Must be > 3 chars and have meaningful content (min 3 letters)
                // e.g. "J ———" has only 1 letter -> Reject. "One Coronis" has 10 -> Accept.
                const letterCount = line.replace(/[^a-zA-Z]/g, "").length;
                const isNoise = line.length < 4 || letterCount < 3;

                console.log(`[Agency Check] Line: "${line}", Len: ${line.length}, Letters: ${letterCount}, Noise: ${isNoise}`);

                if (!isNoise) {
                    agencyName = line;
                    console.log(`[Agency Selected] "${agencyName}"`);
                }
            }

            // Folio Number
            if (!folioNumber && (lowerLine.includes("folio") || lowerLine.includes("fol:") || lowerLine.includes("reference") || lowerLine.includes("ref:"))) {
                const parts = line.split(/[:#]/);
                if (parts.length > 1) {
                    folioNumber = parts[1].trim();
                }
            }

            // Statement Period
            // Numeric: "From: 1/07/2023", "To: 30/06/2024" OR "1072023"
            // Text: "21 July 2023", "Settlement Date: 24 July 2023"
            const datePatternNumeric = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{6,8})/;
            const datePatternText = /(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4})/i;

            if (!statementPeriod.from && lowerLine.includes("from:")) {
                const matchNum = line.match(new RegExp("from:?\\s*" + datePatternNumeric.source, "i"));
                const matchText = line.match(new RegExp("from:?\\s*" + datePatternText.source, "i"));
                if (matchNum) statementPeriod.from = matchNum[1];
                else if (matchText) statementPeriod.from = matchText[1];
            }
            if (!statementPeriod.to && lowerLine.includes("to:")) {
                const matchNum = line.match(new RegExp("to:?\\s*" + datePatternNumeric.source, "i"));
                const matchText = line.match(new RegExp("to:?\\s*" + datePatternText.source, "i"));
                if (matchNum) statementPeriod.to = matchNum[1];
                else if (matchText) statementPeriod.to = matchText[1];
            }
            // Also detect "Settlement Date: 24 July 2023" as 'to' date if not set
            if (!statementPeriod.to && lowerLine.includes("settlement date")) {
                const matchNum = line.match(new RegExp("settlement date:?\\s*" + datePatternNumeric.source, "i"));
                const matchText = line.match(new RegExp("settlement date:?\\s*" + datePatternText.source, "i"));
                if (matchNum) statementPeriod.to = matchNum[1];
                else if (matchText) statementPeriod.to = matchText[1];
            }
            // Detect standalone dates like "21 July 2023" as 'from' if not set (usually invoice date)
            if (!statementPeriod.from) {
                const standaloneMatch = line.match(/^(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})$/i);
                if (standaloneMatch) statementPeriod.from = standaloneMatch[1];
            }
            // Strict check: matches address pattern OR known mock property
            const matchedMock = MOCK_PROPERTIES.find(p =>
                lowerLine.includes(p.address.toLowerCase()) ||
                (p.name && lowerLine.includes(p.name.toLowerCase()))
            );

            const matchedAddress = line.match(addressPattern);

            if (matchedMock) {
                currentProperty = getOrCreateProperty(matchedMock.name);
            } else if (matchedAddress) {
                // Heuristic filtering
                const isExplicitProperty = lowerLine.includes("purchase of") || lowerLine.includes("property:") || lowerLine.includes("re:");
                const isContactInfo = lowerLine.includes("ph:") || lowerLine.includes("email:") || lowerLine.includes("box");

                // Check using stricter amount pattern
                const hasAmount = strictAmountPattern.test(line);

                if (isExplicitProperty) {
                    currentProperty = getOrCreateProperty(matchedAddress[0]);
                } else if (!hasAmount && !isContactInfo) {
                    const lineIndex = lines.indexOf(line);
                    const isEarly = lineIndex < 10;
                    if (!isEarly) {
                        currentProperty = getOrCreateProperty(matchedAddress[0]);
                    }
                }
            }

            // 2. Generic Transaction Detection
            // Use Strict Pattern
            const amountMatches = line.match(new RegExp(strictAmountPattern, "g"));

            // Check if this is a Summary Line (Total/Subtotal)
            const hasSummaryKeyword = lowerLine.includes("total") || lowerLine.includes("subtotal") || lowerLine.includes("folio summary") || lowerLine.includes("balance carried");
            const isPotentialMathSummary = amountMatches && amountMatches.length >= 3;
            const isSummaryLine = hasSummaryKeyword || isPotentialMathSummary;

            if (amountMatches && amountMatches.length > 0) {
                // Determine value(s)
                const rawTotal = amountMatches[amountMatches.length - 1];
                const amountVal = cleanAmount(rawTotal);

                // A. HANDLE SUMMARIES
                if (isSummaryLine) {
                    // Guard: Ignored "Total Tax" or "Total GST" lines
                    // "taxon" is a common OCR error for "Tax on"
                    if (lowerLine.includes("tax") || lowerLine.includes("gst") || lowerLine.includes("taxon")) {
                        continue;
                    }

                    // 1. Math Verification (Smart 3-Column Logic)
                    let mathCheckPassed = false;
                    if (amountMatches.length >= 3) {
                        const valA = parseFloat(cleanAmount(amountMatches[0]));
                        const valB = parseFloat(cleanAmount(amountMatches[1]));
                        const valC = parseFloat(cleanAmount(amountMatches[2]));

                        // Check A - B = C (In - Out = Balance?)
                        if (Math.abs(valA - valB - valC) < 0.05) {
                            totalMoneyIn = cleanAmount(amountMatches[0]);
                            totalMoneyOut = cleanAmount(amountMatches[1]);

                            // Valid Math Summary (In - Out = Balance) -> Almost always Global / Folio context.
                            // Do NOT assign to property subtotal here to avoid overwriting specific property data.
                            // If this really is the only data, the Backfill logic will handle it later.
                            mathCheckPassed = true;
                            continue;
                        }
                    }

                    // Should we proceed with Summary Logic?
                    // Only if keyword exists. If it was only a "Potential Math Summary" and passed NO checks, 
                    // it falls through to regular line item.
                    if (!hasSummaryKeyword && !mathCheckPassed) {
                        // Fall through to B
                    } else if (hasSummaryKeyword) {
                        // 2. Generic Total/Subtotal (Dual Column Support)
                        // Heuristic: "Grand Total", "Total Amount", "Net Amount", or simply "Total" (at end of doc) = Global.
                        // We check if line STARTS with "Total" to avoid "Subtotal" matches.
                        const isGlobalContext = lowerLine.includes("grand total") ||
                            lowerLine.includes("total amount") ||
                            lowerLine.includes("net amount") ||
                            (lowerLine.startsWith("total") && !lowerLine.includes("tax") && !lowerLine.includes("gst"));

                        const addStrings = (a: string | null, b: string) => {
                            if (!a) return b;
                            return (parseFloat(a) + parseFloat(b)).toFixed(2);
                        };

                        if (amountMatches.length >= 2) {
                            const lastVal = cleanAmount(amountMatches[amountMatches.length - 1]);
                            const secondLastVal = cleanAmount(amountMatches[amountMatches.length - 2]);

                            if (currentProperty && !isGlobalContext) {
                                currentProperty.subtotalMoneyIn = addStrings(currentProperty.subtotalMoneyIn, lastVal);
                                currentProperty.subtotalMoneyOut = addStrings(currentProperty.subtotalMoneyOut, secondLastVal);
                            }

                            if (isGlobalContext || !currentProperty) {
                                totalMoneyIn = lastVal;
                                totalMoneyOut = secondLastVal;
                            }
                        } else {
                            // Default Single Amount logic
                            const isIncomeContext = lowerLine.includes("in") || lowerLine.includes("income") || lowerLine.includes("rent") || lowerLine.includes("credit");
                            const isExpenseContext = lowerLine.includes("out") || lowerLine.includes("expense") || lowerLine.includes("debit") || lowerLine.includes("fee");

                            // SMART LOOKUP: Check if value matches known Global Totals
                            let assigned = false;
                            if (totalMoneyIn && amountVal === totalMoneyIn) {
                                if (currentProperty) currentProperty.subtotalMoneyIn = amountVal;
                                else totalMoneyIn = amountVal;
                                assigned = true;
                            } else if (totalMoneyOut && amountVal === totalMoneyOut) {
                                if (currentProperty) currentProperty.subtotalMoneyOut = amountVal;
                                else totalMoneyOut = amountVal;
                                assigned = true;
                            }

                            if (!assigned) {
                                if (currentProperty) {
                                    if (isIncomeContext) currentProperty.subtotalMoneyIn = amountVal;
                                    else if (isExpenseContext) currentProperty.subtotalMoneyOut = amountVal;
                                    else currentProperty.subtotalMoneyOut = amountVal; // Default to Out
                                }

                                if (!currentProperty || lowerLine.includes("grand total")) {
                                    if (isIncomeContext) totalMoneyIn = amountVal;
                                    else totalMoneyOut = amountVal;
                                }
                            }
                        }
                        continue;
                    }
                }

                // B. HANDLE REGULAR LINE ITEMS
                let taxVal: string | null = null;
                if (amountMatches.length > 1) {
                    const rawTax = amountMatches[amountMatches.length - 2];
                    const potentialTax = cleanAmount(rawTax);
                    const fTotal = parseFloat(amountVal);
                    const fTax = parseFloat(potentialTax);
                    if (!isNaN(fTotal) && !isNaN(fTax) && fTax < fTotal) {
                        taxVal = potentialTax;
                    }
                }

                // CLEAN DESCRIPTION: Global Replace
                let description = line.replace(new RegExp(strictAmountPattern, "g"), "").trim();
                description = description.replace(/\s+/g, " ").trim();

                // If description is now empty or just symbols, ignore
                if (!description.replace(/[^a-zA-Z]/g, "")) continue;

                const isIncome = lowerLine.includes("rent") || lowerLine.includes("income") || lowerLine.includes("credit") || lowerLine.includes("deposit");

                if (!currentProperty) {
                    currentProperty = getOrCreateProperty("General / Uncategorized");
                }

                const descAddressMatch = description.match(addressPattern);
                let targetProperty = currentProperty;
                if (descAddressMatch) {
                    targetProperty = getOrCreateProperty(descAddressMatch[0]);
                }

                targetProperty.lineItems.push({
                    description: description,
                    includedTax: taxVal,
                    moneyIn: isIncome ? amountVal : null,
                    moneyOut: (!isIncome) ? amountVal : null
                });
            }
        }

        // Post-Parse: Backfill Property Subtotals from Global Totals if 1 property context
        // This handles cases where the Property Table footer was messy/garbled, 
        // but the Header Folio Summary was clean (captured by Math Logic).
        if (properties.length === 1) {
            const prop = properties[0];
            if (!prop.subtotalMoneyIn && totalMoneyIn) {
                prop.subtotalMoneyIn = totalMoneyIn;
            }
            if (!prop.subtotalMoneyOut && totalMoneyOut) {
                prop.subtotalMoneyOut = totalMoneyOut;
            }
        }

        return { agencyName, folioNumber, statementPeriod, properties, totalMoneyIn, totalMoneyOut, rawText: text };
    }
};

const STRATEGIES: ParsingStrategy[] = [
    HorizonHousingStrategy,
    GenericRealEstateStrategy
];

// Main Extractor
export function extractData(text: string): ExtractedData {
    console.log("------- OCR PARSER START -------");
    console.log("Raw OCR Text Preview:\n", text.substring(0, 200) + "...");

    // Select Strategy
    const strategy = STRATEGIES.find(s => s.canParse(text)) || GenericRealEstateStrategy;
    console.log(`Selected Strategy: ${strategy.name}`);
    console.log("--------------------------------");

    const result = strategy.parse(text);

    console.log("------- OCR PARSER RESULT -------");
    console.log(JSON.stringify(result, null, 2));
    console.log("---------------------------------");

    return result;
}
