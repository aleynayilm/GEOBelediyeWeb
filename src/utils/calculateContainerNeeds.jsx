export function calculateContainerNeeds(population) {
    const WASTE_PER_PERSON_PER_DAY_KG = 1.2;
    const CONTAINER_CAPACITY_KG = 96;
    const COLLECTION_FREQUENCY_PER_DAY = 1;
  
    const totalWastePerDay = population * WASTE_PER_PERSON_PER_DAY_KG;
    const containerCount = Math.ceil(
      totalWastePerDay / (CONTAINER_CAPACITY_KG * COLLECTION_FREQUENCY_PER_DAY)
    );
  
    return {
      totalWastePerDay,
      containerCount
    };
  }