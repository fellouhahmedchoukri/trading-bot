// server/auth.js
export function authenticateWebhook(req, res, next) {
  const SECRET = process.env.TV_WEBHOOK_SECRET;
  
  // Méthode 1: Vérification par header (recommandée)
  const headerSecret = req.headers['tv-webhook-secret'];
  
  // Méthode 2: Vérification par body (alternative)
  const bodySecret = req.body?.secret;

  if (!SECRET) {
    console.warn("Aucun secret configuré - Accès non sécurisé!");
    return next();
  }

  if (headerSecret === SECRET || bodySecret === SECRET) {
    next();
  } else {
    console.error("Accès non autorisé. Secret reçu:", headerSecret || bodySecret);
    res.status(401).send("Non autorisé");
  }
}
