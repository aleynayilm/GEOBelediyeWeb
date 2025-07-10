import React, { useState } from 'react';
import Table from './Components/GeometryTable/Table';
import SimpleMap from './Components/Map/Map';

export default function App() {
    const [dataVersion, setDataVersion] = useState(0);

    const handleDataUpdate = () => {
        setDataVersion(prev => prev + 1); // Increment to trigger updates
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ flex: 1 }}>
                <Table onDataUpdate={handleDataUpdate} dataUpdated={dataVersion} />
            </div>
            <div style={{ flex: 2 }}>
                <SimpleMap onDataUpdated={handleDataUpdate} dataUpdated={dataVersion} />
            </div>
        </div>
    );
}