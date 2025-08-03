import fs from 'fs';

export function checkVolumeAccess() {
  const volumePath = '/data';
  
  try {
    // Vérifier si le volume existe
    if (!fs.existsSync(volumePath)) {
      console.warn(`⚠️ Le volume ${volumePath} n'existe pas`);
      return false;
    }
    
    // Tester les permissions
    const testFile = `${volumePath}/test-${Date.now()}.txt`;
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    console.log(`✅ Accès au volume ${volumePath} vérifié`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur d'accès au volume ${volumePath}:`, error);
    return false;
  }
}
