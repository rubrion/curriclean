import { Hono } from "hono";
import { Env, HonoVariables } from "../types";
import { jwtMiddleware } from "../lib/auth";
import { extractPdfText, PdfError } from "../lib/pdf";

const cv = new Hono<{ Bindings: Env; Variables: HonoVariables }>();
cv.use("*", jwtMiddleware());

cv.post("/parse-pdf", async (c) => {
  const contentType = c.req.header("Content-Type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return c.json({ detail: "INVALID_CONTENT_TYPE" }, 400);
  }

  let file: File | null = null;
  try {
    const form = await c.req.formData();
    file = form.get("file") as File | null;
  } catch {
    return c.json({ detail: "INVALID_FORM_DATA" }, 400);
  }

  if (!file) {
    return c.json({ detail: "MISSING_FILE" }, 400);
  }

  if (!file.type.includes("pdf") && !file.name?.endsWith(".pdf")) {
    return c.json({ detail: "INVALID_CONTENT_TYPE" }, 400);
  }

  const maxBytes = parseInt(c.env.CV_PDF_MAX_BYTES, 10);

  let text: string;
  try {
    const buffer = await file.arrayBuffer();
    text = await extractPdfText(buffer, maxBytes);
  } catch (err) {
    if (err instanceof PdfError) {
      return c.json({ detail: err.code }, 400);
    }
    throw err;
  }

  return c.json({ text });
});

export default cv;
