export function calculateContainerNeeds(densityPerSquareMeter, areaSquareMeters) {
    const WASTE_PER_PERSON_PER_DAY_KG = 0.79;
    const CONTAINER_CAPACITY_KG = 96;
    const COLLECTION_FREQUENCY_PER_DAY = 1;
  
    const estimatedPopulation = densityPerSquareMeter * areaSquareMeters;
    const totalWastePerDay = estimatedPopulation * WASTE_PER_PERSON_PER_DAY_KG;
    const containerCount = Math.ceil(
      totalWastePerDay / (CONTAINER_CAPACITY_KG * COLLECTION_FREQUENCY_PER_DAY)
    );
  
    return {
      estimatedPopulation: Math.round(estimatedPopulation),
    totalWastePerDay: totalWastePerDay.toFixed(2),
    containerCount
    };
  }