// server/utils.js - Version simplifiée sans WebSocket
import { getDashboardData } from './db.js';

// Fonction pour le broadcast (désactivée)
export function broadcastDashboardUpdate() {
  console.log('WebSocket désactivé');
}

// Gestion des erreurs
process.on('uncaughtException', error => {
  console.error('CRITICAL ERROR:', error);
});
