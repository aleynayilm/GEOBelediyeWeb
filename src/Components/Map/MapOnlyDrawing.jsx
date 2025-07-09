import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import { fromLonLat } from 'ol/proj';
import WKT from 'ol/format/WKT';
import { getData as getLocations } from '../../Api/api';

export default function SimpleMap() {
    const mapRef = useRef();
    const typeSelectRef = useRef();
    const undoButtonRef = useRef();
    const vectorSource = useRef(new VectorSource());
    const mapInstance = useRef(null);
    const drawRef = useRef(null);

    // Haritayı başlat
    useEffect(() => {
        //Map nesnesini oluşturur
        mapInstance.current = new Map({
            //Haritayı çiziceğimiz divi belirtiyor
            target: mapRef.current,
            //Katmanları belirtiyoruz.
            layers: [
                //Openstreet map katmanı
                new TileLayer({ source: new OSM() }),
                //Üstüne çizeceğimiz şekiller katmanı
                new VectorLayer({ source: vectorSource.current })
            ],
            //Haritanın başlangıç görünümünü ayarlıyoruz
            view: new View({
                //Türkiyeden başlatıyorum
                center: fromLonLat([34, 39]),
                //zoom seviyesi
                zoom: 6
            })
        });

        // Çizim interaction'ını ekleyen fonksiyon
        const addInteraction = () => {
            //<select> elementinde seçili olan değeri alır.
            const type = typeSelectRef.current.value;
            //Seçilen tipi yazdırıyoruz
            console.log('Seçilen tip:', type);
            //Checking
            if (type === 'None') return;
            //Çizim özelliğini tanımlıyoruz
            const draw = new Draw({
                //Çizilen şeyi tutuyor
                source: vectorSource.current,
                //Çizim tipini tutuyoruz
                type: type,
            });
            //Çizim bitince çalışıyor
            draw.on('drawend', (event) => {
                //Feature çizdiğimiz şekil
                const feature = event.feature;
                //wkt formatına çeviriyor hazır kütüphane ol kütüphanesi
                const wktFormat = new WKT();
                const wkt = wktFormat.writeFeature(feature);
                //Consola bastırıyoruz test için
                console.log('Çizilen objenin WKT:', wkt);
            });
            //Oluşturduğumuz şekili haritaya ekliyoruz
            mapInstance.current.addInteraction(draw);
            //Ref ile kayıt ediyoruz daha sonra silebilmek için
            drawRef.current = draw;
        };

        // İlk interaction'ı ekle
        addInteraction();

        // Çizim türü değiştiğinde interaction'ı güncelle
        //Çizim türünü değiştirdiğinde bu fonksiyon çalışıyor
        typeSelectRef.current.onchange = () => {
            //Varsa önceki interactionı kaldırıyoruz ki çakışma olmasın
            if (drawRef.current) {
                mapInstance.current.removeInteraction(drawRef.current);
            }
            //Yeni interactionu ekliyoruz daha doğrusu başlatıyoruz
            addInteraction();
        };

        // Undo butonu
        //Undo butonuna basıldığında bu fonksiyon çalışacak
        undoButtonRef.current.addEventListener('click', () => {
            //Seçili işlemi geri alıyor kaldırıyor
            if (drawRef.current) {
                drawRef.current.removeLastPoint();
            }
        });
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
        return () => {
            //Haritayı düzgün bir şekilde kapatmak için yöntem.
            // Başka sayfaya geçildiğindde DOM bağlantısını kesiyoruz temizliyoruz
            mapInstance.current.setTarget(undefined);
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <div>
                <select ref={typeSelectRef} defaultValue="Point">
                    <option value="None">None</option>
                    <option value="Point">Point</option>
                    <option value="LineString">LineString</option>
                    <option value="Polygon">Polygon</option>
                </select>
                <button ref={undoButtonRef}>Undo</button>
            </div>
            <div ref={mapRef} style={{ width: '100%', height: '90vh' }}></div>
        </div>
    );
}
