async function placeMarketOrder(signal, settings) {
  const endpoint = settings.tradingMode === 'futures'
    ? '/fapi/v1/order'
    : '/api/v3/order';
  
  const side = signal.action.toUpperCase();
  const symbol = signal.symbol.replace('/', '').replace('PERP', '');
  const quantity = parseFloat(signal.quantity);
  
  const orderParams = {
    symbol,
    side,
    type: 'MARKET',
    quantity,
    timestamp: Date.now()
  };

  // Ajouter positionSide UNIQUEMENT pour les futures
  if (settings.tradingMode === 'futures') {
    orderParams.positionSide = 'BOTH';
  } else {
    // Pour le spot, ajouter le paramètre newOrderRespType pour obtenir une réponse complète
    orderParams.newOrderRespType = 'FULL';
  }

  const response = await binanceSignedRequest(endpoint, orderParams);
  
  // Vérifier si la réponse est valide
  if (!response || (!response.orderId && !response.fills)) {
    throw new Error('Réponse invalide de Binance: ' + JSON.stringify(response));
  }
  
  // Extraire l'ID de commande et le prix moyen
  let orderId = response.orderId?.toString();
  let avgPrice = 0;
  
  if (response.fills && response.fills.length > 0) {
    // Calculer le prix moyen pour les ordres spot
    const totalQuote = response.fills.reduce((sum, fill) => sum + parseFloat(fill.price) * parseFloat(fill.qty), 0);
    const totalQty = response.fills.reduce((sum, fill) => sum + parseFloat(fill.qty), 0);
    avgPrice = totalQuote / totalQty;
    
    if (!orderId) orderId = response.clientOrderId;
  } else if (response.price) {
    avgPrice = parseFloat(response.price);
  }
  
  await logOrder({
    ...orderParams,
    orderId: orderId || 'N/A',
    status: 'EXECUTED',
    price: avgPrice
  });
  
  return response;
}
