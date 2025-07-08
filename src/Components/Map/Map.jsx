import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import WKT from 'ol/format/WKT';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { getData as getLocations } from '../../Api/api';

export default function SimpleMap({ refreshTrigger }) {
    const mapRef = useRef();
    const vectorSource = useRef(new VectorSource());
    const vectorLayer = useRef(null);
    const mapInstance = useRef(null);

    const styleFunction = (feature) => {
        const type = feature.getGeometry().getType();
        if (type === 'Point') {
            return new Style({
                image: new CircleStyle({
                    radius: 6,
                    fill: new Fill({ color: 'blue' }),
                    stroke: new Stroke({ color: 'white', width: 2 })
                })
            });
        } else if (type === 'LineString') {
            return new Style({
                stroke: new Stroke({ color: 'green', width: 3 })
            });
        } else if (type === 'Polygon') {
            return new Style({
                stroke: new Stroke({ color: 'red', width: 2 }),
                fill: new Fill({ color: 'rgba(255, 0, 0, 0.1)' })
            });
        }
    };

    // Sadece harita ilk kez yüklendiğinde oluşturulsun
    useEffect(() => {
        vectorLayer.current = new VectorLayer({
            source: vectorSource.current,
            style: styleFunction
        });

        mapInstance.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                vectorLayer.current
            ],
            view: new View({
                center: fromLonLat([34, 39]),
                zoom: 6
            })
        });

        return () => mapInstance.current.setTarget(undefined);
    }, []);

    // refreshTrigger değiştiğinde verileri yeniden yükle
    useEffect(() => {
        loadFeaturesFromAPI();
    }, [refreshTrigger]);

    const loadFeaturesFromAPI = async () => {
        try {
            vectorSource.current.clear(); // eski verileri temizle
            const format = new WKT();
            const res = await getLocations();
            const response = res.data || res;

            if (!Array.isArray(response)) {
                console.error('API formatı hatalı:', response);
                return;
            }

            response.forEach(item => {
                if (!item.wkt) return;
                try {
                    const feature = format.readFeature(item.wkt, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    });
                    feature.setId(item.id);
                    feature.setProperties({ name: item.name });
                    vectorSource.current.addFeature(feature);
                } catch (err) {
                    console.warn('WKT Parse Hatası:', item.wkt, err);
                }
            });

            const extent = vectorSource.current.getExtent();
            if (!isNaN(extent[0])) {
                mapInstance.current.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    maxZoom: 15
                });
            }
            mapInstance.current.updateSize();
        } catch (err) {
            console.error('API Hatası:', err);
        }
    };

    return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
}
