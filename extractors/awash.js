import * as cheerio from "cheerio";
import { session } from "../download.js";

/**
 * Extract Awash Bank receipt data.
 */
export async function extractAwashReceiptData(url) {
  const response = await session.get(url);

  const $ = cheerio.load(response.data);

  const data = {};

  $("table.info-table tr").each((_, row) => {
    const cells = $(row).find("td");

    if (cells.length === 3) {
      const key = $(cells[0])
        .text()
        .trim()
        .replace(/:$/, "");

      const value = $(cells[2])
        .text()
        .trim();

      data[key] = value;
    }
  });

  const keysOfInterest = [
    "Transaction Time",
    "Transaction Type",
    "Amount",
    "Charge",
    "VAT",
    "Sender Name",
    "Sender Account",
    "Beneficiary name",
    "Beneficiary Account",
    "Beneficiary Bank",
    "Reason",
    "Transaction ID",
  ];

  return Object.fromEntries(
    keysOfInterest.map((key) => [key, data[key] ?? null])
  );
}