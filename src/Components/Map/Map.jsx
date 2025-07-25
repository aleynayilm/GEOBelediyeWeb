import React, { useEffect, useRef, useCallback, useState, useImperativeHandle } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import Overlay from 'ol/Overlay';
import WKT from 'ol/format/WKT';
import { fromLonLat, transform } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { getData as getLocations, addData, updateLocation, deleteLocation, getOptimizedPoints, addRange } from '../../Api/api';
import { defaults as defaultControls } from 'ol/control';
import Icon from 'ol/style/Icon';
import { calculatePolygonArea } from '../../utils/calculatePolygonArea';

const SimpleMap = React.forwardRef(
    (
        { dataUpdated, onDataUpdated, selectedFilter, drawingMode, onDrawingModeChange, onOptimizationComplete, onSavePolygonWithName },
        ref
    ) => {
        const mapRef = useRef();
        const typeSelectRef = useRef();
        const pointSource = useRef(new VectorSource()); // Source for points
        const polygonSource = useRef(new VectorSource()); // Source for polygons
        const clusterSource = useRef(new Cluster({ source: pointSource.current, distance: 40 }));
        const pointLayer = useRef(null); // Layer for clustered points
        const polygonLayer = useRef(null); // Layer for polygons
        const mapInstance = useRef(null);
        const drawRef = useRef(null);
        const overlayRef = useRef();
        const popupContainerRef = useRef();
        const popupContentRef = useRef();
        const tempPolygonRef = useRef(null);
        const modifyRef = useRef(null);

        const customIconUrls = {
            'Atık Yönetimi': '/icons/Trash/recycling-bin.png',
            'Bölge Planlama': '/icons/Location/placeholder.png',
            'Altyapı Yönetimi': '/icons/Water/traffic-cone.png',
            'Otopark Planlama': '/icons/Parking-Lot/car.png',
            'Tüm Projeler': '/icons/default.svg',
        };

        const getPolygonArea = () => {
            if (!tempPolygonRef.current) {
                console.error('Alan hesaplanacak poligon bulunamadı');
                return null;
            }
            return calculatePolygonArea(tempPolygonRef.current);
        };

        const savePolygon = async (name, type, area, minCoverCount) => {
            if (!tempPolygonRef.current) {
                console.error('Kaydedilecek poligon bulunamadı');
                return false;
            }
            try {
                const wkt = to4326WKT(tempPolygonRef.current);
                await addData({ name, wkt, typeN: type, area });
                const optimizedPoints = await optimizePolygon(wkt, minCoverCount, name);
                if (optimizedPoints) {
                    onOptimizationComplete?.(optimizedPoints);
                } else {
                    onOptimizationComplete?.(null);
                }
                return wkt;
            } catch (e) {
                console.error('Poligon kaydetme veya optimizasyon hatası:', e);
                onOptimizationComplete?.(null);
                throw e;
            }
        };

        const optimizePolygon = async (wkt, minCoverCount, polygonName) => {
            if (!wkt) {
                console.error('Optimize edilecek poligon bulunamadı');
                return null;
            }
            try {
                const response = await getOptimizedPoints(wkt, minCoverCount);
                const wktFormatter = new WKT();
                const validPoints = response.data
                    .map((point, index) => ({
                        ...point,
                        id: point.id || `temp-opt-${index}`,
                        name: `${polygonName}-${index + 1}`,
                        typeN: selectedFilter,
                    }))
                    .filter((point) => {
                        if (!point.wkt) {
                            console.error('Invalid point WKT:', point);
                            return false;
                        }
                        return true;
                    });

                const uniquePoints = [];
                const seenCoordinates = new Set();
                validPoints.forEach((point) => {
                    const wktMatch = point.wkt.match(/POINT\s*\(\s*([-]?\d*\.?\d+)\s+([-]?\d*\.?\d+)\s*\)/);
                    if (wktMatch) {
                        const coordKey = `${wktMatch[1]},${wktMatch[2]}`;
                        if (!seenCoordinates.has(coordKey)) {
                            seenCoordinates.add(coordKey);
                            uniquePoints.push(point);
                        }
                    }
                });

                uniquePoints.forEach((point) => {
                    const feature = wktFormatter.readFeature(point.wkt, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857',
                    });
                    feature.set('name', point.name);
                    feature.set('id', point.id);
                    feature.set('typeN', point.typeN);
                    pointSource.current.addFeature(feature); // Add to pointSource
                });

                return uniquePoints;
            } catch (e) {
                console.error('Optimization error:', e);
                return null;
            }
        };

        const savePointsRange = async (points, type, polygonName) => {
            if (!points || points.length === 0) {
                console.error('No points to save');
                throw new Error('No points to save');
            }
            try {
                const data = points
                    .map((point, index) => {
                        const wktMatch = point.wkt?.match(/POINT\s*\(\s*([-]?\d*\.?\d+)\s+([-]?\d*\.?\d+)\s*\)/);
                        if (!wktMatch) return null;
                        const lon = Number(wktMatch[1]).toFixed(6);
                        const lat = Number(wktMatch[2]).toFixed(6);
                        return {
                            name: `${polygonName}-${index + 1}`,
                            wkt: `POINT(${lon} ${lat})`,
                            typeN: type,
                        };
                    })
                    .filter(Boolean);

                const uniquePoints = [];
                const seenCoordinates = new Set();
                data.forEach((point) => {
                    const coordKey = point.wkt;
                    if (!seenCoordinates.has(coordKey)) {
                        seenCoordinates.add(coordKey);
                        uniquePoints.push(point);
                    }
                });

                if (uniquePoints.length === 0) {
                    console.error('No valid unique points to save');
                    throw new Error('No valid unique points to save');
                }

                const response = await addRange(uniquePoints);
                await loadFeaturesFromAPI();
                onDataUpdated?.();
                return response.data;
            } catch (e) {
                console.error('Error saving points:', e);
                throw e;
            }
        };

        const enablePointEditing = () => {
            if (modifyRef.current) {
                mapInstance.current.removeInteraction(modifyRef.current);
            }
            const modify = new Modify({ source: pointSource.current }); // Modify points only
            mapInstance.current.addInteraction(modify);
            modifyRef.current = modify;

            modify.on('modifyend', async (evt) => {
                for (const f of evt.features.getArray()) {
                    const id = f.getId();
                    if (!id || id.startsWith('temp-')) continue;
                    const wkt = to4326WKT(f);
                    try {
                        await updateLocation({ id, wkt });
                        console.log(`Point ${id} updated successfully`);
                    } catch (e) {
                        console.error('Point update error:', e);
                    }
                }
                await loadFeaturesFromAPI();
                onDataUpdated?.();
            });
        };

        useImperativeHandle(ref, () => ({
            savePolygon,
            optimizePolygon,
            addRange: savePointsRange,
            enablePointEditing,
            getPolygonArea,
            zoomToProject: (projectId) => {
                const allFeatures = [...pointSource.current.getFeatures(), ...polygonSource.current.getFeatures()];
                const targetFeature = allFeatures.find((f) => f.getId() === projectId);
                if (!targetFeature) {
                    console.warn('Proje bulunamadı:', projectId);
                    return;
                }
                allFeatures.forEach((f) => {
                    f.setStyle(f.getId() === projectId ? styleFunction(f) : null);
                });
                const geometry = targetFeature.getGeometry();
                const extent = geometry.getType() === 'Point' ? geometry.getExtent() : geometry.getExtent();
                mapInstance.current.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    maxZoom: 17,
                    duration: 800,
                });
            },
            clearProjects: () => {
                pointSource.current.clear();
                polygonSource.current.clear();
            },
        }));

        const isLikelyEPSG3857 = (wktString) => {
            const match = wktString.match(/[-]?\d+(?:\.\d+)?/);
            return match && parseFloat(match[0]) > 180;
        };

        const to4326WKT = (feature) => {
            const geometry = feature.getGeometry();
            if (!geometry) return null;
            if (geometry.getType() === 'Polygon') {
                const coordinates = geometry.getCoordinates()[0];
                const wktCoords = coordinates
                    .map((coord) => {
                        const [lon, lat] = transform(coord, 'EPSG:3857', 'EPSG:4326');
                        return `${lon.toFixed(6)} ${lat.toFixed(6)}`;
                    })
                    .join(', ');
                return `POLYGON((${wktCoords}))`;
            } else if (geometry.getType() === 'Point') {
                const [lon, lat] = transform(geometry.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
                return `POINT(${lon.toFixed(6)} ${lat.toFixed(6)})`;
            }
            return null;
        };

        const styleFunction = useCallback(
            (feature) => {
                const features = feature.get('features'); // Cluster features for points
                const geomType = feature.getGeometry().getType();
                const featureTypeN = features ? features[0]?.get('typeN') || 'Tüm Projeler' : feature.get('typeN') || 'Tüm Projeler';

                if (selectedFilter !== 'Tüm Projeler' && featureTypeN !== selectedFilter) {
                    return null;
                }

                const iconUrl = customIconUrls[featureTypeN] || customIconUrls['Tüm Projeler'];
                const themeColors = {
                    'Atık Yönetimi': '#10b981',
                    'Bölge Planlama': '#f59e0b',
                    'Altyapı Yönetimi': '#ec4899',
                    'Otopark Planlama': '#8b5cf6',
                    'Tüm Projeler': '#888',
                };
                const color = themeColors[featureTypeN] || '#888';

                if (geomType === 'Point') {
                    if (features && features.length > 1) {
                        // Cluster style with icon
                        const size = features.length;
                        return new Style({
                            image: new Icon({
                                src: iconUrl, // Use the same icon as individual points
                                scale: 0.08, // Slightly larger for clusters
                                anchor: [0.5, 0.9],
                            }),
                            text: new Text({
                                text: size.toString(), // Optional: Show number of points
                                font: 'bold 12px Arial',
                                fill: new Fill({ color: '#fff' }),
                                stroke: new Stroke({ color: '#000', width: 2 }),
                                offsetY: -25, // Adjust position above icon
                            }),
                        });
                    }
                    // Single point style
                    return new Style({
                        image: new Icon({
                            src: iconUrl,
                            scale: 0.06,
                            anchor: [0.5, 0.9],
                        }),
                        text: new Text({
                            text: feature.get('name') || features?.[0]?.get('name') || '',
                            font: 'bold 12px Arial',
                            fill: new Fill({ color: '#000' }),
                            stroke: new Stroke({ color: '#fff', width: 2 }),
                            offsetY: -20,
                        }),
                    });
                }

                if (geomType === 'Polygon') {
                    return new Style({
                        stroke: new Stroke({ color, width: 2 }),
                        fill: new Fill({ color: `${color}33` }),
                        text: new Text({
                            text: feature.get('name') || '',
                            font: 'bold 12px Arial',
                            fill: new Fill({ color: '#000' }),
                            stroke: new Stroke({ color: '#fff', width: 2 }),
                            offsetY: -15,
                        }),
                    });
                }

                return null;
            },
            [selectedFilter]
        );

        const loadFeaturesFromAPI = async () => {
            pointSource.current.clear();
            polygonSource.current.clear();
            try {
                const res = await getLocations();
                const records = res.data ?? res;
                if (!Array.isArray(records)) return;

                const wktFormatter = new WKT();

                records.forEach((item) => {
                    if (!item.wkt) return;
                    if (selectedFilter !== 'Tüm Projeler' && item.typeN !== selectedFilter) return;
                    const projection = isLikelyEPSG3857(item.wkt) ? 'EPSG:3857' : 'EPSG:4326';
                    const feature = wktFormatter.readFeature(item.wkt, {
                        dataProjection: projection,
                        featureProjection: 'EPSG:3857',
                    });
                    const geomType = feature.getGeometry().getType();
                    feature.setId(item.id);
                    feature.set('name', item.name);
                    feature.set('typeN', item.typeN || 'Tüm Projeler');
                    if (geomType === 'Point') {
                        pointSource.current.addFeature(feature); // Add points to pointSource
                    } else if (geomType === 'Polygon') {
                        polygonSource.current.addFeature(feature); // Add polygons to polygonSource
                    }
                });
            } catch (err) {
                console.error('Veri yüklenirken hata:', err);
            }
        };

        const addDrawInteraction = () => {
            if (drawRef.current) mapInstance.current.removeInteraction(drawRef.current);

            const drawType = typeSelectRef.current.value;
            if (drawType === 'None') return;

            const source = drawType === 'Point' ? pointSource.current : polygonSource.current;
            const draw = new Draw({
                source,
                type: drawType,
                freehand: false,
            });

            draw.on('drawend', async (evt) => {
                const f = evt.feature;
                const geomType = f.getGeometry().getType();

                if (geomType === 'Polygon') {
                    tempPolygonRef.current = f;
                    f.set('typeN', selectedFilter);
                    if (onDrawingModeChange) {
                        onDrawingModeChange(false);
                    }
                } else {
                    const wkt = to4326WKT(f);
                    const name = prompt('Bu objeye isim verin:');
                    if (!name) {
                        setTimeout(() => pointSource.current.removeFeature(f), 0);
                        return;
                    }
                    try {
                        await addData({ name, wkt, typeN: selectedFilter });
                        await loadFeaturesFromAPI();
                        onDataUpdated?.();
                    } catch (e) {
                        console.error('Kaydetme hatası:', e);
                        setTimeout(() => pointSource.current.removeFeature(f), 0);
                    }
                }
            });

            mapInstance.current.addInteraction(draw);
            drawRef.current = draw;
        };

        useEffect(() => {
            pointLayer.current = new VectorLayer({
                source: clusterSource.current,
                style: styleFunction,
            });
            polygonLayer.current = new VectorLayer({
                source: polygonSource.current,
                style: styleFunction,
            });

            mapInstance.current = new Map({
                target: mapRef.current,
                layers: [
                    new TileLayer({ source: new OSM() }),
                    polygonLayer.current, // Add polygon layer first (background)
                    pointLayer.current,   // Add point layer on top
                ],
                view: new View({
                    center: fromLonLat([34, 39]),
                    zoom: 6,
                }),
                controls: defaultControls({
                    zoom: false,
                    rotate: false,
                    attribution: false,
                }),
            });

            overlayRef.current = new Overlay({
                element: popupContainerRef.current,
                autoPan: true,
                positioning: 'bottom-center',
                stopEvent: false,
                offset: [0, -10],
            });
            mapInstance.current.addOverlay(overlayRef.current);

            const select = new Select({
                layers: [pointLayer.current, polygonLayer.current], // Select from both layers
            });
            mapInstance.current.addInteraction(select);
            select.on('select', (evt) => {
                const ft = evt.selected[0];
                if (!ft) {
                    overlayRef.current.setPosition(undefined);
                    return;
                }

                const features = ft.get('features'); // Check if it's a cluster (points only)
                const geom = ft.getGeometry();
                const coord =
                    geom.getType() === 'Point'
                        ? geom.getCoordinates()
                        : geom.getType() === 'Polygon' && geom.getInteriorPoint
                            ? geom.getInteriorPoint().getCoordinates()
                            : geom.getClosestPoint(mapInstance.current.getView().getCenter());

                if (features && features.length > 1) {
                    // Cluster popup
                    const names = features.map((f) => f.get('name') || 'Unnamed').join(', ');
                    popupContentRef.current.innerHTML = `
                        <strong>Cluster (${features.length} points)</strong><br/>
                        <strong>Names:</strong> ${names}<br/>
                        <button class="zoom-cluster">Zoom to Cluster</button>
                    `;
                    popupContentRef.current.querySelector('.zoom-cluster').onclick = () => {
                        const extent = ft.getGeometry().getExtent();
                        mapInstance.current.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 18,
                            duration: 800,
                        });
                    };
                } else {
                    // Single feature popup (point or polygon)
                    const singleFeature = features ? features[0] : ft;
                    popupContentRef.current.innerHTML = `
                        <strong>ID:</strong> ${singleFeature.getId()}<br/>
                        <strong>İsim:</strong> ${singleFeature.get('name')}<br/>
                        <strong>Tür:</strong> ${singleFeature.get('typeN') || 'Tüm Projeler'}<br/>
                        <button class="del">🗑️ Sil</button>
                    `;
                    popupContentRef.current.querySelector('.del').onclick = async () => {
                        if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
                        try {
                            await deleteLocation(singleFeature.getId());
                            const source = singleFeature.getGeometry().getType() === 'Point' ? pointSource.current : polygonSource.current;
                            source.removeFeature(singleFeature);
                            overlayRef.current.setPosition(undefined);
                        } catch (e) {
                            console.error('Silme hatası:', e);
                        }
                    };
                }

                overlayRef.current.setPosition(coord);
            });

            const keyHandler = (e) => {
                if (e.key === 'Escape' && drawRef.current) {
                    drawRef.current.abortDrawing();
                    if (onDrawingModeChange) {
                        onDrawingModeChange(false);
                    }
                }
            };
            document.addEventListener('keydown', keyHandler);

            loadFeaturesFromAPI();

            return () => {
                mapInstance.current.setTarget(undefined);
                document.removeEventListener('keydown', keyHandler);
            };
        }, [selectedFilter]);

        useEffect(() => {
            if (drawingMode) {
                typeSelectRef.current.value = 'Polygon';
                addDrawInteraction();
            } else {
                if (drawRef.current) {
                    mapInstance.current.removeInteraction(drawRef.current);
                    drawRef.current = null;
                }
            }
        }, [drawingMode]);

        useEffect(() => {
            if (pointLayer.current && polygonLayer.current) {
                pointLayer.current.setStyle(styleFunction);
                polygonLayer.current.setStyle(styleFunction);
            }
        }, [selectedFilter, styleFunction]);

        return (
            <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
                <div className="draw-controls" style={{ position: 'absolute', zIndex: 10, margin: '10px' }}>
                    <select
                        ref={typeSelectRef}
                        defaultValue="Polygon"
                        className="custom-select"
                        onChange={() => addDrawInteraction()}
                    >
                        <option value="None">Tür Seç</option>
                        <option value="Point">Nokta</option>
                        <option value="Polygon">Alan</option>
                    </select>
                </div>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                <div ref={popupContainerRef} className="ol-popup">
                    <div ref={popupContentRef} />
                </div>
            </div>
        );
    }
);

export default SimpleMap;