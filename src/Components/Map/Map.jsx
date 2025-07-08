import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

export default function SimpleMap() {
    const mapRef = useRef();

    useEffect(() => {
        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() })
            ],
            view: new View({
                center: [34, 39], // Türkiye merkezli
                zoom: 6
            })
        });

        return () => map.setTarget(undefined); // Temizlik
    }, []);

    return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
}