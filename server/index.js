import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupRoutes } from './routes.js';
import dotenv from 'dotenv';

// Initialisation de l'environnement
dotenv.config();

// Création de l'application Express
const app = express();

// Middlewares
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Middleware de logging personnalisé
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Configuration des routes
setupRoutes(app);

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.stack);
    res.status(500).json({ 
        status: 'error', 
        message: 'Erreur interne du serveur' 
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`⚙️ Mode: ${process.env.ENVIRONMENT || 'test'} | ${process.env.TRADING_MODE || 'spot'}`);
    console.log('='.repeat(50));
});
