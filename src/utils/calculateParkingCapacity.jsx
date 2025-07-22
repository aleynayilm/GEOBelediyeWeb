export function calculateParkingCapacity({ area, usageType }) {
    const densityByType = {
      residential: 0.8, //her kullanım türü için yoğunluk katsayısı
      commercial: 1.2,
      mixed: 1.0
    };
  
    const buildingDensity = densityByType[usageType] || 1.0;
    const estimatedBuildingArea = area * buildingDensity; //tahmini inşaat alanı m2
    const requiredParkingSpaces = Math.ceil(estimatedBuildingArea / 100); //Her 100 m² yapı için 1 araçlık otopark gerekir
  
    return {
      estimatedBuildingArea: Math.round(estimatedBuildingArea),
      requiredParkingSpaces
    };
  } 
  