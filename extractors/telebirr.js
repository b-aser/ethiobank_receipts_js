import { chromium } from "playwright";

export async function extractTeleReceiptData(urlOrId) {
  if (!urlOrId) {
    throw new Error("Telebirr receipt id or URL is required");
  }

  const url = urlOrId.startsWith("http")
    ? urlOrId
    : `https://transactioninfo.ethiotelecom.et/receipt/${urlOrId}`;

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",
    });

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const data = {};

    const rows = await page.$$eval("tr", (trs) =>
      trs.map((tr) =>
        [...tr.querySelectorAll("td")].map(
          (td) => td.textContent?.replace(/\s+/g, " ").trim() || "",
        ),
      ),
    );

    const pairRows = rows.filter((row) => row.length === 2 && row[0] && row[1]);

    const pick = (regex, key) => {
      for (const row of pairRows) {
        if (regex.test(row[0])) {
          data[key] = row[1];
          return;
        }
      }

      for (const row of rows) {
        if (row.length === 3 && regex.test(row[1])) {
          data[key] = row[2];
          return;
        }
      }
    };

    pick(/Payer\s*Name/i, "payer_name");
    pick(/Payer\s*telebirr/i, "payer_number");
    pick(/Credited\s*Party\s*name/i, "credited_party");
    pick(/Credited\s*party\s*account\s*no/i, "credited_party_number");
    pick(/transaction\s*status/i, "status");
    pick(/Total\s*Paid\s*Amount/i, "total_paid");

    return data;
  } finally {
    await browser.close();
  }
}