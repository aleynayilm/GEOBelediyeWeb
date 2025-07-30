export function calculateManholeNeeds({
  area, // Yağmurun düştüğü yüzeyin alanı m²
  rainfallIntensity, // Yağmur şiddeti  mm/dk
  duration, // dk
  runoffCoefficient = 0.9, // asfalt zemin varsayımı
  capacityPerManhole = 500 // Bir rögar kapağının tahliye edebileceği maksimum su miktarı litre
}) {
  // mm/dk'yı litre/m²/dk'ya çevir (1 mm = 1 litre/m²)
  const rainfallPerSquareMeter = rainfallIntensity / 1000; // m³/m²/dk
  const totalRainwater = area * rainfallPerSquareMeter * duration * runoffCoefficient * 1000; // litre
  const requiredManholeCount = Math.ceil(totalRainwater / capacityPerManhole);

  return {
    totalRainwater: Math.round(totalRainwater), // litre
    requiredManholeCount
  };
}