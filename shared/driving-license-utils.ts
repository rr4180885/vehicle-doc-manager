import { differenceInDays, parseISO, isValid } from "date-fns";
import type { DrivingLicense } from "./schema.js";

export type DrivingLicenseAlertType =
  | "learner_expired"
  | "apply_final"
  | "missing_learner_pdf";

export type DrivingLicenseAlert = {
  type: DrivingLicenseAlertType;
  message: string;
  license: DrivingLicense;
  priority: number;
};

export function getDrivingLicenseAlerts(
  license: DrivingLicense,
  today: Date = new Date()
): DrivingLicenseAlert[] {
  const alerts: DrivingLicenseAlert[] = [];

  if (!license.learnerPdfUrl) {
    alerts.push({
      type: "missing_learner_pdf",
      message: "Learner PDF not uploaded",
      license,
      priority: 3,
    });
  }

  if (license.issueDate) {
    const issueDate = parseISO(license.issueDate);
    if (isValid(issueDate)) {
      const daysSinceIssue = differenceInDays(today, issueDate);
      if (daysSinceIssue >= 30) {
        alerts.push({
          type: "apply_final",
          message: "Apply for the Final Driving License",
          license,
          priority: 2,
        });
      }
    }
  }

  if (license.expiryDate) {
    const expiryDate = parseISO(license.expiryDate);
    if (isValid(expiryDate)) {
      const daysUntilExpiry = differenceInDays(expiryDate, today);
      if (daysUntilExpiry < 0) {
        alerts.push({
          type: "learner_expired",
          message: "Please Reissue the Learner — it has been expired",
          license,
          priority: 1,
        });
      }
    }
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

export function getAllDrivingLicenseAlerts(licenses: DrivingLicense[]): DrivingLicenseAlert[] {
  return licenses
    .flatMap((license) => getDrivingLicenseAlerts(license))
    .sort((a, b) => a.priority - b.priority);
}

export type ParsedLearnerPdf = {
  applicantName?: string;
  mobile?: string;
  issueDate?: string;
  expiryDate?: string;
  licenseNumber?: string;
};

function normalizeDate(raw: string): string | undefined {
  const parts = raw.trim().split(/[-/.]/);
  if (parts.length !== 3) return undefined;
  const [a, b, c] = parts.map((p) => p.padStart(2, "0"));
  if (c.length === 4) return `${c}-${b}-${a}`;
  if (a.length === 4) return `${a}-${b}-${c}`;
  return undefined;
}

function collapseText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+\d+\.\s*$/, "")
    .replace(/\s+(?:Father|Mother|S\/W|D\/O|W\/O|Son|Daughter|Date|DOB|Mobile|Phone).*$/i, "")
    .trim();
}

export function parseLearnerPdfText(text: string): ParsedLearnerPdf {
  const result: ParsedLearnerPdf = {};
  const clean = collapseText(text);

  const mobileMatch = clean.match(/\b([6-9]\d{9})\b/);
  if (mobileMatch) result.mobile = mobileMatch[1];

  // Indian Form 3: "This Licence is valid from 31/01/2026 TO 30/07/2026"
  const validityRangeMatch = clean.match(
    /valid\s+from\s+(\d{2}[-/.]\d{2}[-/.]\d{4})\s+TO\s+(\d{2}[-/.]\d{2}[-/.]\d{4})/i
  );
  if (validityRangeMatch) {
    result.issueDate = normalizeDate(validityRangeMatch[1]);
    result.expiryDate = normalizeDate(validityRangeMatch[2]);
  }

  // Indian Form 3 field 1: "1. Licence No. BR46 /0000747/2026"
  const licenceNoMatch =
    clean.match(/\b1\.?\s*Licence\s+No\.?\s*([A-Z0-9][A-Z0-9\s/]{4,30}?)(?=\s+\d+\.|\s+2\.|\s+Name\b)/i) ||
    clean.match(/(?:DL|Licence|License|LL)\s*(?:No|Number|#)?[:\s]*([A-Z0-9][A-Z0-9\s/]{4,30}?)(?=\s+\d+\.|\s+Name\b|\s+Father)/i) ||
    clean.match(/\b([A-Z]{2}\d{2}\s*\/\s*\d{7}\/\d{4})\b/);
  if (licenceNoMatch) {
    result.licenseNumber = licenceNoMatch[1].replace(/\s+/g, " ").trim();
  }

  // Indian Form 3 field 2: "2. Name ARVIND KUMAR"
  const nameMatch =
    clean.match(/\b2\.?\s*Name\s+([A-Z][A-Z\s.]{1,60}?)(?=\s+\d+\.|\s+Father|\s+3\.|\s+Date|\s+DOB|$)/i) ||
    clean.match(/\bName\s+([A-Z][A-Z\s.]{1,60}?)(?=\s+Father|\s+\d+\.|\s+Date|\s+DOB|\s+S\/W|\s+W\/O|\s+D\/O|\s+Mobile|\s+Phone|$)/i) ||
    clean.match(/Name[:\s]+([A-Za-z][A-Za-z\s.]{2,60}?)(?:\s+(?:S\/W|D\/O|W\/O|Son|Daughter|Date|DOB|Mobile|Phone)|\s{2,})/i);
  if (nameMatch?.[1]) {
    const name = cleanName(nameMatch[1]);
    if (name.length >= 2) result.applicantName = name;
  }

  if (!result.issueDate) {
    const issueMatch = clean.match(/Issue\s*Date[:\s]*(\d{2}[-/.]\d{2}[-/.]\d{4})/i);
    if (issueMatch) result.issueDate = normalizeDate(issueMatch[1]);
  }

  if (!result.expiryDate) {
    const expiryMatch = clean.match(
      /(?:Valid\s*(?:Till|Upto|Up\s*to|To)|Expiry\s*Date)[:\s]*(\d{2}[-/.]\d{2}[-/.]\d{4})/i
    );
    if (expiryMatch) result.expiryDate = normalizeDate(expiryMatch[1]);
  }

  // Fallback: only use explicit date pairs when validity range wasn't found.
  // Exclude dates that are clearly DOB (year before 2000) or fee/application dates.
  if (!result.issueDate || !result.expiryDate) {
    const dobMatch = clean.match(/(?:Date\s+of\s+Birth|DOB)[:\s]*(\d{2}[-/.]\d{2}[-/.]\d{4})/i);
    const dobNorm = dobMatch ? normalizeDate(dobMatch[1]) : undefined;

    const feeMatch = clean.match(/Fee\s+Details[^0-9]*(\d{2}[-/.]\d{2}[-/.]\d{4})/i);
    const feeNorm = feeMatch ? normalizeDate(feeMatch[1]) : undefined;

    const dateMatches = [...clean.matchAll(/\b(\d{2}[-/.]\d{2}[-/.]\d{4})\b/g)]
      .map((m) => normalizeDate(m[1]))
      .filter((d): d is string => !!d && d !== dobNorm && d !== feeNorm && !d.startsWith("19"));

    if (!result.issueDate && dateMatches.length > 0) result.issueDate = dateMatches[0];
    if (!result.expiryDate && dateMatches.length > 1) {
      result.expiryDate = dateMatches[dateMatches.length - 1];
    }
  }

  return result;
}
