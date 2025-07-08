import React, { useState } from 'react';
import Table from './Components/GeometryTable/Table';
import SimpleMap from './Components/Map/Map';

export default function App() {
    const [refreshMap, setRefreshMap] = useState(0);

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ flex: 1 }}>
                <Table onDataChanged={() => setRefreshMap(prev => prev + 1)} />
            </div>
            <div style={{ flex: 2 }}>
                <SimpleMap refreshTrigger={refreshMap} />
            </div>
        </div>
    );
}
