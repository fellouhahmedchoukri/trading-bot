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

// Nouvelle fonction pour les ordres marché simples
async function placeMarketOrder(signal, settings) {
  const endpoint = settings.tradingMode === 'futures'
    ? '/fapi/v1/order'
    : '/api/v3/order';
  
  const side = signal.action.toUpperCase();
  const symbol = signal.symbol.replace('/', '');
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
  
  await logOrder({
    ...orderParams,
    orderId: response.orderId,
    status: 'EXECUTED',
    price: parseFloat(response.price) || 0
  });
  
  return response;
}

// Les autres fonctions restent inchangées...
async function placeGridOrder(signal, settings) {
  /* ... */
}

function calculatePositionSize(level, settings) {
  /* ... */
}

async function binanceSignedRequest(endpoint, params) {
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
