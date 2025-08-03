// Ajouter en haut du fichier
import './websocket-fix.js';

// Le reste du code inchangé
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupRoutes } from './routes.js';
import { initWebSocket } from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

setupRoutes(app);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`⚙️ Mode: ${process.env.ENVIRONMENT || 'test'} | ${process.env.TRADING_MODE || 'spot'}`);
});

initWebSocket(server);

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupRoutes } from './routes.js';
import { initWebSocket } from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Initialisation des routes
setupRoutes(app);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`⚙️ Mode: ${process.env.ENVIRONMENT || 'test'} | ${process.env.TRADING_MODE || 'spot'}`);
});

// Initialisation WebSocket avec le serveur HTTP
initWebSocket(server);

