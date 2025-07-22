import React, { useEffect, useRef, forwardRef } from 'react';
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
import { getData as getLocations, addData, updateLocation, deleteLocation, getOptimizedPoints } from '../../Api/api';
import { defaults as defaultControls } from 'ol/control';
import Icon from 'ol/style/Icon';

const SimpleMap = forwardRef(({
                                  dataUpdated,
                                  onDataUpdated,
                                  selectedFilter,
                                  drawingMode,
                                  onDrawingModeChange,
                                  onOptimizationComplete // Added missing prop
                              }, ref) => {
    const mapRef = useRef();
    const typeSelectRef = useRef();
    const vectorSource = useRef(new VectorSource());
    const mapInstance = useRef(null);
    const drawRef = useRef(null);
    const overlayRef = useRef();
    const popupContainerRef = useRef();
    const popupContentRef = useRef();

    const customIconUrls = {
        'Atık Yönetimi': '/icons/Trash/recycling-bin.png',
        'Bölge Planlama': '/icons/Location/placeholder.png',
        'Altyapı Yönetimi': '/icons/Water/traffic-cone.png',
        'Otopark Planlama': '/icons/Parking-Lot/car.png',
        'Tüm Projeler': '/icons/default.svg'
    };

    const isLikelyEPSG3857 = (wktString) => {
        const match = wktString.match(/[-]?\d+(?:\.\d+)?/);
        return match && parseFloat(match[0]) > 180;
    };

    const to4326WKT = (feature) => {
        const geometry = feature.getGeometry();
        if (geometry.getType() === 'Polygon') {
            const coordinates = geometry.getCoordinates()[0];
            const wktCoords = coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
             return `POLYGON((${wktCoords}))`;
        }
        return new WKT().writeFeature(feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });
    };

    const loadFeaturesFromAPI = async () => {
        vectorSource.current.clear();
        try {
            const res = await getLocations();
            const records = res.data ?? res;
            if (!Array.isArray(records)) return;

            const wktFormatter = new WKT();

            records.forEach((item) => {
                if (!item.wkt) return;
                const projection = isLikelyEPSG3857(item.wkt) ? 'EPSG:3857' : 'EPSG:4326';
                const feature = wktFormatter.readFeature(item.wkt, {
                    dataProjection: projection,
                    featureProjection: 'EPSG:3857',
                });
                const geomType = feature.getGeometry().getType();
                if (geomType === 'Point' || geomType === 'Polygon') {
                    feature.setId(item.id);
                    feature.set('name', item.name);
                    vectorSource.current.addFeature(feature);
                }
            });

            const extent = vectorSource.current.getExtent();
            if (!isNaN(extent[0])) {
                mapInstance.current.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    maxZoom: 15,
                });
            }
        } catch (err) {
            console.error('Veri yüklenirken hata:', err);
        }
    };

    const addDrawInteraction = () => {
        if (drawRef.current) mapInstance.current.removeInteraction(drawRef.current);

        const drawType = typeSelectRef.current.value;
        if (drawType === 'None') return;

        const draw = new Draw({
            source: vectorSource.current,
            type: drawType,
            freehand: false // Enable freehand drawing for better UX
        });

        draw.on('drawend', async (evt) => {
            const f = evt.feature;
            const geomType = f.getGeometry().getType();

            if (geomType === 'Polygon') {
                try {
                    const wkt = to4326WKT(f);
                    console.log('Gönderilen WKT:', wkt);

                    const response = await getOptimizedPoints(wkt);
                    console.log('Alınan yanıt:', response.data);

                    // Call the optimization complete callback
                    if (onOptimizationComplete) {
                        onOptimizationComplete(response.data);
                    }

                    vectorSource.current.clear();

                    const wktFormatter = new WKT();
                    response.data.forEach(point => {
                        const feature = wktFormatter.readFeature(point.wkt, {
                            dataProjection: 'EPSG:4326',
                            featureProjection: 'EPSG:3857',
                        });
                        feature.setId(point.id);
                        feature.set('name', point.name);
                        feature.set('optimized', true);
                        vectorSource.current.addFeature(feature);
                    });

                    const extent = vectorSource.current.getExtent();
                    if (!isNaN(extent[0])) {
                        mapInstance.current.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 15,
                        });
                    }
                } catch (e) {
                    console.error('Optimizasyon hatası:', {
                        message: e.message,
                        responseData: e.response?.data,
                        requestData: e.config?.data
                    });
                    vectorSource.current.removeFeature(f);
                }
            } else {
                const wkt = to4326WKT(f);
                const name = prompt('Bu objeye isim verin:');
                if (!name) {
                    setTimeout(() => vectorSource.current.removeFeature(f), 0);
                    return;
                }
                try {
                    await addData({ name, wkt });
                    await loadFeaturesFromAPI();
                    onDataUpdated?.();
                } catch (e) {
                    console.error('Kaydetme hatası:', e);
                    setTimeout(() => vectorSource.current.removeFeature(f), 0);
                }
            }
        });

        mapInstance.current.addInteraction(draw);
        drawRef.current = draw;
    };

    const styleFunction = (feature) => {
        const geomType = feature.getGeometry().getType();
        const theme = selectedFilter;
        const iconUrl = customIconUrls[theme] || customIconUrls['Tüm Projeler'];

        const themeColors = {
            'Atık Yönetimi': '#10b981',
            'Bölge Planlama': '#f59e0b',
            'Altyapı Yönetimi': '#ec4899',
            'Otopark Planlama': '#8b5cf6',
            'Tüm Projeler': '#888'
        };
        const color = themeColors[theme] || '#888';

        if (geomType === 'Point') {
            return new Style({
                image: new Icon({
                    src: iconUrl,
                    scale: 0.06,
                    anchor: [0.5, 0.9],
                }),
                text: new Text({
                    text: feature.get('name') || '',
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
    };

    useEffect(() => {
        mapInstance.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                new VectorLayer({
                    source: vectorSource.current,
                    style: styleFunction
                }),
            ],
            view: new View({
                center: fromLonLat([34, 39]),
                zoom: 6
            }),
            controls: defaultControls({
                zoom: false,
                rotate: false,
                attribution: false
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

        const modify = new Modify({ source: vectorSource.current });
        mapInstance.current.addInteraction(modify);
        modify.on('modifyend', async (evt) => {
            for (const f of evt.features.getArray()) {
                const id = f.getId();
                if (!id) continue;
                const wkt = to4326WKT(f);
                try {
                    await updateLocation({ id, wkt });
                } catch (e) {
                    console.error('Güncelleme hatası:', e);
                }
            }
            await loadFeaturesFromAPI();
            onDataUpdated?.();
        });

        const select = new Select();
        mapInstance.current.addInteraction(select);
        select.on('select', (evt) => {
            const ft = evt.selected[0];
            if (!ft) {
                overlayRef.current.setPosition(undefined);
                return;
            }

            const geom = ft.getGeometry();
            const coord = geom.getType() === 'Point'
                ? geom.getCoordinates()
                : geom.getType() === 'Polygon' && geom.getInteriorPoint
                    ? geom.getInteriorPoint().getCoordinates()
                    : geom.getClosestPoint(mapInstance.current.getView().getCenter());

            popupContentRef.current.innerHTML = `
                <strong>ID:</strong> ${ft.getId()}<br/>
                <strong>İsim:</strong> ${ft.get('name')}<br/>
                <button class="del">🗑️ Sil</button>
            `;

            popupContentRef.current.querySelector('.del').onclick = async () => {
                if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
                try {
                    await deleteLocation(ft.getId());
                    vectorSource.current.removeFeature(ft);
                    overlayRef.current.setPosition(undefined);
                } catch (e) {
                    console.error('Silme hatası:', e);
                }
            };

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
    }, []);

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
        if (mapInstance.current) {
            mapInstance.current.getLayers().forEach((layer) => {
                if (layer instanceof VectorLayer) {
                    layer.setStyle(styleFunction);
                }
            });
        }
    }, [selectedFilter]);

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
});

export default SimpleMap;