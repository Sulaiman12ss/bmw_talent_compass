import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { cvParserAgent } from "../agents";
import { appRouter } from "../routers";
import { createContext } from "./context";

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CV Upload & Parse endpoint
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 },
});

app.post("/api/parse-cv", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    await parser.destroy();
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({
        error: "Could not extract sufficient text from PDF. Please ensure the PDF contains selectable text.",
      });
    }

    const parsedProfile = await cvParserAgent(rawText);
    return res.json({ success: true, profile: parsedProfile, rawTextLength: rawText.length });
  } catch (err: any) {
    console.error("CV parsing error:", err);
    return res.status(500).json({ error: err.message || "Failed to parse CV" });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext })
);
