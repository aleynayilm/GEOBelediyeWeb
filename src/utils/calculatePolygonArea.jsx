import { getArea } from 'ol/sphere';

export function calculatePolygonArea(feature) {
  // Feature'in geometry'sini al ve alanı metre kare cinsinden hesapla
  return getArea(feature.getGeometry(), { projection: 'EPSG:3857' });
}