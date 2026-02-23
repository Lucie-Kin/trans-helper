import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fs from "fs";
import path from "path";

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const DB_FILE = process.env.TOURNAMENT_DB_PATH || "/app/data/tournament.sqlite";

export async function getDb() {
  if (!dbInstance) {
    // s’assure que /app/data existe
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

    dbInstance = await open({
      filename: DB_FILE,
      driver: sqlite3.Database,
    });

    await dbInstance.exec("PRAGMA foreign_keys = ON");
  }
  return dbInstance;
}


// HISTORY BRANCH CODE
//     if (!dbInstance) {
//         dbInstance = await open({
//             filename: path.resolve(__dirname, '../sql/tournament.sqlite'),
//             driver: sqlite3.Database,
//         });
//         await dbInstance.exec('PRAGMA foreign_keys = ON');

//         // Init tables
//         const schemaPath = path.resolve(__dirname, '../sql/schema.sql');
//         const fs = require('fs');
//         const schema = fs.readFileSync(schemaPath, 'utf-8');
//         await dbInstance.exec(schema);
//     }
//     return dbInstance;
// }
