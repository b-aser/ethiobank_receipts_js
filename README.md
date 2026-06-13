# verifier

Node.js library to extract structured data from digital payment receipts for major Ethiopian banks and Telebirr.

## Credits

This project is a **JavaScript/Node.js port** inspired by the original Python library **[ethiobank-receipts](https://github.com/NahomAl/ethiobank_receipts)** by **[Nahom Alemu (@NahomAl)](https://github.com/NahomAl)**.

The extraction logic, bank coverage, and overall approach build on that work. Please also star and support the original project:

- Author: [https://github.com/NahomAl](https://github.com/NahomAl)
- Python library: [https://github.com/NahomAl/ethiobank_receipts](https://github.com/NahomAl/ethiobank_receipts)

## Disclaimer

This is **not an official package** of Ethio Telecom, Telebirr, or any Ethiopian bank.

It is built for **developer utility and research** by reading publicly available receipt pages and PDFs. Use it responsibly and in line with each provider's terms of service.

## Supported providers

| Provider | Extractor | Input |
| --- | --- | --- |
| Commercial Bank of Ethiopia (CBE) | `extractors/cbe.js` | Receipt URL, or FT number + account |
| Dashen Bank | `extractors/dashen.js` | Receipt URL |
| Awash Bank | `extractors/awash.js` | Receipt URL |
| Bank of Abyssinia (BOA) | `extractors/boa.js` | Receipt URL |
| Zemen Bank | `extractors/zemen.js` | Receipt PDF URL |
| Telebirr | `extractors/telebirr.js` | Receipt ID or URL |

## Installation

```bash
pnpm install
pnpm exec playwright install chromium
```

## Usage

### CBE

```js
import {
  extractCbeReceiptInfo,
  extractCbeReceiptInfoFromFt,
} from "./extractors/cbe.js";

const fromUrl = await extractCbeReceiptInfo(
  "https://apps.cbe.com.et:100/?id=FT25211G11JQ21827223",
);

const fromFt = await extractCbeReceiptInfoFromFt("FT25211G11JQ", "21827223");
```

### Dashen

```js
import { extractDashenReceiptData } from "./extractors/dashen.js";

const data = await extractDashenReceiptData(
  "https://receipt.dashensuperapp.com/receipt/387ETAP2522000WK",
);
```

### Awash

```js
import { extractAwashReceiptData } from "./extractors/awash.js";

const data = await extractAwashReceiptData(
  "https://awashpay.awashbank.com:8225/-E41AE0D86FFA-21XYYW",
);
```

### Bank of Abyssinia (BOA)

```js
import {
  closeBoaBrowser,
  extractBoaReceiptData,
} from "./extractors/boa.js";

try {
  const data = await extractBoaReceiptData(
    "https://cs.bankofabyssinia.com/slip/?trx=FT252113TRLT13487",
  );
} finally {
  await closeBoaBrowser();
}
```

### Zemen

```js
import { extractZemenReceiptData } from "./extractors/zemen.js";

const data = await extractZemenReceiptData(
  "https://share.zemenbank.com/rt/94497018108ATWR2520600HM/pdf",
);
```

### Telebirr

```js
import { extractTeleReceiptData } from "./extractors/telebirr.js";

const byId = await extractTeleReceiptData("DFC9T5YFVZ");

const byUrl = await extractTeleReceiptData(
  "https://transactioninfo.ethiotelecom.et/receipt/DFC9T5YFVZ",
);
```

## Testing

Edit the `scenarios` object in `test.js` with your receipt URLs or IDs, then run:

```bash
node test.js
```

Run one or more providers:

```bash
node test.js cbe telebirr dashen
```

## Notes

- **BOA** and **Telebirr** use Playwright (Chromium). Call `closeBoaBrowser()` when finished with BOA extraction so the process can exit cleanly.
- **Telebirr** may block or fail from non-Ethiopian IP addresses on some hosts.
- For **CBE**, you can pass an FT number plus the last 8 digits of the account instead of the full URL.

## License

MIT
