import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const DB_PATH = process.env.DB_PATH || "/app/data/auth.db";
const SCHEMA_PATH = "/app/db/schema.sql";

let db: Database.Database;

export function initDb() {
  if (db) return db;

  try {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("foreign_keys = ON");

    if (!fs.existsSync(SCHEMA_PATH)) {
      throw new Error(`Schema file not found at: ${SCHEMA_PATH}`);
    }

    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(schema);
    return db;
  } catch (e) {
    console.error("----Database initialization failed:", e);
    process.exit(1);
  }
}
