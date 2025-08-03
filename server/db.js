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

// ... [Les autres fonctions restent identiques] ...
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

// Initialiser la base de données
export async function setupDatabase() {
    const db = await open({
        filename: 'trading.db',
        driver: sqlite3.Database
    });
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            action TEXT NOT NULL,
            symbol TEXT NOT NULL,
            level INTEGER,
            price REAL,
            message TEXT
        );
        
        CREATE TABLE IF NOT EXISTS balance_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            symbol TEXT NOT NULL,
            balance REAL NOT NULL
        );
    `);
    
    return db;
}

// Journaliser un signal
export async function logSignal(signal) {
    if (process.env.SAVE_LOGS !== 'true') return;
    
    const db = await setupDatabase();
    await db.run(
        `INSERT INTO signals (action, symbol, level, price, message) 
         VALUES (?, ?, ?, ?, ?)`,
        [signal.action, signal.symbol, signal.level || null, signal.price || null, signal.message || null]
    );
}

// Obtenir le dernier solde
export async function getLastBalance(symbol) {
    const db = await setupDatabase();
    const result = await db.get(
        `SELECT balance FROM balance_history 
         WHERE symbol = ? 
         ORDER BY timestamp DESC LIMIT 1`,
        [symbol]
    );
    return result ? result.balance : 0;
}
