const signalsTable = document.getElementById('signals-table').querySelector('tbody');
const ordersTable = document.getElementById('orders-table').querySelector('tbody');
const envSelect = document.getElementById('environment-select');
const typeSelect = document.getElementById('trading-type-select');
const positionInput = document.getElementById('position-size');
const saveBtn = document.getElementById('save-settings');

// Mise à jour UI
function updateUI(data) {
  document.getElementById('mode-indicator').textContent = 
    data.settings.environment.toUpperCase();
  document.getElementById('type-indicator').textContent = 
    data.settings.tradingMode.toUpperCase();
  
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

// Fonction pour récupérer les données
async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard');
    const data = await response.json();
    updateUI(data);
    
    // Synchroniser les paramètres UI
    envSelect.value = data.settings.environment;
    typeSelect.value = data.settings.tradingMode;
    positionInput.value = data.settings.positionSize;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

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
    
    await fetchDashboardData(); // Rafraîchir les données après mise à jour
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    alert('Échec de la mise à jour des paramètres');
  }
});

// Actualiser les données toutes les 5 secondes
setInterval(fetchDashboardData, 5000);
fetchDashboardData(); // Chargement initial
