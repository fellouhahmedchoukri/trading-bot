// Remplacer le code WebSocket par :
async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard');
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Actualiser toutes les 5 secondes
setInterval(fetchDashboardData, 5000);
fetchDashboardData();
