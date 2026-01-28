import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
    if (!dbInstance) {
        dbInstance = await open({
            filename: path.resolve(__dirname, '../sql/tournament.sqlite'),
            driver: sqlite3.Database,
        });
        await dbInstance.exec('PRAGMA foreign_keys = ON');
    }
    return dbInstance;
}
