/**
 * Download PDF from URL and return local path.
 */
import axios from "axios";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import crypto from "crypto";

// Reusable axios instance (similar to requests.Session)
export const session = axios.create();

export async function downloadPdfFromUrl(url, verifySsl = false) {
  const response = await session.get(url, {
    responseType: "arraybuffer",
    httpsAgent: verifySsl
      ? undefined
      : new (await import("https")).Agent({
          rejectUnauthorized: false,
        }),
  });

  const filePath = join(
    tmpdir(),
    `${crypto.randomUUID()}.pdf`
  );

  await writeFile(filePath, response.data);

  return filePath;
}