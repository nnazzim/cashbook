import fs from "fs";
import path from "path";

const targetMode = process.argv[2] || "postgres"; // 'postgres' or 'sqlite'
const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (targetMode === "postgres" || targetMode === "postgresql") {
  const pgSchema = path.join(process.cwd(), "prisma", "schema.postgresql.prisma");
  if (fs.existsSync(pgSchema)) {
    fs.copyFileSync(pgSchema, schemaPath);
    console.log("✅ Switched prisma/schema.prisma to PostgreSQL provider (Ready for Vercel / Neon / Supabase).");
  }
} else {
  // SQLite mode
  let content = fs.readFileSync(schemaPath, "utf-8");
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content, "utf-8");
  console.log("✅ Switched prisma/schema.prisma to SQLite provider (Ready for local dev.db).");
}
