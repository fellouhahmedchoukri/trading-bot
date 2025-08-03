import { getDashboardData } from './db.js';

// Fonction de broadcast désactivée
export function broadcastDashboardUpdate() {
  console.log('WebSocket désactivé');
}

// Gestion des erreurs critiques
process.on('uncaughtException', error => {
  console.error('CRITICAL ERROR:', error);
});
