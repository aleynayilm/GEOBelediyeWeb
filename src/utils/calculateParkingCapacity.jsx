export function calculateParkingCapacity({ area, usageType, populationDensity }) {
    const densityByType = {
      residential: 0.8, //her kullanım türü için yoğunluk katsayısı
      commercial: 1.2,
      mixed: 1.0
    };

    const PEOPLE_PER_CAR = 3;              // Her 3 kişi için 1 araç
  const PARKING_SPACE_SIZE = 25;         // m² başına 1 araçlık park alanı (ortalama)

  const buildingDensity = densityByType[usageType] || 1.0;
  const estimatedBuildingArea = area * buildingDensity;
  
  const estimatedPopulation = populationDensity * area;
  const requiredParkingSpacesByPopulation = Math.ceil(estimatedPopulation / PEOPLE_PER_CAR);
  const possibleParkingCapacity = Math.floor(area / PARKING_SPACE_SIZE);

  const isSuitable = possibleParkingCapacity >= requiredParkingSpacesByPopulation;

  return {
    estimatedPopulation: Math.round(estimatedPopulation),
    requiredParkingSpacesByPopulation,
    possibleParkingCapacity,
    isSuitable
  };
  } 
  