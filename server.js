import express from "express";
import { closeBoaBrowser, router as verifyRouter } from "./routes/verify.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/verify", verifyRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

const server = app.listen(PORT, () => {
  console.log(`Receipt verifier API listening on http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await closeBoaBrowser();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
