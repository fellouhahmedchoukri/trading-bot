import { WebSocketServer } from './ws-compat.js';
import { getDashboardData } from './db.js';

let wss = null;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    sendDashboardUpdate(ws);
  });
  
  setInterval(broadcastDashboardUpdate, 5000);
}

export function broadcastDashboardUpdate() {
  if (!wss || wss.clients.size === 0) return;
  
  getDashboardData().then(data => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // 1 = OPEN
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

process.on('uncaughtException', error => {
  console.error('CRITICAL ERROR:', error);
});
