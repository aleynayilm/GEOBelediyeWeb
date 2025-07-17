// App.jsx
import React, { useState, useRef, useEffect } from 'react';
import Table from './Components/GeometryTable/Table';
import SimpleMap from './Components/Map/MapWithoutDrawing';
import { AnalysisPanel } from "./Components/Panel/Panel";
import "../src/Css/AnalysisPanel.css";
import "../src/Css/PanelOverlay.css";
import "../src/Css/PanelLoader.css";   // yeni loader css
import "./Css/PanelLoader.css";


export default function App() {
    const [dataVersion, setDataVersion] = useState(0);
    const [showPanel, setShowPanel] = useState(false);   // açılışta kapalı
    const [panelReady, setPanelReady] = useState(false); // loader -> panel
    const [panelVisible, setPanelVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const mapRef = useRef();

    /* ESC ile kapat */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowPanel(false);
                setPanelReady(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* Panel açıldığında loader 3 sn */
    useEffect(() => {
        if (!showPanel) {
            setPanelReady(false);
            return;
        }
        setPanelReady(false);
        const t = setTimeout(() => {
            setPanelReady(true);
        }, 1500); // 3 saniye
        return () => clearTimeout(t);
    }, [showPanel,panelVisible]);

    const handleDataUpdate = () => setDataVersion((p) => p + 1);

    const points = [
        { id: 1, name: "Nokta 1", lat: 40.9876, lon: 29.1234, waterLt: 2200, mahalle: "Merkez" },
        { id: 2, name: "Nokta 2", lat: 41.0011, lon: 29.1456, waterLt: 1800, mahalle: "Çınar" },
        { id: 3, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
    ];

    const handleMap = () => console.log("Haritayı Görüntüle tıklandı");
    const handleEditItems = () => console.log("İtemleri Düzenle tıklandı");
    const handleEditMinCap = () => console.log("Minimum kapak sayısını düzenle tıklandı");
    const handleSave = (pts) => console.log("Kaydet", pts);

    const closePanel = () => {
        setShowPanel(false);
        setPanelReady(false);
    };

    return (
        <div className="app-map-wrapper">
            <SimpleMap
                ref={mapRef}
                refreshTrigger={dataVersion}
                dataUpdated={dataVersion}
                onDataUpdated={handleDataUpdate}
            />

            {/* Panel Açma Tuşu */}
            {!showPanel && (
                <button
                    type="button"
                    className="ap-open-trigger"
                    onClick={() => setShowPanel(true)}
                >
                    Analiz Sonuçları
                </button>
            )}

            {/* Overlay */}
            {showPanel && (
                <div
                    className="ap-backdrop ap-backdrop-show"
                    onClick={closePanel}      // backdrop'ta kapat
                >
                    <div
                        className="ap-backdrop-stop"
                        onClick={(e) => e.stopPropagation()}  // panel içi tık backdrop'a geçmesin
                    >
                        {!panelReady ? (
                            <PanelLoadingCard />   // 3s loader
                        ) : (
                            <AnalysisPanel
                                minCoverCount={16}
                                capacityLtPerMin={1600}
                                points={points}
                                onMapClick={handleMap}
                                onEditClick={handleEditItems}
                                onEditMinCap={handleEditMinCap}
                                onSave={handleSave}
                                className="ap-tall ap-showy"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* -------------------------
 * PanelLoadingCard
 * Panel boyutlu beyaz kart + Uiverse loader
 * ------------------------- */
function PanelLoadingCard() {
    return (
        <div className="ap-root ap-loading-card ap-enter ap-entered">
            <div className="ap-loading-center">
                <div className="loader" role="status" aria-label="Yükleniyor">
                    <div className="snow">
                        <span style={{ animationDuration: `${15 / 11}s` }} />
                        <span style={{ animationDuration: `${15 / 12}s` }} />
                        <span style={{ animationDuration: `${15 / 15}s` }} />
                        <span style={{ animationDuration: `${15 / 17}s` }} />
                        <span style={{ animationDuration: `${15 / 18}s` }} />
                        <span style={{ animationDuration: `${15 / 13}s` }} />
                        <span style={{ animationDuration: `${15 / 14}s` }} />
                        <span style={{ animationDuration: `${15 / 19}s` }} />
                        <span style={{ animationDuration: `${15 / 20}s` }} />
                        <span style={{ animationDuration: `${15 / 10}s` }} />
                        <span style={{ animationDuration: `${15 / 18}s` }} />
                        <span style={{ animationDuration: `${15 / 13}s` }} />
                        <span style={{ animationDuration: `${15 / 14}s` }} />
                        <span style={{ animationDuration: `${15 / 19}s` }} />
                        <span style={{ animationDuration: `${15 / 20}s` }} />
                        <span style={{ animationDuration: `${15 / 10}s` }} />
                        <span style={{ animationDuration: `${15 / 18}s` }} />
                        <span style={{ animationDuration: `${15 / 13}s` }} />
                        <span style={{ animationDuration: `${15 / 14}s` }} />
                        <span style={{ animationDuration: `${15 / 19}s` }} />
                        <span style={{ animationDuration: `${15 / 20}s` }} />
                        <span style={{ animationDuration: `${15 / 10}s` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}



/* Uiverse loader markup: kapsül + kar taneleri */
function UniverseSnowLoader() {
    // 20 adet parçacık; hız farklılığı için --i 5..24 arası
    const flakes = Array.from({ length: 20 }).map((_, i) => {
        const speed = 5 + i; // 5 ile 24 arası
        return <span key={i} style={{ "--i": speed }} />;
    });

    return (
        <div className="loader" role="status" aria-label="Yükleniyor">
            <div className="snow">
                {flakes}
            </div>
        </div>
    );
}
