// App.jsx
import React, { useState, useRef, useEffect } from 'react';
import Table from './Components/GeometryTable/Table';
import SimpleMap from './Components/Map/MapWithoutDrawing';
import { AnalysisPanel } from "../src/Components/Panel/Panel";
import SideBar from './Components/SideBar/SideBar';
import "../src/Css/AnalysisPanel.css";
import "../src/Css/PanelOverlay.css";

export default function App() {
    const [dataVersion, setDataVersion] = useState(0);
    const [showPanel, setShowPanel] = useState(false); // açılışta kapalı
    const mapRef = useRef();

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setShowPanel(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleDataUpdate = () => {
        setDataVersion((prev) => prev + 1);
    };

    const points = [
        { id: 1, name: "Nokta 1", lat: 40.9876, lon: 29.1234, waterLt: 2200, mahalle: "Merkez" },
        { id: 2, name: "Nokta 2", lat: 41.0011, lon: 29.1456, waterLt: 1800, mahalle: "Çınar" },
        { id: 3, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 3, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 4, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 5, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 6, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 7, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 8, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 9, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
        { id: 10, name: "Nokta 3", lat: 40.9823, lon: 29.1307, waterLt: 2500, mahalle: "Dernek" },
    ];

    const handleMap = () => {
        console.log("Haritayı Görüntüle tıklandı");
        // Paneli kapatmak istersen:
        // setShowPanel(false);
    };

    const handleEditItems = () => {
        console.log("İtemleri Düzenle tıklandı");
    };

    const handleEditMinCap = () => {
        console.log("Minimum kapak sayısını düzenle tıklandı");
    };

    const handleSave = (pts) => {
        console.log("Kaydet", pts);
    };

    return (
        <div className="app-map-wrapper">
            <SideBar />
            <SimpleMap
                ref={mapRef}
                refreshTrigger={dataVersion}
                dataUpdated={dataVersion}
                onDataUpdated={handleDataUpdate}
            />

            {/* Panel Açma Düğmesi */}
            {!showPanel && (
                <button
                    type="button"
                    className="ap-open-trigger"
                    onClick={() => setShowPanel(true)}
                >
                    Analiz Sonuçları
                </button>
            )}

            {/* Panel Overlay */}
            {showPanel && (
                <div
                    className="ap-backdrop ap-backdrop-show"
                    onClick={() => { /* backdrop click kapatmak için aç: setShowPanel(false); */ }}
                >
                    <div
                        className="ap-backdrop-stop"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                    </div>
                </div>
            )}
        </div>
    );
}
