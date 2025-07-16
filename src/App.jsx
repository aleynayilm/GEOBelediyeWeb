
import Table from './Components/GeometryTable/Table';
import SimpleMap from './Components/Map/Değişikmap';
import React, { useState, useRef } from 'react';

export default function App() {
    const [dataVersion, setDataVersion] = useState(0);
    const mapRef = useRef();
    const handleDataUpdate = () => {
        setDataVersion(prev => prev + 1); // Increment to trigger updates
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            {/* <div style={{ flex: 1 }}>
                <Table mapRef={mapRef} onDataUpdate={handleDataUpdate} dataUpdated={dataVersion} />
            </div> */}
            <div style={{ flex: 2 }}>
                <SimpleMap ref={mapRef} onDataUpdated={handleDataUpdate} dataUpdated={dataVersion} />
            </div>
        </div>
    );
}