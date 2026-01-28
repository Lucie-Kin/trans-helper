// chat/src/db.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DB_PATH || "/chat/data/chat.db";
const SCHEMA_PATH = "/chat/db/schema.sql";

let db: Database.Database;

export function initDb() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(SCHEMA_PATH)) {
      throw new Error(`Schema file not found at ${SCHEMA_PATH}`);
    }

    db = new Database(DB_PATH);
    db.pragma("foreign_keys = ON");

    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(schema);

    console.log("✅ Chat DB initialized");
  } catch (e) {
    console.error("❌ Chat DB init failed:", e);
    process.exit(1);
  }
}

export { db };
