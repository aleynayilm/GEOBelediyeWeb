// SimpleMap.jsx - Ikon seçimi, etiketleme, popup ve modify ile tam güncellenmiş hali
import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import Overlay from 'ol/Overlay';
import WKT from 'ol/format/WKT';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { getData as getLocations, addData } from '../../Api/api';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

export default function SimpleMap() {
    const mapRef = useRef();
    const typeSelectRef = useRef();
    const iconSelectRef = useRef();
    const undoButtonRef = useRef();
    const vectorSource = useRef(new VectorSource());
    const mapInstance = useRef(null);
    const drawRef = useRef(null);
    const overlayRef = useRef();
    const popupContainerRef = useRef();
    const popupContentRef = useRef();

    const styleFunction = (feature) => {
        const type = feature.getGeometry().getType();
        const baseStyle = (() => {
            if (type === 'Point') {
                return new Style({
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: 'yellow' }),
                        stroke: new Stroke({ color: 'black', width: 2 })
                    })
                });
            } else if (type === 'LineString') {
                return new Style({
                    stroke: new Stroke({ color: 'Red', width: 3 })
                });
            } else if (type === 'Polygon') {
                return new Style({
                    stroke: new Stroke({ color: 'red', width: 2 }),
                    fill: new Fill({ color: 'rgba(255, 0, 0, 0.1)' })
                });
            }
        })();

        const id = feature.getId();
        if (id !== undefined) {
            baseStyle.setText(new Text({
                text: String(id),
                font: 'bold 12px Arial',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({ color: '#fff', width: 2 }),
                offsetY: -15
            }));
        }

        return baseStyle;
    };

    const isLikelyEPSG3857 = (wktString) => {
        const match = wktString.match(/[-]?\d+(\.\d+)?/);
        return match && parseFloat(match[0]) > 180;
    };

    const loadFeaturesFromAPI = async () => {
        try {
            vectorSource.current.clear();
            const format = new WKT();
            const res = await getLocations();
            const response = res.data || res;

            if (!Array.isArray(response)) return;

            response.forEach(item => {
                if (!item.wkt) return;
                try {
                    const projection = isLikelyEPSG3857(item.wkt) ? 'EPSG:3857' : 'EPSG:4326';
                    const feature = format.readFeature(item.wkt, {
                        dataProjection: projection,
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

    useEffect(() => {
        mapInstance.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                new VectorLayer({ source: vectorSource.current, style: styleFunction })
            ],
            view: new View({ center: fromLonLat([34, 39]), zoom: 6 })
        });

        overlayRef.current = new Overlay({
            element: popupContainerRef.current,
            autoPan: true,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -10]
        });
        mapInstance.current.addOverlay(overlayRef.current);

        const addInteraction = () => {
            const type = typeSelectRef.current.value;
            if (type === 'None') return;
            const draw = new Draw({ source: vectorSource.current, type });

            draw.on('drawend', async (event) => {
                const feature = event.feature;
                const wkt = new WKT().writeFeature(feature);

                const name = prompt("Bu objeye bir isim verin:");
                if (!name) {
                    draw.abortDrawing();
                    setTimeout(() => vectorSource.current.removeFeature(feature), 0);
                    return;
                }

                try {
                    await addData({ name, wkt });
                    await loadFeaturesFromAPI();

                    const selectedIcon = iconSelectRef.current.value;
                    if (selectedIcon !== "none") {
                        const iconText = {
                            flag: "🚩",
                            star: "⭐",
                            plane: "✈️",
                            pin: "📍"
                        }[selectedIcon];

                        const iconStyle = new Style({
                            text: new Text({
                                text: iconText,
                                font: '20px sans-serif',
                                offsetY: -20,
                                fill: new Fill({ color: '#000' }),
                                stroke: new Stroke({ color: '#fff', width: 2 })
                            })
                        });

                        const geometry = feature.getGeometry();
                        let iconFeature;
                        if (geometry.getType() === 'Point') {
                            iconFeature = new Feature(new Point(geometry.getCoordinates()));
                        } else if (geometry.getType() === 'LineString') {
                            const coords = geometry.getCoordinates();
                            iconFeature = new Feature(new Point(coords[coords.length - 1]));
                        } else if (geometry.getType() === 'Polygon') {
                            iconFeature = new Feature(new Point(geometry.getInteriorPoint().getCoordinates()));
                        }
                        if (iconFeature) {
                            iconFeature.setStyle(iconStyle);
                            vectorSource.current.addFeature(iconFeature);
                        }
                    }
                } catch (err) {
                    console.error("Kı kayıt hatası:", err);
                    draw.abortDrawing();
                    setTimeout(() => vectorSource.current.removeFeature(feature), 0);
                }
            });

            mapInstance.current.addInteraction(draw);
            drawRef.current = draw;
        };

        addInteraction();

        typeSelectRef.current.onchange = () => {
            if (drawRef.current) mapInstance.current.removeInteraction(drawRef.current);
            addInteraction();
        };

        undoButtonRef.current.addEventListener('click', () => {
            if (drawRef.current) drawRef.current.removeLastPoint();
        });

        const modify = new Modify({ source: vectorSource.current });
        mapInstance.current.addInteraction(modify);

        const select = new Select();
        mapInstance.current.addInteraction(select);
        select.on('select', (e) => {
            const feature = e.selected[0];
            if (feature) {
                const coordinates = feature.getGeometry().getFirstCoordinate();
                const id = feature.getId();
                const name = feature.get('name');
                const wkt = new WKT().writeFeature(feature);
                popupContentRef.current.innerHTML = `
                    <strong>ID:</strong> ${id}<br/>
                    <strong>Name:</strong> ${name}<br/>
                    <strong>WKT:</strong><br/><small>${wkt}</small>
                `;
                overlayRef.current.setPosition(coordinates);
            } else {
                overlayRef.current.setPosition(undefined);
            }
        });

        loadFeaturesFromAPI();
        return () => mapInstance.current.setTarget(undefined);
    }, []);
    useEffect(() => {
        let toggle = true;

        const animate = () => {
            vectorSource.current.getFeatures().forEach((feature) => {
                if (feature.getGeometry().getType() === 'Point') {
                    const fillColor = toggle ? 'red' : 'white';
                    const strokeColor = toggle ? 'white' : 'red';

                    const style = new Style({
                        image: new CircleStyle({
                            radius: 8,
                            fill: new Fill({ color: fillColor }),
                            stroke: new Stroke({ color: strokeColor, width: 3 }),
                        }),
                        text: new Text({
                            text: String(feature.getId() || ''),
                            font: 'bold 12px Arial',
                            fill: new Fill({ color: '#000' }),
                            stroke: new Stroke({ color: '#fff', width: 2 }),
                            offsetY: -15,
                        }),
                    });

                    feature.setStyle(style);
                }
            });

            toggle = !toggle;
            mapInstance.current && mapInstance.current.render();
            setTimeout(animate, 800); // her 0.5 saniyede bir renk değişimi
        };

        animate();
    }, []);
   /* useEffect(() => {
        let radius = 6;
        let growing = true;

        const animate = () => {
            vectorSource.current.getFeatures().forEach((feature) => {
                if (feature.getGeometry().getType() === 'Point') {
                    const style = new Style({
                        image: new CircleStyle({
                            radius: radius,
                            fill: new Fill({ color: 'yellow' }),
                            stroke: new Stroke({ color: 'black', width: 2 }),
                        }),
                        text: new Text({
                            text: String(feature.getId() || ''),
                            font: 'bold 12px Arial',
                            fill: new Fill({ color: '#000' }),
                            stroke: new Stroke({ color: '#fff', width: 2 }),
                            offsetY: -15,
                        }),
                    });
                    feature.setStyle(style);
                }
            });

            radius += growing ? 0.2 : -0.2;
            if (radius > 8) growing = false;
            if (radius < 6) growing = true;

            mapInstance.current && mapInstance.current.render();
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, []);
    *\
    */
    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <div className="draw-controls">
                <select ref={typeSelectRef} defaultValue="Point" className="custom-select">
                    <option value="None">Seçim Yap</option>
                    <option value="Point">Nokta</option>
                    <option value="LineString">Çizgi</option>
                    <option value="Polygon">Alan</option>
                </select>
                <select ref={iconSelectRef} defaultValue="none" className="custom-select">
                    <option value="none">📊 İkon Seç</option>
                    <option value="flag">🚩 Bayrak</option>
                    <option value="star">⭐ Yıldız</option>
                    <option value="plane">✈️ Uçak</option>
                    <option value="pin">📍 Pin</option>
                </select>
                <button ref={undoButtonRef} className="custom-button">
                    ⟲ Geri Al
                </button>
            </div>
            <div ref={mapRef} style={{ width: '100%', height: '90vh' }}></div>
            <div ref={popupContainerRef} className="ol-popup">
                <div ref={popupContentRef}></div>
            </div>
        </div>
    );
}