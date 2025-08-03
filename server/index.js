import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupRoutes } from './routes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use((req, res, next) => {
console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
next();
});

// Initialisation des routes
setupRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`⚙️ Mode: ${process.env.ENVIRONMENT || 'test'} | ${process.env.TRADING_MODE || 'spot'}`);
});

