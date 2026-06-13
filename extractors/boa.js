import { chromium } from "playwright";

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }

  return browserPromise;
}

export async function extractBoaReceiptData(url) {
  const browser = await getBrowser();

  const page = await browser.newPage({
    viewport: {
      width: 1920,
      height: 1080,
    },
  });

  try {
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Equivalent to Selenium + BeautifulSoup
    const rows = await page.$$eval("table tr", (trs) =>
      trs.map((tr) => {
        const tds = [...tr.querySelectorAll("td")];
        return tds.map((td) => td.textContent?.trim() || "");
      })
    );

    const data = {};

    for (const cells of rows) {
      if (cells.length === 2) {
        const key = cells[0].replace(/:$/, "");
        const value = cells[1];
        data[key] = value;
      }
    }

    return {
      sourceAccount: data["Source Account"] ?? null,
      sourceAccountName: data["Source Account Name"] ?? null,
      receiverAccount: data["Receiver's Account"] ?? null,
      receiverName: data["Receiver's Name"] ?? null,
      transferredAmount: data["Transferred amount"] ?? null,
      serviceCharge: data["Service Charge"] ?? null,
      vat: data["VAT (15%)"] ?? null,
      totalAmount: data["Total Amount"] ?? null,
      transactionType: data["Transaction Type"] ?? null,
      transactionDate: data["Transaction Date"] ?? null,
      transactionReference: data["Transaction Reference"] ?? null,
      narrative: data["Narrative"] ?? null,
    };
  } finally {
    await page.close();
  }
}

export async function closeBoaBrowser() {
  if (!browserPromise) {
    return;
  }

  const browser = await browserPromise;
  await browser.close();
  browserPromise = null;
}