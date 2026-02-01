import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

// Check if we're running on Vercel
const isVercel = process.env.VERCEL === "1" || process.env.BLOB_READ_WRITE_TOKEN;

// For local development, create uploads directory
if (!isVercel) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Configure multer storage for local development
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${randomUUID()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// For Vercel, use memory storage
const memoryStorage = multer.memoryStorage();

// File filter to accept common document types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Create multer upload middleware
export const upload = multer({
  storage: isVercel ? memoryStorage : storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Upload file to Vercel Blob
export async function uploadToVercelBlob(
  file: Express.Multer.File
): Promise<{ url: string; filename: string }> {
  const filename = `${randomUUID()}-${file.originalname}`;
  
  const blob = await put(filename, file.buffer, {
    access: "public",
    contentType: file.mimetype,
  });

  return {
    url: blob.url,
    filename: blob.pathname,
  };
}

// Helper to get file URL based on environment
export function getFileUrl(filename: string): string {
  return isVercel ? filename : `/uploads/${filename}`;
}

// Check if using Vercel Blob
export function isUsingVercelBlob(): boolean {
  return !!isVercel;
}
