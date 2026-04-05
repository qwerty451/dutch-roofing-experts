import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.resolve("./uploads-live");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Alleen JPG, PNG, WebP en GIF zijn toegestaan" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Bestand is te groot (max 10 MB)" }, { status: 400 });
  }

  // Ensure upload dir exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  let ext = file.type.split("/")[1];
  if (ext === "jpeg") ext = "jpg";
  
  // Generate unique filename
  const filename = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  
  // Verify file exists
  if (fs.existsSync(filepath)) {
    console.log(`[upload] SUCCESS: /api/uploads/${filename} (${buffer.length} bytes)`);
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } else {
    console.log(`[upload] FAILED to save: ${filename}`);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
  return NextResponse.json({ url: `/uploads/${filename}` });
}
