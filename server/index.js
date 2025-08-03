import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupRoutes } from './routes.js';
import dotenv from 'dotenv';

// Initialisation des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();

// Configuration des middlewares de sécurité
app.use(helmet());

// Middleware de logging HTTP
app.use(morgan('combined'));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware de logging personnalisé
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Configuration des routes
setupRoutes(app);

// Middleware de gestion d'erreur (DOIT être après les routes)
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Erreur interne du serveur' 
  });
});

// Récupération du port depuis les variables d'environnement
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`⚙️  Mode: ${process.env.ENVIRONMENT || 'test'} | ${process.env.TRADING_MODE || 'spot'}`);
  console.log('='.repeat(50));
});
