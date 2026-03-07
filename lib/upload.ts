import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import slugify from "slugify";

export type StoredUpload = {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
};

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const sanitizeBaseName = (fileName: string) => {
  const rawName = fileName.replace(/\.[^.]+$/, "").trim();
  const safe = slugify(rawName || "archivo", {
    lower: true,
    strict: true,
    trim: true,
  });

  return safe || "archivo";
};

export async function persistFile(file: File): Promise<StoredUpload | null> {
  if (!file || file.size === 0) {
    return null;
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const extension = path.extname(file.name || "").toLowerCase();
  const finalName = `${sanitizeBaseName(file.name)}-${randomUUID()}${extension}`;
  const absolutePath = path.join(UPLOADS_DIR, finalName);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(absolutePath, buffer);

  return {
    url: `/uploads/${finalName}`,
    fileName: file.name || finalName,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

