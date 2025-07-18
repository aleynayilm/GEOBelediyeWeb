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
import { getData as getLocations, addData, updateLocation, deleteLocation } from '../../Api/api';
import { fromCircle } from 'ol/geom/Polygon';
import { defaults as defaultControls } from 'ol/control';

/**
 * SimpleMap (refactored)
 * ---------------------------------------------------------------
 * → Sadece POLYGON ve POINT geometry tiplerini destekler.
 * → Harita EPSG:3857 (WebMercator) projeksiyonunda çalışır,
 *   however back‑end'e gönderilen/geçici olarak gösterilen WKT değerleri EPSG:4326
 *   (coğrafi koordinatlar) formatında üretilir.
 * → Backend'den gelen veriler hangi projeksiyonda olursa olsun (4326 veya 3857)
 *   otomatik olarak algılanır ve dönüştürülür.
 * ---------------------------------------------------------------
 */

const SimpleMap = forwardRef(({ dataUpdated, onDataUpdated }, ref) => {
    /* -------------------------- refs & singletons -------------------------- */
    const mapRef = useRef();
    const typeSelectRef = useRef();
    const vectorSource = useRef(new VectorSource());
    const mapInstance = useRef(null);
    const drawRef = useRef(null);
    const overlayRef = useRef();
    const popupContainerRef = useRef();
    const popupContentRef = useRef();

    /* ------------------------------ utilities ------------------------------ */
    const isLikelyEPSG3857 = (wktString) => {
        // Basit: lon/lat değerleri 180′i aşarsa 3857 olduğuna karar veriyoruz
        const match = wktString.match(/[-]?\d+(?:\.\d+)?/);
        return match && parseFloat(match[0]) > 180;
    };

    const to4326WKT = (feature) => {
        // Çember desteklenmediği için doğrudan geometry/feature yazabiliyoruz
        return new WKT().writeFeature(feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });
    };

    /* ----------------------------- map loader ------------------------------ */
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
                // SADECE Point veya Polygon ise ekle
                if (geomType === 'Point' || geomType === 'Polygon') {
                    feature.setId(item.id);
                    feature.set('name', item.name);
                    vectorSource.current.addFeature(feature);
                }
            });

            // Özellikler varsa zoom‑fit
            const extent = vectorSource.current.getExtent();
            if (!isNaN(extent[0])) {
                mapInstance.current.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    maxZoom: 15,
                });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Veri yüklenirken hata:', err);
        }
    };

    /* --------------------------- init / teardown --------------------------- */
    useEffect(() => {
        /* ---------------------------- map object ---------------------------- */
        mapInstance.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                new VectorLayer({ source: vectorSource.current, style: styleFunction }),
            ],
            view: new View({ center: fromLonLat([34, 39]), zoom: 6 }),
            controls: defaultControls({ zoom: false, rotate: false, attribution: false }),
        });

        /* ----------------------------- overlay ----------------------------- */
        overlayRef.current = new Overlay({
            element: popupContainerRef.current,
            autoPan: true,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -10],
        });
        mapInstance.current.addOverlay(overlayRef.current);

        /* -------------------------- draw interaction -------------------------- */
        const addDrawInteraction = () => {
            if (drawRef.current) mapInstance.current.removeInteraction(drawRef.current);

            const drawType = typeSelectRef.current.value;
            if (drawType === 'None') return;

            const draw = new Draw({ source: vectorSource.current, type: drawType });
            draw.on('drawend', async (evt) => {
                const f = evt.feature;
                // Geometri EPSG:4326 WKT'e dönüştürülerek backend'e gönderilecek
                const wkt = to4326WKT(f);
                const name = prompt('Bu objeye isim verin:');
                if (!name) {
                    // Kullanıcı vazgeçti -> feature kaldır
                    setTimeout(() => vectorSource.current.removeFeature(f), 0);
                    return;
                }
                try {
                    await addData({ name, wkt });
                    await loadFeaturesFromAPI();
                    onDataUpdated?.();
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Kaydetme hatası:', e);
                    setTimeout(() => vectorSource.current.removeFeature(f), 0);
                }
            });

            mapInstance.current.addInteraction(draw);
            drawRef.current = draw;
        };

        /* dropdown değişince yeni interaction ekle */
        typeSelectRef.current.onchange = addDrawInteraction;
        addDrawInteraction();

        /* ------------------------ modify interaction ------------------------ */
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
                    // eslint-disable-next-line no-console
                    console.error('Güncelleme hatası:', e);
                }
            }
            await loadFeaturesFromAPI();
            onDataUpdated?.();
        });

        /* -------------------------- select interaction ------------------------- */
        const select = new Select();
        mapInstance.current.addInteraction(select);
        select.on('select', (evt) => {
            const ft = evt.selected[0];
            if (!ft) {
                overlayRef.current.setPosition(undefined);
                return;
            }

            const geom = ft.getGeometry();
            const coord =
                geom.getType() === 'Point'
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
                    // eslint-disable-next-line no-console
                    console.error('Silme hatası:', e);
                }
            };

            overlayRef.current.setPosition(coord);
        });

        /* ----------------------------- key‑handler ----------------------------- */
        const keyHandler = (e) => {
            if (e.key === 'Escape' && drawRef.current) drawRef.current.abortDrawing();
        };
        document.addEventListener('keydown', keyHandler);

        /* ------------------------------ bootstrap ------------------------------ */
        loadFeaturesFromAPI();

        /* ----------------------------- cleanup ----------------------------- */
        return () => {
            mapInstance.current.setTarget(undefined);
            document.removeEventListener('keydown', keyHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataUpdated]);

    /* --------------------------- style function --------------------------- */
    const styleFunction = (feature) => {
        const geomType = feature.getGeometry().getType();
        const base = new Style({
            image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff0' }), stroke: new Stroke({ color: '#000', width: 2 }) }),
            stroke: new Stroke({ color: '#f00', width: 2 }),
            fill: new Fill({ color: 'rgba(255,0,0,0.1)' }),
        });

        // Yazı ID → noktaların üstünde & poligonların içinde gösterilsin
        base.setText(
            new Text({
                text: String(feature.getId() ?? ''),
                font: 'bold 12px Arial',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({ color: '#fff', width: 2 }),
                offsetY: -15,
            }),
        );

        if (geomType === 'Point') return base;
        if (geomType === 'Polygon') return base;
        return null; // Diğer tipleri göstermiyoruz
    };

    /* -------------------------------- render -------------------------------- */
    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <div className="draw-controls" style={{ position: 'absolute', zIndex: 10, margin: '10px' }}>
                <select ref={typeSelectRef} defaultValue="Polygon" className="custom-select">
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
