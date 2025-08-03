import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const DB_DIR = isProduction ? '/data' : path.resolve(process.cwd());
const DB_PATH = path.join(DB_DIR, 'trading.db');

try {
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log(`📂 Dossier créé: ${DB_DIR}`);
  }

  // Créer le fichier s'il n'existe pas
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, '');  // Correction de la création de fichier
    console.log(`📄 Fichier DB créé: ${DB_PATH}`);
  } else {
    console.log(`ℹ️ Fichier DB existant: ${DB_PATH}`);
  }

  // Définir les permissions
  if (isProduction) {
    fs.chmodSync(DB_PATH, 0o666);
    console.log(`🔒 Permissions définies: 0666`);
  }
  
  console.log('✅ Configuration DB terminée');
} catch (error) {
  console.error('❌ Erreur configuration DB:', error);
  process.exit(1);
}
