import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { downloadPdfFromUrl } from "../download.js";

/**
 * Extract receipt information from a CBE receipt PDF URL.
 */
export async function extractCbeReceiptInfo(url) {
  const pdfPath = await downloadPdfFromUrl(url);
  const buffer = await fs.readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });

  try {
    const pdfData = await parser.getText();
    const fullText = pdfData.text;

    const patterns = {
      customer_name: /Customer Name:\s*(.+)/,
      branch: /Branch:\s*(.+)/,
      region_city: /Region:\s*(.*?)\n/,
      payment_date: /Payment Date & Time\s*([\d/:,\sAPMapm]+)/,
      reference_no: /Reference No.*?([A-Z0-9]+)/,
      payer: /Payer\s+([A-Z\s]+)/,
      payer_account: /Payer\s+[A-Z\s]+\nAccount\s+([\d*]+)/,
      receiver: /Receiver\s+([A-Z\s]+)/,
      receiver_account: /Receiver\s+[A-Z\s]+\nAccount\s+([\d*]+)/,
      service: /Reason \/ Type of service\s+(.+)/,
      transferred_amount: /Transferred Amount\s+([\d,.]+)\s*ETB/,
      commission: /Commission or Service Charge\s+([\d,.]+)\s*ETB/,
      vat_on_commission: /15%\s*VAT on Commission\s+([\d,.]+)\s*ETB/,
      total_debited:
        /Total amount debited from customers account\s+([\d,.]+)\s*ETB/,
      amount_in_words: /Amount in Word ETB\s+(.+)/,
    };

    const data = {};

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = fullText.match(pattern);
      data[key] = match ? match[1].trim() : null;
    }

    if (data.payment_date) {
      const parsedDate = new Date(data.payment_date);

      if (!Number.isNaN(parsedDate.getTime())) {
        data.payment_date = parsedDate.toISOString();
      }
    }

    return data;
  } finally {
    await parser.destroy().catch(() => {});
    try {
      await fs.unlink(pdfPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Build CBE receipt URL from FT number and account number.
 */
export async function extractCbeReceiptInfoFromFt(
  ftNumber,
  accountLast8OrFull,
) {
  const ft = (ftNumber || "").replace(/\s+/g, "").toUpperCase();

  const digits = (accountLast8OrFull || "").replace(/\D/g, "");

  if (digits.length < 8) {
    throw new Error("Account number must contain at least 8 digits");
  }

  const last8 = digits.slice(-8);

  const url = `https://apps.cbe.com.et:100/?id=${ft}${last8}`;

  return extractCbeReceiptInfo(url);
}
