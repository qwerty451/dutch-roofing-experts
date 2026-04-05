import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const possiblePaths = [
    path.resolve("./uploads-live/" + filename),
    path.resolve("./public/uploads/" + filename),
    "/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst/uploads-live/" + filename,
  ];

  for (const filepath of possiblePaths) {
    if (fs.existsSync(filepath)) {
      const fileBuffer = fs.readFileSync(filepath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === ".png" ? "image/png" : 
                          ext === ".webp" ? "image/webp" : 
                          ext === ".gif" ? "image/gif" : "image/jpeg";
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
  }

  return NextResponse.json({ error: "File not found" }, { status: 404 });
}
