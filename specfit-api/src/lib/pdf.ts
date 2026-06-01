import { extractText, getDocumentProxy } from "unpdf";

const MIN_TEXT_LENGTH = 50;

export class PdfError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "PdfError";
  }
}

export async function extractPdfText(
  buffer: ArrayBuffer,
  maxBytes: number
): Promise<string> {
  if (buffer.byteLength > maxBytes) {
    throw new PdfError(
      `File exceeds maximum size of ${maxBytes} bytes`,
      "FILE_TOO_LARGE"
    );
  }

  let doc: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    doc = await getDocumentProxy(new Uint8Array(buffer));
  } catch {
    throw new PdfError("Failed to parse PDF — file may be corrupt", "INVALID_PDF");
  }

  const { text } = await extractText(doc, { mergePages: true });
  const combined = Array.isArray(text) ? text.join("\n") : String(text);
  const trimmed = combined.trim();

  if (trimmed.length < MIN_TEXT_LENGTH) {
    throw new PdfError(
      "Could not extract enough text from PDF (min 50 chars). The PDF may be image-based.",
      "EMPTY_EXTRACTION"
    );
  }

  return trimmed;
}
