import { extractAwashReceiptData } from "./extractors/awash.js";
import {
  closeBoaBrowser,
  extractBoaReceiptData,
} from "./extractors/boa.js";
import {
  extractCbeReceiptInfo,
  extractCbeReceiptInfoFromFt,
} from "./extractors/cbe.js";
import { extractDashenReceiptData } from "./extractors/dashen.js";
import { extractTeleReceiptData } from "./extractors/telebirr.js";
import { extractZemenReceiptData } from "./extractors/zemen.js";

// Fill in receipt numbers or URLs for each provider you want to test.
const scenarios = {
  awash: {
    url: "https://awashpay.awashbank.com:8225/-E41AE0D86FFA-21XYYW",
  },
  boa: {
    url: "https://cs.bankofabyssinia.com/slip/?trx=FT252113TRLT13487",
  },
  cbe: {
    url: "https://apps.cbe.com.et:100/?id=FT25211G11JQ21827223",
    ftNumber: "FT25211G11JQ",
    accountNumber: "21827223",
  },
  dashen: {
    url: "https://receipt.dashensuperapp.com/receipt/387ETAP2522000WK",
  },
  telebirr: {
    idOrUrl: "https://transactioninfo.ethiotelecom.et/receipt/DFA6R42HI8",
  },
  zemen: {
    url: "https://share.zemenbank.com/rt/94497018108ATWR2520600HM/pdf",
  },
};

const runners = {
  async awash({ url }) {
    return extractAwashReceiptData(url);
  },

  async boa({ url }) {
    return extractBoaReceiptData(url);
  },

  async cbe({ url, ftNumber, accountNumber }) {
    if (ftNumber && accountNumber) {
      return extractCbeReceiptInfoFromFt(ftNumber, accountNumber);
    }

    if (url) {
      return extractCbeReceiptInfo(url);
    }

    throw new Error("Provide either url or ftNumber + accountNumber");
  },

  async dashen({ url }) {
    return extractDashenReceiptData(url);
  },

  async telebirr({ idOrUrl }) {
    return extractTeleReceiptData(idOrUrl);
  },

  async zemen({ url }) {
    return extractZemenReceiptData(url);
  },
};

function isConfigured(name, input) {
  if (name === "cbe") {
    return Boolean(
      input.url || (input.ftNumber && input.accountNumber),
    );
  }

  return Boolean(input.url || input.idOrUrl);
}

const selected = process.argv.slice(2);
const banksToRun =
  selected.length > 0 ? selected : Object.keys(scenarios);

try {
  for (const name of banksToRun) {
    const input = scenarios[name];
    const run = runners[name];

    if (!input || !run) {
      console.error(`Unknown bank: ${name}`);
      process.exitCode = 1;
      continue;
    }

    if (!isConfigured(name, input)) {
      console.log(`\n[${name}] skipped — add a receipt number or URL in test.js`);
      continue;
    }

    console.log(`\n[${name}]`);

    try {
      const result = await run(input);
      console.log(result);
    } catch (error) {
      console.error(`Failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
} finally {
  await closeBoaBrowser();
}