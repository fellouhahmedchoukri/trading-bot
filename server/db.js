import path from 'path';
import fs from 'fs';

// Solution d'import dynamique pour éviter les conflits
let sqlite3;
let sqliteOpen;

async function loadSqliteModules() {
    if (!sqlite3) {
        const sqlite3Module = await import('sqlite3');
        sqlite3 = sqlite3Module.default;
    }
    
    if (!sqliteOpen) {
        const sqlite = await import('sqlite');
        sqliteOpen = sqlite.open;
    }
}

// Configuration du chemin de la DB
const isProduction = process.env.NODE_ENV === 'production';
const DB_DIR = isProduction ? '/data' : path.resolve(process.cwd());
const DB_FILENAME = 'trading.db';
const DB_PATH = path.join(DB_DIR, DB_FILENAME);

// Création du répertoire si nécessaire
if (isProduction && !fs.existsSync(DB_DIR)) {
    try {
        fs.mkdirSync(DB_DIR, { recursive: true });
        console.log(`📂 Dossier créé: ${DB_DIR}`);
    } catch (err) {
        console.error(`❌ Erreur création dossier: ${err.message}`);
    }
}

let dbInstance = null;

async function getDB() {
    await loadSqliteModules();
    
    if (!dbInstance) {
        try {
            const sqlite3Verbose = sqlite3.verbose();
            dbInstance = await sqliteOpen({
                filename: DB_PATH,
                driver: sqlite3Verbose.Database
            });
            console.log(`📊 Base de données connectée: ${DB_PATH}`);
            await initDB(dbInstance);
        } catch (error) {
            console.error('❌ Erreur de connexion à la base de données:', error);
            throw error;
        }
    }
    return dbInstance;
}

async function initDB(db) {
    try {
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
        console.log('✅ Structure de base de données initialisée');
    } catch (error) {
        console.error('❌ Erreur d\'initialisation de la base de données:', error);
        throw error;
    }
}

export async function getSettings() {
    try {
        console.log('📊 Récupération des paramètres');
        const db = await getDB();
        const settings = await db.get('SELECT * FROM settings WHERE id = 1');
        return {
            tradingMode: settings?.trading_mode || 'spot',
            environment: settings?.environment || 'test',
            positionSize: settings?.position_size || 100
        };
    } catch (error) {
        console.error('❌ Erreur dans getSettings:', error);
        return {
            tradingMode: 'spot',
            environment: 'test',
            positionSize: 100
        };
    }
}

export async function updateSettings(newSettings) {
    try {
        console.log(`⚙️ Mise à jour des paramètres: ${JSON.stringify(newSettings)}`);
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
    } catch (error) {
        console.error('❌ Erreur dans updateSettings:', error);
        return getSettings();
    }
}

export async function logSignal(signal) {
    if (process.env.SAVE_LOGS === 'false') return;
    
    try {
        const db = await getDB();
        await db.run(
            `INSERT INTO signals (action, symbol, level, price, message) 
            VALUES (?, ?, ?, ?, ?)`,
            [
                signal.action, 
                signal.symbol, 
                signal.level || null, 
                signal.price || null, 
                signal.message || null
            ]
        );
    } catch (error) {
        console.error('❌ Erreur dans logSignal:', error);
    }
}

export async function logOrder(order) {
    if (process.env.SAVE_LOGS === 'false') return;
    
    try {
        const db = await getDB();
        await db.run(
            `INSERT INTO orders (order_id, symbol, side, type, quantity, price, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                order.orderId, 
                order.symbol, 
                order.side, 
                order.type, 
                order.quantity, 
                order.price, 
                order.status || 'EXECUTED'
            ]
        );
    } catch (error) {
        console.error('❌ Erreur dans logOrder:', error);
    }
}

export async function getDashboardData() {
    try {
        const db = await getDB();
        const [signals, orders, settings] = await Promise.all([
            db.all('SELECT * FROM signals ORDER BY timestamp DESC LIMIT 50').catch(() => []),
            db.all('SELECT * FROM orders ORDER BY timestamp DESC LIMit 50').catch(() => []),
            getSettings()
        ]);
        
        return { signals, orders, settings };
    } catch (error) {
        console.error('❌ Erreur critique dans getDashboardData:', error);
        return {
            signals: [],
            orders: [],
            settings: {
                tradingMode: 'spot',
                environment: 'test',
                positionSize: 100
            }
        };
    }
}
