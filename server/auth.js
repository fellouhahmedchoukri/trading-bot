import dotenv from 'dotenv';
dotenv.config();

export function authenticateWebhook(req, res, next) {
  const providedSecret = req.headers['tv-secret'];
  
  if (!providedSecret || providedSecret !== process.env.TV_WEBHOOK_SECRET) {
    console.warn('Accès non autorisé depuis IP:', req.ip);
    return res.status(403).send('Accès non autorisé');
  }
  
  next();
}
