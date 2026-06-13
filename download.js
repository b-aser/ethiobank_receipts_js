/**
 * Download PDF from URL and return local path.
 */
import axios from "axios";
import crypto from "crypto";
import { writeFile } from "fs/promises";
import http from "http";
import https from "https";
import { tmpdir } from "os";
import { join } from "path";

// Reusable axios instance (similar to requests.Session)
export const session = axios.create({
  httpAgent: new http.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false }),
});

export async function downloadPdfFromUrl(url, verifySsl = false) {
  const response = await session.get(url, {
    responseType: "arraybuffer",
    httpsAgent: verifySsl
      ? undefined
      : new https.Agent({
          rejectUnauthorized: false,
          keepAlive: false,
        }),
  });

  const filePath = join(tmpdir(), `${crypto.randomUUID()}.pdf`);

  await writeFile(filePath, response.data);

  return filePath;
}
