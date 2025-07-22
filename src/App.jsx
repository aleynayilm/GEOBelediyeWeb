import React, { useState, useRef, useEffect } from 'react';
import SimpleMap from './Components/Map/Map';
import SideBar from './Components/SideBar/SideBar';
import { AnalysisPanel } from "./Components/Panel/Panel";
import SimulationLoadingCard from './Components/Panel/SimulationLoadingCard';
import Navbar from './Components/Navbar/Navbar';
import NameModal from './Components/Navbar/NameModal';
import "../src/Css/AnalysisPanel.css";
import "../src/Css/PanelOverlay.css";
import "../src/Css/PanelLoader.css";

export default function App() {
    const [dataVersion, setDataVersion] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [panelReady, setPanelReady] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [polygonName, setPolygonName] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('Tüm Projeler');
    const [drawingMode, setDrawingMode] = useState(false);

    const mapRef = useRef();

    const handleSavePolygon = async (name) => {
        if (!mapRef.current) {
            console.error('Map referansı bulunamadı');
            return false;
        }

        try {
            const saveSuccess = await mapRef.current.savePolygon(name);
            if (!saveSuccess) {
                console.error('Polygon save failed');
                return false;
            }

            setPolygonName(name);
            return true;
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            return false;
        }
    };

    const handleFilterChange = (filterName) => {
        setSelectedFilter(filterName);
    };

    const handleDrawingModeChange = (mode) => {
        setDrawingMode(mode);
    };

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

    useEffect(() => {
        if (!showPanel) {
            setPanelReady(false);
            return;
        }
        setPanelReady(false);
        const t = setTimeout(() => {
            setPanelReady(true);
        }, 9000);
        return () => clearTimeout(t);
    }, [showPanel]);

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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const openAnalysisPanel = () => {
        setShowPanel(true);
    };

    return (
        <div className="app-map-wrapper">
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                onFilterChange={handleFilterChange}
                onOpenAnalysisPanel={openAnalysisPanel}
                onStartDrawing={() => setDrawingMode(true)}
                onStopDrawing={() => setDrawingMode(false)}
                onSavePolygonWithName={handleSavePolygon}
            />
            <SideBar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>
            <SimpleMap
                ref={mapRef}
                refreshTrigger={dataVersion}
                dataUpdated={dataVersion}
                onOptimizationComplete={(points) => {
                    console.log('Optimizasyon tamamlandı:', points);
                }}
                onDataUpdated={handleDataUpdate}
                selectedFilter={selectedFilter}
                drawingMode={drawingMode}
                onDrawingModeChange={handleDrawingModeChange}
                onSavePolygonWithName={handleSavePolygon}
            />
            <NameModal
                isOpen={isNameModalOpen}
                onClose={() => setIsNameModalOpen(false)}
                onSave={handleSavePolygon}
                onOpenAnalysisPanel={() => {
                    setShowPanel(true);
                    setIsNameModalOpen(false);
                }}
            />
            {showPanel && (
                <div
                    className="ap-backdrop ap-backdrop-show"
                    onClick={closePanel}
                >
                    <div
                        className="ap-backdrop-stop"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!panelReady ? (
                            <SimulationLoadingCard />
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