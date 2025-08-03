// server/websocket-fix.js
import ws from 'ws';

// Fix pour les environnements ES Modules
global.WebSocket = ws.WebSocket;
global.WebSocketServer = ws.WebSocketServer;

// Méthode alternative de création
ws.createWebSocketServer = (options) => new ws.WebSocketServer(options);

export default ws;
