import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fs from "fs";
import path from "path";

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const DB_FILE = process.env.TOURNAMENT_DB_PATH || "/app/data/tournament.sqlite";

export async function getDb() {
  if (!dbInstance) {
    // to ensure app/data exists
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

    dbInstance = await open({
      filename: DB_FILE,
      driver: sqlite3.Database,
    });

    await dbInstance.exec("PRAGMA foreign_keys = ON");
  }
  return dbInstance;
}


