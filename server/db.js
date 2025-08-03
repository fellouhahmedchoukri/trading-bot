import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const sqlite3Verbose = sqlite3.verbose();
const DB_PATH = process.env.DB_PATH || './trading.db';

let dbInstance = null;

async function getDB() {
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
  `);
}

// CORRECTION : Ajout des exports manquants
export async function getSettings() {
  const db = await getDB();
  const settings = await db.get('SELECT * FROM settings WHERE id = 1');
  return {
    tradingMode: settings?.trading_mode || 'spot',
    environment: settings?.environment || 'test',
    positionSize: settings?.position_size || 100
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

export async function logSignal(signal) {
  const db = await getDB();
  await db.run(
    `INSERT INTO signals (action, symbol, level, price, message) 
     VALUES (?, ?, ?, ?, ?)`,
    [signal.action, signal.symbol, signal.level || null, signal.price || null, signal.message || null]
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

export async function getDashboardData() {
  const db = await getDB();
  const [signals, orders, settings] = await Promise.all([
    db.all('SELECT * FROM signals ORDER BY timestamp DESC LIMIT 50'),
    db.all('SELECT * FROM orders ORDER BY timestamp DESC LIMIT 50'),
    getSettings()
  ]);
  
  return { signals, orders, settings };
}
