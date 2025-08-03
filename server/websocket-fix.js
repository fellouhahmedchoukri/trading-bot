import ws from 'ws';

// Fix global pour les environnements ES Modules
global.WebSocket = ws.WebSocket;
global.WebSocketServer = ws.WebSocketServer;

// Méthode de création alternative
ws.createWebSocketServer = (options) => new ws.WebSocketServer(options);

export default ws;
