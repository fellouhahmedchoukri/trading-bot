import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: process.env.DB_PATH,
      driver: sqlite3.Database
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
    
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT
    );
  `);
}

export async function logSignal(signal) {
  const db = await getDB();
  await db.run(
    `INSERT INTO signals (action, symbol, level, price, message) 
     VALUES (?, ?, ?, ?, ?)`,
    [signal.action, signal.symbol, signal.level, signal.price, signal.message]
  );
}

export async function logOrder(order) {
  const db = await getDB();
  await db.run(
    `INSERT INTO orders (order_id, symbol, side, type, quantity, price, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [order.orderId, order.symbol, order.side, order.type, order.quantity, order.price, order.status]
  );
}

export async function getSettings() {
  const db = await getDB();
  const settings = await db.get('SELECT * FROM settings WHERE id = 1');
  return {
    tradingMode: settings.trading_mode || 'spot',
    environment: settings.environment || 'test',
    positionSize: settings.position_size || 100
  };
}

export async function updateSettings(newSettings) {
  const db = await getDB();
  await db.run(
    `UPDATE settings SET
      trading_mode = ?,
      environment = ?,
      position_size = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = 1`,
    [
      newSettings.tradingMode,
      newSettings.environment,
      newSettings.positionSize
    ]
  );
  return getSettings();
}

export async function getDashboardData() {
  const db = await getDB();
  
  const [signals, orders, settings] = await Promise.all([
    db.all('SELECT * FROM signals ORDER BY timestamp DESC LIMIT 50'),
    db.all('SELECT * FROM orders ORDER BY timestamp DESC LIMIT 50'),
    getSettings()
  ]);
  
  return { signals, orders, settings };
}
