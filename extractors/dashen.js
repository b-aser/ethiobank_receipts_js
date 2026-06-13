import fs from "fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { downloadPdfFromUrl } from "../download.js";

function findNextValue(strings, index) {
  for (let i = index + 1; i < strings.length; i++) {
    const value = strings[i].trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function parseReceiptItems(items) {
  const pairs = {};
  const strings = items.map((item) => item.str ?? "");

  for (let i = 0; i < strings.length; i++) {
    const label = strings[i].trim();

    if (!label) {
      continue;
    }

    let key = null;

    if (label.endsWith(":")) {
      key = label.replace(/:$/, "").trim();
    } else {
      const nextValue = findNextValue(strings, i);

      if (nextValue?.startsWith("ETB")) {
        key = label;
      }
    }

    if (!key || pairs[key]) {
      continue;
    }

    const value = findNextValue(strings, i);

    if (value) {
      pairs[key] = value;
    }
  }

  return pairs;
}

export async function extractDashenReceiptData(url) {
  const pdfPath = await downloadPdfFromUrl(url);

  try {
    const buffer = await fs.readFile(pdfPath);

    const pdf = await getDocument({
      data: new Uint8Array(buffer),
    }).promise;

    const items = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      items.push(...content.items);
    }

    const fields = parseReceiptItems(items);

    const data = {
      sender_name: fields["Sender Name"] ?? null,
      channel: fields["Transaction Channel"] ?? null,
      service_type: fields["Service Type"] ?? null,
      narrative: fields["Narrative"] ?? null,
      beneficiary_name: fields["Receiver Name"] ?? null,
      beneficiary_account: fields["Phone No."] ?? null,
      beneficiary_bank: fields["Institution Name"] ?? null,
      transfer_reference: fields["Transfer Reference"] ?? null,
      transaction_reference: fields["Transaction Reference"] ?? null,
      transaction_date: fields["Transaction Date"] ?? null,
      amount: fields["Transaction Amount"] ?? null,
      total: fields["Total"] ?? null,
      amount_in_words: fields["Amount in words"] ?? null,
    };

    if (data.transaction_date) {
      const parsedDate = new Date(data.transaction_date);

      if (!Number.isNaN(parsedDate.getTime())) {
        data.transaction_date = parsedDate.toISOString();
      }
    }

    return data;
  } finally {
    try {
      await fs.unlink(pdfPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
