import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let fileUrl = "";
    try {
      // Attempt local filesystem write (for local development or persistent servers)
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, safeName);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${safeName}`;
    } catch (fsErr) {
      // On Vercel serverless functions where filesystem is read-only, store as safe base64 data URL
      const base64 = buffer.toString("base64");
      const mime = file.type || "application/octet-stream";
      fileUrl = `data:${mime};base64,${base64}`;
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
