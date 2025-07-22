export function calculateManholeNeeds({
    area, // Yağmurun düştüğü yüzeyin alanı m²
    rainfallIntensity, // Yağmur şiddeti  mm/dk
    duration, // dk
    runoffCoefficient = 0.9, // asfalt zemin varsayımı
    capacityPerManhole = 500 // Bir rögar kapağının tahliye edebileceği maksimum su miktarı litre
  }) {
    const totalRainwater = area * rainfallIntensity * duration * runoffCoefficient;
    const requiredManholeCount = Math.ceil(totalRainwater / capacityPerManhole);
  
    return {
      totalRainwater: Math.round(totalRainwater), // litre
      requiredManholeCount
    };
  }