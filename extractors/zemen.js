import fs from "fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { downloadPdfFromUrl } from "../download.js";

export async function extractZemenReceiptData(url) {
  try {
    const pdfPath = await downloadPdfFromUrl(url);

    try {
      const pdfBuffer = await fs.readFile(pdfPath);

      const pdf = await getDocument({
        data: new Uint8Array(pdfBuffer),
      }).promise;

      const pageTexts = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        const content = await page.getTextContent();

        const text = content.items
          .map((item) => item.str)
          .join(" ");

        pageTexts.push(text);
      }

      const fullText = pageTexts.join(" ").replace(/\n/g, " ");

      const patterns = {
        invoiceNo: /Invoice No\.?:\s*(\d+)/,
        date: /Date[:\s]+([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4})/,
        payerName: /Payer name:\s*([A-Z\s]+)/,
        payerAccountNo: /Payer account no\.?:\s*([\d*()X]+)/,
        recipientName: /Recipient name:\s*([A-Za-z\s.]+)/,
        recipientAccountNo: /Recipient account no\.?:\s*([\d*]+)/,
        referenceNo: /Reference No:\s*([A-Z0-9]+)/,
        transactionStatus: /Transaction status:\s*(\w+)/,
        transactionDetail:
          /Transaction Detail\s+([A-Za-z\s-]+)\s+ETB/,
        settledAmount:
          /ATM CASH WITHDRAWAL ETB\s*([\d,]+\.\d{2})/,
        serviceCharge:
          /Service Charge ETB\s*([\d,]+\.\d{2})/,
        vat:
          /VAT 15% ETB\s*([\d,]+\.\d{2})/,
        totalAmountPaid:
          /Total Amount Paid ETB\s*([\d,]+\.\d{2})/,
        amountInWords:
          /Total amount in word:\s*([A-Z\s\-]+CENT\(S\))/,
      };

      const result = {};

      for (const [field, pattern] of Object.entries(patterns)) {
        const match = fullText.match(pattern);

        if (match) {
          let value = match[1].trim();

          if (
            field.includes("Amount") ||
            field.includes("Charge") ||
            field === "vat"
          ) {
            value = `ETB ${value}`;
          }

          result[field] = value;
        }
      }

      // Parse date if found
      if (result.date) {
        const parsedDate = new Date(result.date);

        if (!Number.isNaN(parsedDate.getTime())) {
          result.date = parsedDate.toISOString();
        }
      }

      return result;
    } finally {
      try {
        await fs.unlink(pdfPath);
      } catch {
        // ignore cleanup errors
      }
    }
  } catch (error) {
    console.error(
      `Error processing Zemen receipt: ${error.message}`
    );
    return null;
  }
}