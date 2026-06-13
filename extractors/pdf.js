import { createRequire } from "module";
import { dirname, join } from "path";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve("pdfjs-dist/package.json"));

const pdfjs = await import(
  pathToFileURL(join(pdfjsRoot, "legacy/build/pdf.mjs")).href
);

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
  join(pdfjsRoot, "legacy/build/pdf.worker.mjs"),
).href;

export const { getDocument } = pdfjs;

export async function getPdfTextItems(buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const items = [];

  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      items.push(...content.items);
    }
  } finally {
    await pdf.destroy();
  }

  return items;
}

export async function getPdfFullText(buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageTexts = [];

  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => item.str).join(" "));
    }
  } finally {
    await pdf.destroy();
  }

  return pageTexts.join(" ");
}
