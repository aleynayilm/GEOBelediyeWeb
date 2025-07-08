import React from 'react';
import SimpleMap from './Components/Map/Map';
import Table from "./Components/GeometryTable/Table";

function App() {
    return (
        <div className="page-container">
            {/* Harita Bölümü */}
            <div className="map-section">
                <h1 style={{textAlign: 'center'}} className="section-title ">OpenLayers Haritası</h1>
                <div className="map-wrapper">
                    <div

                        className="map-container"
                        style={{
                            width: '100%',
                            height: '500px', // Harita yüksekliği
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <SimpleMap/>
                    </div>
                </div>
            </div>

            {/* Tablo Bölümü */}
            <div className="table-section">
                <h1 style={{textAlign: 'center'}} className="section-title">Veri Tablosu</h1>
                <div className="table-wrapper">
                    <Table/>
                </div>
            </div>
        </div>
    );
}

export default App;