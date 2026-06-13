import { extractDashenReceiptData } from "./extractors/dashen.js";

const result = await extractDashenReceiptData(
  "https://receipt.dashensuperapp.com/receipt/387ETAP2522000WK"
);

console.log(result);