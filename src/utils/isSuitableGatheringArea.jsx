export function isSuitableGatheringArea({ area, centroid }, nearbyRegions) {
    const MIN_REQUIRED_AREA = 1000; // m²
    const MAX_DISTANCE = 500; // metre

    const area = turf.area(geometry); // GeoJSON Polygon → m²
  const centroid = turf.centroid(geometry).geometry.coordinates;
  const centroidObj = { lat: centroid[1], lon: centroid[0] }; // {lat, lon}
  
    const isAreaSufficient = area >= MIN_REQUIRED_AREA; //Arazinin alanı 1000 m²'den büyükse "yeterli alan var" der
  
    let nearbyPopulation = 0;
  
    nearbyRegions.forEach(region => {
      const distance = haversineDistance(centroid, region.centroid);
      if (distance <= MAX_DISTANCE) {
        nearbyPopulation += region.population;
      }
    }); //500 metre yarıçap içindeki bölgelerde kaç kişi yaşıyor, bunu toplar
  
    return {
      isAreaSufficient,
      nearbyPopulation,
      isSuitable: isAreaSufficient && nearbyPopulation > 0
    };
  }
  
  // Haversine mesafe fonksiyonu: iki koordinat arasında dünyanın eğriliğini hesaba katarak mesafeyi metre cinsinden hesaplar
  function haversineDistance(coord1, coord2) {
    const R = 6371000; // Yarıçap (metre)
    const toRad = deg => (deg * Math.PI) / 180;
  
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lon - coord1.lon);
    const lat1 = toRad(coord1.lat);
    const lat2 = toRad(coord2.lat);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // metre
  }
  