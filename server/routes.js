import express from 'express';
import { executeTrade } from './binance.js';
import { logSignal, getDashboardData, updateSettings } from './db.js';
import { authenticateWebhook } from './auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupRoutes(app) {
  // Middleware pour parser le JSON
  app.use(express.json());

  // Redirection de la racine vers le dashboard
  app.get('/', (req, res) => {
    res.redirect('/dashboard');
  });

  // Webhook TradingView (sécurisé)
  app.post('/webhook', authenticateWebhook, async (req, res) => {
    try {
      // Journalisation sécurisée (sans secret)
      await logSignal(req.body);
      
      // Exécution du trade
      const tradeResult = await executeTrade(req.body);
      
      res.status(200).json({
        status: 'success',
        message: 'Trade executed',
        details: tradeResult
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error processing trade',
        error: error.message
      });
    }
  });
  
  // API Dashboard
  app.get('/api/dashboard', async (req, res) => {
    try {
      const data = await getDashboardData();
      res.json({
        status: 'success',
        data
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        error: 'Database error',
        details: error.message
      });
    }
  });
  
  // Mise à jour des paramètres
  app.post('/api/settings', async (req, res) => {
    try {
      const newSettings = await updateSettings(req.body);
      res.json({
        status: 'success',
        data: newSettings
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        error: 'Update failed',
        details: error.message
      });
    }
  });
  
  // Serveur de dashboard
  const dashboardPath = path.join(__dirname, '../dashboard/public');
  app.use('/dashboard', express.static(dashboardPath));
  
  // Gestion des routes SPA pour le dashboard
  app.get('/dashboard*', (req, res) => {
    res.sendFile(path.join(dashboardPath, 'index.html'));
  });
  
  // Endpoint de santé pour Railway
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });
  
  // Gestion des erreurs 404
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      error: 'Endpoint not found'
    });
  });
  
  // Middleware d'erreur global
  app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: err.message
    });
  });
}
