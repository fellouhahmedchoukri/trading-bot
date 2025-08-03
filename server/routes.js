import express from 'express';
import { executeTrade } from './binance.js';
import { logSignal, getDashboardData, updateSettings } from './db.js';
import { authenticateWebhook } from './auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupRoutes(app) {
  // Webhook TradingView
  app.post('/webhook', authenticateWebhook, async (req, res) => {
    try {
      await logSignal(req.body);
      await executeTrade(req.body);
      res.status(200).send('Trade executed');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing trade');
    }
  });
  
  // API Dashboard
  app.get('/api/dashboard', async (req, res) => {
    try {
      const data = await getDashboardData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  
  // Mise à jour des paramètres
  app.post('/api/settings', async (req, res) => {
    try {
      const newSettings = await updateSettings(req.body);
      res.json(newSettings);
    } catch (error) {
      res.status(500).json({ error: 'Update failed' });
    }
  });
  
  // Serveur de dashboard
  const dashboardPath = path.join(__dirname, '../dashboard/public');
  app.use('/dashboard', express.static(dashboardPath));
  
  // Route pour servir l'index du dashboard
  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(dashboardPath, 'index.html'));
  });
}
