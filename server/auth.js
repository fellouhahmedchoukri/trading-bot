export function authenticateWebhook(req, res, next) {
  const SECRET = process.env.TV_WEBHOOK_SECRET;
  
  if (!SECRET) {
    console.warn("Aucun secret configuré - Accès non sécurisé!");
    return next();
  }

  // Vérification par header
  const headerSecret = req.headers['tv-webhook-secret'];
  
  // Vérification par body (alternative)
  const bodySecret = req.body?.secret;

  if (headerSecret === SECRET || bodySecret === SECRET) {
    console.log("✅ Webhook authentifié");
    next();
  } else {
    console.error("❌ Accès non autorisé. Secret reçu:", headerSecret || bodySecret);
    res.status(401).json({
      status: 'error',
      message: 'Non autorisé'
    });
  }
}
