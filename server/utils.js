import WebSocket from 'ws';
import { getDashboardData } from './db.js';

let wss = null;

export function initWebSocket() {
  wss = new WebSocket.Server({ noServer: true });
  
  wss.on('connection', ws => {
    sendDashboardUpdate(ws);
  });
  
  setInterval(broadcastDashboardUpdate, 5000);
}

export function broadcastDashboardUpdate() {
  if (!wss || wss.clients.size === 0) return;
  
  getDashboardData().then(data => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'dashboard_update',
          data
        }));
      }
    });
  });
}

async function sendDashboardUpdate(ws) {
  try {
    const data = await getDashboardData();
    ws.send(JSON.stringify({
      type: 'dashboard_init',
      data
    }));
  } catch (error) {
    console.error('Error sending dashboard init:', error);
  }
}

// Gestion des erreurs critiques
process.on('uncaughtException', error => {
  console.error('CRITICAL ERROR:', error);
  // Alerting logic here (email, SMS, etc.)
});
