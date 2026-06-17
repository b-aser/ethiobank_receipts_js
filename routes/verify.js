import { Router } from "express";
import { extractAwashReceiptData } from "../extractors/awash.js";
import {
  closeBoaBrowser,
  extractBoaReceiptData,
} from "../extractors/boa.js";
import {
  extractCbeReceiptInfo,
  extractCbeReceiptInfoFromFt,
} from "../extractors/cbe.js";
import { extractDashenReceiptData } from "../extractors/dashen.js";
import { extractTeleReceiptData } from "../extractors/telebirr.js";
import { extractZemenReceiptData } from "../extractors/zemen.js";

const PROVIDERS = ["awash", "boa", "cbe", "dashen", "telebirr", "zemen"];

const extractors = {
  async awash({ url }) {
    if (!url) throw validationError("url is required");
    return extractAwashReceiptData(url);
  },

  async boa({ url }) {
    if (!url) throw validationError("url is required");
    return extractBoaReceiptData(url);
  },

  async cbe({ url, ftNumber, accountNumber }) {
    if (ftNumber && accountNumber) {
      return extractCbeReceiptInfoFromFt(ftNumber, accountNumber);
    }

    if (url) {
      return extractCbeReceiptInfo(url);
    }

    throw validationError(
      "provide either url or both ftNumber and accountNumber",
    );
  },

  async dashen({ url }) {
    if (!url) throw validationError("url is required");
    return extractDashenReceiptData(url);
  },

  async telebirr({ idOrUrl, url }) {
    const input = idOrUrl || url;
    if (!input) throw validationError("idOrUrl or url is required");
    return extractTeleReceiptData(input);
  },

  async zemen({ url }) {
    if (!url) throw validationError("url is required");
    return extractZemenReceiptData(url);
  },
};

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

const router = Router();

router.get("/providers", (_req, res) => {
  res.json({
    providers: PROVIDERS,
    inputs: {
      awash: { url: "string" },
      boa: { url: "string" },
      cbe: {
        url: "string (optional if ftNumber + accountNumber provided)",
        ftNumber: "string",
        accountNumber: "string",
      },
      dashen: { url: "string" },
      telebirr: { idOrUrl: "string", url: "string (alias)" },
      zemen: { url: "string" },
    },
  });
});

router.post("/:provider", async (req, res) => {
  const { provider } = req.params;
  const extract = extractors[provider];

  if (!extract) {
    return res.status(404).json({
      success: false,
      error: `Unknown provider: ${provider}`,
      providers: PROVIDERS,
    });
  }

  try {
    const data = await extract(req.body ?? {});
    res.json({ success: true, provider, data });
  } catch (error) {
    const status = error.status ?? 500;
    res.status(status).json({
      success: false,
      provider,
      error: error.message,
    });
  }
});

export { router, closeBoaBrowser };
