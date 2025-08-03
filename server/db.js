import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = process.env.DB_PATH || './trading.db';

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: DB_PATH,
      driver: sqlite3Verbose.Database
    });
    await initDB(dbInstance);
  }
  return dbInstance;
}

async function initDB(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trading_mode TEXT DEFAULT 'spot',
      environment TEXT DEFAULT 'test',
      position_size REAL DEFAULT 100,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT OR IGNORE INTO settings (id) VALUES (1);
    
    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL,
      symbol TEXT NOT NULL,
      level INTEGER,
      price REAL,
      message TEXT
    );
    
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_id TEXT,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      status TEXT NOT NULL
    );
  `);
}

// ... autres fonctions ...
