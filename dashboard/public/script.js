const socket = new WebSocket(`ws://${window.location.hostname}:3000`);
const signalsTable = document.getElementById('signals-table').querySelector('tbody');
const ordersTable = document.getElementById('orders-table').querySelector('tbody');
const envSelect = document.getElementById('environment-select');
const typeSelect = document.getElementById('trading-type-select');
const positionInput = document.getElementById('position-size');
const saveBtn = document.getElementById('save-settings');

// Mise à jour UI
function updateUI(data) {
  // Mise à jour des indicateurs
  document.getElementById('mode-indicator').textContent = 
    data.settings.environment.toUpperCase();
  document.getElementById('type-indicator').textContent = 
    data.settings.tradingMode.toUpperCase();
  
  // Mise à jour des tables
  updateTable(signalsTable, data.signals, signal => `
    <td>${new Date(signal.timestamp).toLocaleTimeString()}</td>
    <td class="${signal.action}">${signal.action}</td>
    <td>${signal.symbol}</td>
    <td>${signal.level || '-'}</td>
    <td>${signal.price ? Number(signal.price).toFixed(4) : '-'}</td>
  `);
  
  updateTable(ordersTable, data.orders, order => `
    <td>${new Date(order.timestamp).toLocaleTimeString()}</td>
    <td>${order.type}</td>
    <td>${order.symbol}</td>
    <td class="${order.side}">${order.side}</td>
    <td>${Number(order.quantity).toFixed(4)}</td>
    <td>${Number(order.price).toFixed(4)}</td>
  `);
}

function updateTable(table, data, rowTemplate) {
  table.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = rowTemplate(item);
    table.appendChild(row);
  });
}

// Gestion WebSocket
socket.addEventListener('open', () => {
  console.log('Connecté au serveur WebSocket');
  document.getElementById('connection-status').textContent = 'CONNECTÉ';
});

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.type === 'dashboard_init' || message.type === 'dashboard_update') {
    updateUI(message.data);
    
    // Synchroniser les paramètres UI
    envSelect.value = message.data.settings.environment;
    typeSelect.value = message.data.settings.tradingMode;
    positionInput.value = message.data.settings.positionSize;
  }
});

socket.addEventListener('close', () => {
  console.log('Déconnecté du serveur WebSocket');
  document.getElementById('connection-status').textContent = 'DÉCONNECTÉ';
});

// Gestion des paramètres
saveBtn.addEventListener('click', async () => {
  const newSettings = {
    environment: envSelect.value,
    tradingMode: typeSelect.value,
    positionSize: Number(positionInput.value)
  };
  
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    
    if (!response.ok) throw new Error('Échec de la mise à jour');
    
    const result = await response.json();
    console.log('Paramètres mis à jour:', result);
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    alert('Échec de la mise à jour des paramètres');
  }
});

// Initialisation
fetch('/api/dashboard')
  .then(res => res.json())
  .then(updateUI)
  .catch(console.error);
