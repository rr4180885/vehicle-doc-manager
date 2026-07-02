import { PDFParse } from "pdf-parse";
import type { ParsedLearnerPdf } from "../shared/driving-license-utils.js";

// ---------------------------------------------------------------------------
// Parsing helpers — inlined here so tsx server watch always picks them up
// ---------------------------------------------------------------------------

function normalizeDate(raw: string): string | undefined {
  const parts = raw.trim().split(/[-/.]/);
  if (parts.length !== 3) return undefined;
  const [a, b, c] = parts.map((p) => p.padStart(2, "0"));
  if (c.length === 4) return `${c}-${b}-${a}`;   // dd/mm/yyyy → yyyy-mm-dd
  if (a.length === 4) return `${a}-${b}-${c}`;   // yyyy-mm-dd already
  return undefined;
}

function collapseText(text: string): string {
  // normalise whitespace (including non-breaking spaces, tabs, newlines)
  return text.replace(/[\s\u00A0\u200B]+/g, " ").trim();
}

function parseLearnerPdf(rawText: string): ParsedLearnerPdf {
  const result: ParsedLearnerPdf = {};

  // Work on the original text (with newlines) for line-aware patterns,
  // and also on a collapsed single-line version for inline patterns.
  const lines  = rawText.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const clean  = collapseText(rawText);

  // -------------------------------------------------------------------------
  // Licence number — appears as a standalone line like "BR46 /0000747/2026"
  // (in some PDFs the template labels are printed separately from values)
  // -------------------------------------------------------------------------
  const licNoMatch =
    clean.match(/Licence\s+No\.?[\s\t]+([A-Z]{2}\d{2}[\s/][^\s]{5,20})/i) ||
    // standalone line matching Indian DL format: 2 letters + 2 digits + rest
    lines.reduce<RegExpMatchArray | null>((found, line) => {
      if (found) return found;
      return line.match(/^([A-Z]{2}\d{2}[\s/]\d{3,10}\/\d{4})$/) ?? null;
    }, null);
  if (licNoMatch) {
    result.licenseNumber = licNoMatch[1].replace(/\s+/g, " ").trim();
  }

  // -------------------------------------------------------------------------
  // Name — in this PDF format the name appears on the line AFTER the licence
  // number (values are listed sequentially after "Warning:")
  // -------------------------------------------------------------------------
  for (let i = 0; i < lines.length - 1; i++) {
    const isLicLine = /^[A-Z]{2}\d{2}[\s/]/.test(lines[i]);
    if (isLicLine) {
      const next = lines[i + 1];
      // Must be all-caps words, no digits, not "Father" / "Mother" etc.
      if (/^[A-Z][A-Z ]{1,50}$/.test(next) && !/Father|Mother|Warning/i.test(next)) {
        result.applicantName = next.trim();
        break;
      }
    }
  }
  // Fallback: "Name <CAPS NAME>" pattern
  if (!result.applicantName) {
    const nameMatch = clean.match(/\bName\s+([A-Z][A-Z ]{1,50}?)(?=\s+(?:Father|Mother|\d+\.|Date|DOB)|$)/);
    if (nameMatch?.[1]) {
      result.applicantName = nameMatch[1].replace(/\s+/g, " ").trim();
    }
  }

  // -------------------------------------------------------------------------
  // Validity dates — in this PDF format the two dates appear together on a
  // line like "31/01/2026 30/07/2026" (because the template "valid from TO"
  // is printed separately from the fill-in values)
  // -------------------------------------------------------------------------
  for (const line of lines) {
    const twoDateMatch = line.match(
      /^(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\s+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})$/
    );
    if (twoDateMatch) {
      const d1 = normalizeDate(twoDateMatch[1]);
      const d2 = normalizeDate(twoDateMatch[2]);
      if (d1 && d2) {
        result.issueDate  = d1;
        result.expiryDate = d2;
        break;
      }
    }
  }

  // Also try inline "valid from X TO Y" in case some PDFs do embed them together
  if (!result.issueDate || !result.expiryDate) {
    const inlineMatch = clean.match(
      /valid\s+from\s+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\s+TO\s+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/i
    );
    if (inlineMatch) {
      result.issueDate  = normalizeDate(inlineMatch[1]);
      result.expiryDate = normalizeDate(inlineMatch[2]);
    }
  }

  // -------------------------------------------------------------------------
  // Mobile (10-digit Indian number)
  // -------------------------------------------------------------------------
  const mobileMatch = clean.match(/\b([6-9]\d{9})\b/);
  if (mobileMatch) result.mobile = mobileMatch[1];

  // -------------------------------------------------------------------------
  // Fallback dates: collect all recent dates, exclude DOB and fee date
  // -------------------------------------------------------------------------
  if (!result.issueDate || !result.expiryDate) {
    // Dates to exclude — look at each line individually to avoid digit issues
    const excludedNorms = new Set<string>();

    // Any date that normalises to a 19xx year (Date of Birth)
    for (const match of rawText.matchAll(/(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/g)) {
      const n = normalizeDate(match[1]);
      if (n?.startsWith("19")) excludedNorms.add(n);
    }

    // Fee date — on the line containing "Rs." or "Fee Details"
    for (const line of lines) {
      if (/^Rs\.|Fee\s*Detail/i.test(line)) {
        for (const match of line.matchAll(/(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/g)) {
          const n = normalizeDate(match[1]);
          if (n) excludedNorms.add(n);
        }
      }
    }

    const recentDates = [...clean.matchAll(/\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/g)]
      .map((m) => normalizeDate(m[1]))
      .filter((d): d is string =>
        !!d && !excludedNorms.has(d) && parseInt(d.slice(0, 4)) >= 2020
      );

    if (!result.issueDate  && recentDates.length > 0) result.issueDate  = recentDates[0];
    if (!result.expiryDate && recentDates.length > 1) result.expiryDate = recentDates[recentDates.length - 1];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Exported function used by routes.ts
// ---------------------------------------------------------------------------

export async function extractLearnerPdfData(buffer: Buffer): Promise<{
  text: string;
  extracted: ParsedLearnerPdf;
}> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text || "";
    const extracted = parseLearnerPdf(text);
    return { text, extracted };
  } finally {
    await parser.destroy();
  }
}
