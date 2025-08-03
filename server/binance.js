import axios from 'axios';
import crypto from 'crypto';
import { logSignal, logOrder, getSettings } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.ENVIRONMENT === 'test' 
  ? 'https://testnet.binance.vision' 
  : 'https://api.binance.com';

const API_KEY = process.env.ENVIRONMENT === 'test'
  ? process.env.BINANCE_API_KEY_TEST
  : process.env.BINANCE_API_KEY_PROD;

const API_SECRET = process.env.ENVIRONMENT === 'test'
  ? process.env.BINANCE_API_SECRET_TEST
  : process.env.BINANCE_API_SECRET_PROD;

export async function executeTrade(signal) {
  const settings = await getSettings();
  
  try {
    switch(signal.action) {
      case 'entry':
        return await placeGridOrder(signal, settings);
      case 'exit':
        return await closeAllPositions(signal.symbol, settings);
      case 'destroy':
        return await emergencyClose(signal.symbol, settings);
      default:
        throw new Error(`Action inconnue: ${signal.action}`);
    }
  } catch (error) {
    console.error('Erreur execution trade:', error);
    throw error;
  }
}

async function placeGridOrder(signal, settings) {
  const endpoint = settings.tradingMode === 'futures'
    ? '/fapi/v1/order'
    : '/api/v3/order';
  
  const orderParams = {
    symbol: signal.symbol,
    side: 'BUY',
    type: 'LIMIT',
    quantity: calculatePositionSize(signal.level, settings),
    price: signal.price,
    timeInForce: 'GTC',
    timestamp: Date.now()
  };

  if (settings.tradingMode === 'futures') {
    orderParams.positionSide = 'BOTH';
  }

  const response = await binanceSignedRequest(endpoint, orderParams);
  await logOrder({
    ...orderParams,
    orderId: response.orderId,
    status: 'EXECUTED'
  });
  
  return response;
}

function calculatePositionSize(level, settings) {
  const baseQty = settings.positionSize;
  const levelFactors = {
    6: 1.0, 7: 0.8, 8: 0.6, 9: 0.4, 10: 0.2
  };
  
  const qty = baseQty * (levelFactors[level] || 1);
  return settings.tradingMode === 'futures' 
    ? qty.toFixed(3) 
    : qty.toFixed(5);
}

async function binanceSignedRequest(endpoint, params) {
  const query = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(query)
    .digest('hex');
  
  const url = `${BASE_URL}${endpoint}?${query}&signature=${signature}`;
  
  try {
    const response = await axios.post(url, null, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur API Binance:', error.response?.data || error.message);
    throw new Error('Erreur API Binance');
  }
}

// Fermer toutes les positions (version avancée)
async function closeAllPositions(symbol, settings) {
  if (settings.tradingMode === 'futures') {
    await closeFuturesPositions(symbol);
  } else {
    await closeSpotPositions(symbol);
  }
}

async function closeFuturesPositions(symbol) {
  // 1. Fermer toutes les positions ouvertes
  const positionsEndpoint = '/fapi/v2/positionRisk';
  const positions = await binanceSignedRequest(positionsEndpoint, { symbol });
  
  for (const position of positions) {
    if (Math.abs(position.positionAmt) > 0) {
      const side = position.positionAmt > 0 ? 'SELL' : 'BUY';
      const orderParams = {
        symbol,
        side,
        type: 'MARKET',
        quantity: Math.abs(position.positionAmt),
        timestamp: Date.now()
      };
      
      await binanceSignedRequest('/fapi/v1/order', orderParams);
    }
  }
  
  // 2. Annuler tous les ordres ouverts
  await binanceSignedRequest('/fapi/v1/allOpenOrders', {
    symbol,
    timestamp: Date.now()
  });
}

async function closeSpotPositions(symbol) {
  // 1. Vendre tous les actifs
  const asset = symbol.replace('USDT', '');
  const account = await binanceSignedRequest('/api/v3/account', { timestamp: Date.now() });
  const balance = account.balances.find(b => b.asset === asset);
  
  if (balance && parseFloat(balance.free) > 0) {
    const orderParams = {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: balance.free,
      timestamp: Date.now()
    };
    
    await binanceSignedRequest('/api/v3/order', orderParams);
  }
  
  // 2. Annuler tous les ordres ouverts
  await binanceSignedRequest('/api/v3/openOrders', {
    symbol,
    timestamp: Date.now()
  });
}

async function emergencyClose(symbol, settings) {
  await closeAllPositions(symbol, settings);
  await logSignal({
    ...signal,
    action: 'emergency',
    message: 'GRID DESTROYED'
  });
}
