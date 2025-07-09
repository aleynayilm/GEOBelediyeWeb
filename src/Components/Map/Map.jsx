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
import { getData as getLocations, addData } from '../../Api/api';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

export default function SimpleMap() {
    const mapRef = useRef();
    const typeSelectRef = useRef();
    const undoButtonRef = useRef();
    const vectorSource = useRef(new VectorSource());
    const mapInstance = useRef(null);
    const drawRef = useRef(null);

    const styleFunction = (feature) => {
        const type = feature.getGeometry().getType();
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
                stroke: new Stroke({ color: ' Red', width: 3 })
            });
        } else if (type === 'Polygon') {
            return new Style({
                stroke: new Stroke({ color: 'red', width: 2 }),
                fill: new Fill({ color: 'rgba(255, 0, 0, 0.1)' })
            });
        }
    };

    // WKT'nin hangi koordinat sisteminde olduğunu tahmin eden fonksiyon
    const isLikelyEPSG3857 = (wktString) => {
        // WKT içindeki ilk sayı çok büyükse (örneğin 180°'den büyük), bu EPSG:3857 olabilir
        const match = wktString.match(/[-]?\d+(\.\d+)?/);
        return match && parseFloat(match[0]) > 180;
    };

    // DB'den çizimleri çeker
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
                    // Koordinat sistemine göre uygun projection seçimi
                    const projection = isLikelyEPSG3857(item.wkt) ? 'EPSG:3857' : 'EPSG:4326';

                    // WKT'yi Feature objesine çeviriyoruz
                    const feature = format.readFeature(item.wkt, {
                        dataProjection: projection,
                        featureProjection: 'EPSG:3857' // Harita zaten EPSG:3857'de
                    });

                    // ID ve isim gibi özellikleri set edelim
                    feature.setId(item.id);
                    feature.setProperties({ name: item.name });

                    // Haritaya ekle
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
                new VectorLayer({ source: vectorSource.current, style: styleFunction })
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
            draw.on('drawend', async (event) => {
                //Feature çizdiğimiz şekil
                const feature = event.feature;
                //wkt formatına çeviriyor hazır kütüphane ol kütüphanesi
                const wktFormat = new WKT();
                const wkt = wktFormat.writeFeature(feature);
                //Consola bastırıyoruz test için
                console.log('Çizilen objenin WKT:', wkt);

                // Kullanıcıdan isim al
                const name = prompt("Bu objeye bir isim verin:");
                if (!name) {
                    alert("İsim verilmediği için obje siliniyor.");

                    // ✨ Çözüm: önce çizimi iptal et, sonra feature'ı sil
                    draw.abortDrawing(); // çizim sürecini iptal et
                    setTimeout(() => {
                        vectorSource.current.removeFeature(feature); // haritadan temizle
                    }, 0);

                    return;
                }

                // DB'ye gönder
                try {
                    await addData({ name, wkt });
                    alert("Veri kaydedildi.");
                    await loadFeaturesFromAPI(); // Yeniden yükle
                } catch (err) {
                    console.error("Kayıt hatası:", err);
                    alert("Veri kaydedilemedi.");

                    // ✨ Kayıt başarısızsa da aynı şekilde temizle
                    draw.abortDrawing();
                    setTimeout(() => {
                        vectorSource.current.removeFeature(feature);
                    }, 0);
                }
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

        // Sayfa yüklendiğinde verileri getir
        loadFeaturesFromAPI();

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
