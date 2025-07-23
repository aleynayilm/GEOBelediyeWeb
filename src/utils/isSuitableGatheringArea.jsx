export function isSuitableGatheringArea({ area, populationDensity }) {
    const MIN_REQUIRED_AREA = 1000;               // Toplanma alanı için en az 1000 m²
    const MIN_AREA_PER_PERSON = 2;                // Kişi başı minimum 2 m² alan düşmeli (afet toplanma standartı)
  
    const estimatedPopulation = populationDensity * area;          // Alandaki toplam tahmini nüfus
    const areaPerPerson = area / estimatedPopulation;              // Kişi başına düşen m²
  
    const isAreaSufficient = area >= MIN_REQUIRED_AREA;
    const isDensityAcceptable = areaPerPerson >= MIN_AREA_PER_PERSON;
  
    return {
      estimatedPopulation: Math.round(estimatedPopulation),
      areaPerPerson: Math.round(areaPerPerson * 100) / 100,
      isAreaSufficient,
      isDensityAcceptable,
      isSuitable: isAreaSufficient && isDensityAcceptable
    };
  }
  