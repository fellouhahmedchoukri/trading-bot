import axios from 'axios';
import crypto from 'crypto';
import { logOrder, getSettings } from './db.js';
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
    // Actions de base supportées
    if (['buy', 'sell'].includes(signal.action.toLowerCase())) {
      return await placeMarketOrder(signal, settings);
    }
    
    // Actions avancées de la stratégie de grille
    switch(signal.action.toLowerCase()) {
      case 'entry':
        return await placeGridOrder(signal, settings);
      case 'exit':
        return await closeAllPositions(signal.symbol, settings);
      case 'destroy':
        return await emergencyClose(signal, settings);
      default:
        throw new Error(`Action inconnue: ${signal.action}`);
    }
  } catch (error) {
    console.error('Erreur execution trade:', error);
    
    // Journaliser l'échec
    await logOrder({
      symbol: signal.symbol,
      side: signal.action.toUpperCase(),
      type: 'MARKET',
      quantity: parseFloat(signal.quantity || 0),
      price: 0,
      status: 'FAILED: ' + error.message
    });
    
    throw error;
  }
}

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

  if (settings.tradingMode === 'futures') {
    orderParams.positionSide = 'BOTH';
  }

  const response = await binanceSignedRequest(endpoint, orderParams);
  
  // Vérifier si la réponse est valide
  if (!response || !response.orderId) {
    throw new Error('Réponse invalide de Binance: ' + JSON.stringify(response));
  }
  
  await logOrder({
    ...orderParams,
    orderId: response.orderId,
    status: 'EXECUTED',
    price: parseFloat(response.price) || 0
  });
  
  return response;
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
      headers: { 
        'X-MBX-APIKEY': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('Réponse Binance:', response.data);
    return response.data;
  } catch (error) {
    let errorMessage = 'Erreur API Binance';
    
    if (error.response) {
      // Erreur avec réponse du serveur
      errorMessage = `Erreur ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      // Pas de réponse du serveur
      errorMessage = 'Pas de réponse de Binance';
    } else {
      // Erreur de configuration
      errorMessage = error.message;
    }
    
    console.error('Erreur API Binance:', errorMessage);
    throw new Error(errorMessage);
  }
}

// Les autres fonctions restent inchangées...
async function placeGridOrder(signal, settings) {
  /* ... */
}

function calculatePositionSize(level, settings) {
  /* ... */
}

async function closeAllPositions(symbol, settings) {
  /* ... */
}

async function closeFuturesPositions(symbol) {
  /* ... */
}

async function closeSpotPositions(symbol) {
  /* ... */
}

async function emergencyClose(signal, settings) {
  /* ... */
}
