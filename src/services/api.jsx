import axios from 'axios';
const BASE_URL = 'http://localhost:3000/api';
export const updateMinCoverCount = async (newCount) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock backend: kapak sayısı güncellendi -> ${newCount}`);
        resolve(true);
      }, 500);  // 500ms gecikme ile gerçekçi simülasyon
    });
  };

  export const optimizeTrashBins = async ({ cellSize, newBinCount, minDistance, polygonWkt }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/TrashBin/optimize`,
        polygonWkt, // WKT string olarak body'ye
        {
          params: {
            cellSize, // grid hücre boyutu
            newBinCount, // yerleştirilecek yeni çöp kutusu sayısı
            minDistance, // minimum çöp kutusu arası mesafe (m)
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Optimize error:', error.response?.data || error.message);
      throw error;
    }
  };

  export const optimizeRainwaterDrains = async ({
    rainfallIntensity, //yağış şiddeti(i)
    runoffCoefficient, // yüzeyin su geçirimsizliği(C)
    pipeDiameterOption, // kullanılacak boru çapı (mm)
    maxPipeLength, // bir hatta izin verilen maksimum boru uzunluğu (metre)
    polygonWkt // analiz yapılacak alan
  }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/RainwaterDrain/optimize`,
        polygonWkt,
        {
          params: {
            rainfallIntensity,
            runoffCoefficient,
            pipeDiameterOption,
            maxPipeLength
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Drain optimize error:', error.response?.data || error.message);
      throw error;
    }
  };

  export const optimizeParkingLots = async ({
    minArea, // seçilecek parsellerin minimum alanı (m²)
    isItStateProperty, //devlet mülkü mü
    polygonWkt
  }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/ParkingLot/optimize`,
        polygonWkt,
        {
          params: {
            minArea,
            isItStateProperty
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Parking optimize error:', error.response?.data || error.message);
      throw error;
    }
  };

  export const optimizeParkAreas = async ({
    populationWeight, //nüfus yoğunluğu
    greenSpaceWeight, // mevcut yeşil alan oranının önemi
    safetyWeight, // güvenli bölgelere öncelik verme
    polygonWkt
  }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/ParkArea/optimize`,
        polygonWkt,
        {
          params: {
            populationWeight,
            greenSpaceWeight,
            safetyWeight
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Park area optimize error:', error.response?.data || error.message);
      throw error;
    }
  };