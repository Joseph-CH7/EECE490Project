declare module "pdf-parse" {
  type PdfParseResult = {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  };

  export default function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfParseResult = {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  };

  export default function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
}
