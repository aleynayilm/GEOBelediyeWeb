import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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
import {getData as getLocations, addData, updateLocation, deleteLocation} from '../../Api/api';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { geocodeAddress } from "../Geocode";
import { Circle } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon'; // Doğru import yolu

const SimpleMap = forwardRef(({ dataUpdated, onDataUpdated }, ref) => {
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
    const addressInputRef = useRef();
    const showConfirmation = (message) => {
        return new Promise((resolve) => {
            // You can replace this with a proper modal/dialog component
            const shouldProceed = window.confirm(message); // For now, we'll keep using confirm
            resolve(shouldProceed);
        });
    };
    useImperativeHandle(ref, () => ({
        focusOnFeature
    }));

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
            } else if (type === 'Circle') {
                return new Style({
                    image: new CircleStyle({
                        radius: feature.getGeometry().getRadius(),
                        fill: new Fill({ color: 'rgba(0, 0, 255, 0.2)' }),
                        stroke: new Stroke({ color: 'blue', width: 2 })
                    })
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
            // if (!isNaN(extent[0])) {
            //     mapInstance.current.getView().fit(extent, {
            //         padding: [50, 50, 50, 50],
            //         maxZoom: 15
            //     });
            // }

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

            if (undoButtonRef.current) {
                undoButtonRef.current.style.display = type === 'Point' || type === 'Circle' ? 'none' : 'inline-block';
            }

            if (drawRef.current) {
                mapInstance.current.removeInteraction(drawRef.current);
            }

            if (type === 'Circle') {
                const draw = new Draw({
                    source: vectorSource.current,
                    type: 'Point',
                    style: styleFunction
                });

                draw.on('drawend', async (event) => {
                    const pointFeature = event.feature;
                    const center = pointFeature.getGeometry().getCoordinates();
                    const radius = prompt("Daire yarıçapı girin (metre):", "1000");

                    if (!radius) {
                        vectorSource.current.removeFeature(pointFeature);
                        return;
                    }

                    const circle = new Circle(center, Number(radius));
                    const circleFeature = new Feature(circle);
                    circleFeature.setProperties(pointFeature.getProperties());

                    vectorSource.current.removeFeature(pointFeature);
                    vectorSource.current.addFeature(circleFeature);

                    const polygon = fromCircle(circle, 64);
                    const wkt = new WKT().writeGeometry(polygon);

                    const name = prompt("Bu daireye bir isim verin:");
                    if (!name) {
                        vectorSource.current.removeFeature(circleFeature);
                        return;
                    }

                    try {
                        await addData({ name, wkt });
                        await loadFeaturesFromAPI();
                        if (onDataUpdated) onDataUpdated();

                        mapInstance.current.getView().fit(circleFeature.getGeometry().getExtent(), {
                            padding: [50, 50, 50, 50],
                            maxZoom: 18,
                            duration: 1000
                        });

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

                            const iconFeature = new Feature(new Point(center));
                            iconFeature.setStyle(iconStyle);
                            vectorSource.current.addFeature(iconFeature);
                        }
                    } catch (err) {
                        console.error("Kayıt hatası:", err);
                        vectorSource.current.removeFeature(circleFeature);
                    }
                });

                mapInstance.current.addInteraction(draw);
                drawRef.current = draw;
            } else {
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
                        if (onDataUpdated) onDataUpdated();
                        const featureGeom = feature.getGeometry();
                        const extent = featureGeom.getExtent();
                        mapInstance.current.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 18,
                            duration: 1000
                        });
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
                        console.error("Kayıt hatası:", err);
                        draw.abortDrawing();
                        setTimeout(() => vectorSource.current.removeFeature(feature), 0);
                    }
                });

                mapInstance.current.addInteraction(draw);
                drawRef.current = draw;
            }
        };

        addInteraction();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && drawRef.current) {
                drawRef.current.abortDrawing();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        typeSelectRef.current.onchange = () => {
            if (drawRef.current) mapInstance.current.removeInteraction(drawRef.current);
            addInteraction();
        };

        undoButtonRef.current.addEventListener('click', () => {
            if (drawRef.current) drawRef.current.removeLastPoint();
        });

        const modify = new Modify({ source: vectorSource.current });
        mapInstance.current.addInteraction(modify);
        modify.on('modifyend', async (e) => {
            const features = e.features.getArray();

            for (let feature of features) {
                const id = feature.getId();
                if (!id) continue;

                let wkt;
                if (feature.getGeometry().getType() === 'Circle') {
                    const polygon = fromCircle(feature.getGeometry(), 64);
                    wkt = new WKT().writeGeometry(polygon);
                } else {
                    wkt = new WKT().writeFeature(feature);
                }

                try {
                    await updateLocation({ id, wkt });
                    console.log(`ID ${id} başarıyla güncellendi.`);
                    if (onDataUpdated) onDataUpdated();
                } catch (err) {
                    console.error(`ID ${id} güncellenemedi:`, err);
                }
            }

            await loadFeaturesFromAPI();
        });

        const select = new Select();
        mapInstance.current.addInteraction(select);
        select.on('select', (e) => {
            const feature = e.selected[0];
            if (feature) {
                const geometry = feature.getGeometry();
                const coordinates = geometry.getType() === 'Circle' ?
                    geometry.getCenter() : geometry.getFirstCoordinate();
                const id = feature.getId();
                const name = feature.get('name');
                const wkt = geometry.getType() === 'Circle' ?
                    new WKT().writeGeometry(fromCircle(geometry, 64)) :
                    new WKT().writeFeature(feature);

                let extraInfo = '';
                if (geometry.getType() === 'LineString') {
                    const length = geometry.getLength();
                    extraInfo = `<br/><strong>Uzunluk:</strong> ${length.toFixed(2)} m`;
                } else if (geometry.getType() === 'Polygon') {
                    const area = geometry.getArea();
                    extraInfo = `<br/><strong>Alan:</strong> ${(area / 1e6).toFixed(4)} km²`;
                } else if (geometry.getType() === 'Circle') {
                    const area = Math.PI * Math.pow(geometry.getRadius(), 2);
                    extraInfo = `<br/><strong>Yarıçap:</strong> ${geometry.getRadius().toFixed(2)} m<br/>
                         <strong>Alan:</strong> ${(area / 1e6).toFixed(4)} km²`;
                }

                popupContentRef.current.innerHTML = `
            <strong>ID:</strong> ${id}<br/>
            <strong>Name:</strong> ${name}<br/>
            <strong>WKT:</strong><br/><small>${wkt}</small>
            ${extraInfo}
            <div class="popup-buttons">
                <button class="popup-edit-btn">✏️ Düzenle</button>
                <button class="popup-delete-btn">🗑️ Sil</button>
            </div>
        `;

                // Add event listeners to the buttons
                const editBtn = popupContentRef.current.querySelector('.popup-edit-btn');
                const deleteBtn = popupContentRef.current.querySelector('.popup-delete-btn');

                editBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newName = prompt("Yeni ismi girin:", name);
                    if (newName && newName !== name) {
                        try {
                            // DÜZELTME: API'nin beklediği formatı kullanıyoruz
                            await updateLocation(id, {
                                id: id,
                                name: newName,
                                wkt: wkt  // WKT'yi de gönderiyoruz
                            });

                            feature.set('name', newName);
                            vectorSource.current.changed(); // Haritayı güncelle

                            // Popup içeriğini yenile
                            const currentPosition = overlayRef.current.getPosition();
                            overlayRef.current.setPosition(undefined);
                            setTimeout(() => overlayRef.current.setPosition(currentPosition), 100);

                            if (onDataUpdated) onDataUpdated();
                        } catch (err) {
                            console.error('Güncelleme hatası:', err);
                            alert(`Güncelleme başarısız oldu: ${err.message}`);
                        }
                    }
                });

                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    // eslint-disable-next-line no-restricted-globals
                    if (confirm(`"${name}" adlı öğeyi silmek istediğinize emin misiniz?`)) {
                        try {
                            await deleteLocation(id);
                            vectorSource.current.removeFeature(feature);
                            overlayRef.current.setPosition(undefined);
                            if (onDataUpdated) onDataUpdated();
                        } catch (err) {
                            console.error('Silme hatası:', err);
                            alert('Silme başarısız oldu');
                        }
                    }
                });

                overlayRef.current.setPosition(coordinates);
            } else {
                overlayRef.current.setPosition(undefined);
            }
        });

        loadFeaturesFromAPI();

        return () => {
            mapInstance.current.setTarget(undefined);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dataUpdated]);

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
            setTimeout(animate, 800);
        };

        animate();
    }, []);

    const focusOnFeature = (id) => {
        const feature = vectorSource.current.getFeatureById(id);
        if (!feature) return;

        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();

        mapInstance.current.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 17,
            duration: 1000
        });

        const wkt = geometry.getType() === 'Circle' ?
            new WKT().writeGeometry(fromCircle(geometry, 64)) :
            new WKT().writeFeature(feature);
        const name = feature.get('name');
        const coordinates = geometry.getType() === 'Circle' ?
            geometry.getCenter() : geometry.getFirstCoordinate();

        let extraInfo = '';
        if (geometry.getType() === 'LineString') {
            const length = geometry.getLength();
            extraInfo = `<br/><strong>Uzunluk:</strong> ${length.toFixed(2)} m`;
        } else if (geometry.getType() === 'Polygon') {
            const area = geometry.getArea();
            extraInfo = `<br/><strong>Alan:</strong> ${(area / 1e6).toFixed(4)} km²`;
        } else if (geometry.getType() === 'Circle') {
            const area = Math.PI * Math.pow(geometry.getRadius(), 2);
            extraInfo = `<br/><strong>Yarıçap:</strong> ${geometry.getRadius().toFixed(2)} m<br/>
                     <strong>Alan:</strong> ${(area / 1e6).toFixed(4)} km²`;
        }

        popupContentRef.current.innerHTML = `
        <strong>ID:</strong> ${id}<br/>
        <strong>Name:</strong> ${name}<br/>
        <strong>WKT:</strong><br/><small>${wkt}</small>
        ${extraInfo}
        <div class="popup-buttons">
            <button class="popup-edit-btn">✏️ Düzenle</button>
            <button class="popup-delete-btn">🗑️ Sil</button>
        </div>
    `;

        // Add event listeners to the buttons
        const editBtn = popupContentRef.current.querySelector('.popup-edit-btn');
        const deleteBtn = popupContentRef.current.querySelector('.popup-delete-btn');

        editBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newName = prompt("Yeni ismi girin:", name);
            if (newName && newName !== name) {
                try {
                    await updateLocation({ id, name: newName, wkt });
                    feature.set('name', newName);
                    if (onDataUpdated) onDataUpdated();
                } catch (err) {
                    console.error('Güncelleme hatası:', err);
                    alert('Güncelleme başarısız oldu');
                }
            }
        });

        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const shouldDelete = await showConfirmation(`"${name}" adlı öğeyi silmek istediğinize emin misiniz?`);
            if (shouldDelete) {
                try {
                    await deleteLocation(id);
                    vectorSource.current.removeFeature(feature);
                    overlayRef.current.setPosition(undefined);
                    if (onDataUpdated) onDataUpdated();
                } catch (err) {
                    console.error('Silme hatası:', err);
                    alert('Silme başarısız oldu');
                }
            }
        });

        overlayRef.current.setPosition(coordinates);
    };

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <div className="draw-controls">
                <div className="draw-controls">
                    <input
                        type="text"
                        ref={addressInputRef}
                        placeholder="Adres girin (örn. Başarsoft Ankara)"
                        className="custom-address-input"
                        style={{
                            padding: '6px 12px',
                            fontSize: '14px',
                            margin: '0 5px',
                            borderRadius: '6px',
                            border: '1px solid #ccc',
                            width: '250px'
                        }}
                    />
                    <button
                        onClick={async () => {
                            const address = addressInputRef.current.value;
                            if (!address) return;

                            const result = await geocodeAddress(address);
                            if (!result) {
                                alert('Adres bulunamadı');
                                return;
                            }

                            const wkt = `POINT(${result.lon} ${result.lat})`;
                            const feature = new WKT().readFeature(wkt, {
                                dataProjection: 'EPSG:4326',
                                featureProjection: 'EPSG:3857'
                            });

                            try {
                                await addData({ name: address, wkt });
                                vectorSource.current.addFeature(feature);

                                const featureGeom = feature.getGeometry();
                                const extent = featureGeom.getExtent();
                                mapInstance.current.getView().fit(extent, {
                                    padding: [50, 50, 50, 50],
                                    maxZoom: 18,
                                    duration: 1000
                                });

                                addressInputRef.current.value = '';
                                if (onDataUpdated) onDataUpdated();
                            } catch (err) {
                                console.error('Adres kaydedilemedi:', err);
                                alert('Kaydedilirken hata oluştu');
                            }
                        }}
                        className="custom-button"
                        style={{ padding: '6px 12px', fontSize: '14px', marginRight: '10px' }}
                    >
                        📍 Ekle
                    </button>
                </div>
                <select ref={typeSelectRef} defaultValue="Point" className="custom-select">
                    <option value="None">Seçim Yap</option>
                    <option value="Point">Nokta</option>
                    <option value="LineString">Çizgi</option>
                    <option value="Polygon">Alan</option>
                    <option value="Circle">Daire</option>
                </select>

                <button
                    ref={undoButtonRef}
                    className="custom-button"
                    style={{ display: typeSelectRef.current?.value === 'Point' || typeSelectRef.current?.value === 'Circle' ? 'none' : 'inline-block' }}
                >
                    ⟲ Geri Al
                </button>
            </div>
            <div ref={mapRef} style={{ width: '100%', height: '90vh' }}></div>
            <div ref={popupContainerRef} className="ol-popup">
                <div ref={popupContentRef}></div>
            </div>
        </div>
    );
});

export default SimpleMap;