import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { GoogleMap, DrawingManager } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

const containerStyle = { width: '100%', height: '300px' };
const defaultPos = { lat: 12.9716, lng: 77.5946 };


function ZoneCreatorPage() {
    const { isLoaded, setZones } = useContext(AppContext);
    const [zoneName, setZoneName] = useState('');
    const [newZoneCoordinates, setNewZoneCoordinates] = useState(null);
    const [currentPolygon, setCurrentPolygon] = useState(null);
    const [localStatus, setLocalStatus] = useState({ message: 'Use the drawing tool to outline the zone.', isError: false });
    const navigate = useNavigate();
    const [maxDistance, setMaxDistance] = useState('');
const [flatRate, setFlatRate] = useState('');

    const drawingLibReady = typeof window !== 'undefined' && !!window.google?.maps?.drawing;

    const drawingOptions = useMemo(() => {
        if (!drawingLibReady) return null;
        return {
            drawingControl: true,
            drawingControlOptions: {
                position: window.google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: { 
                fillColor: '#4caf50', fillOpacity: 0.2, 
                strokeWeight: 2, strokeColor: '#4caf50', editable: true 
            },
        };
    }, [drawingLibReady]);
    
    const onPolygonComplete = (polygon) => {
        if (!drawingLibReady) return;

        if (currentPolygon) currentPolygon.setMap(null);
        setCurrentPolygon(polygon);
        
        const coords = [];
        polygon.getPath().getArray().forEach(vertex => {
            coords.push({ lat: vertex.lat(), lng: vertex.lng() });
        });
        
        setNewZoneCoordinates(coords);
        setLocalStatus({ message: 'Polygon drawn. Enter a name and click save.', isError: false });
        
        // Disable drawing mode immediately
        if (polygon.getMap()) {
            const drawingManager = polygon.getMap().__SECRET_ACCESS_drawingManager;
            if (drawingManager && drawingManager.setDrawingMode) drawingManager.setDrawingMode(null);
        }
    };
    
    // Helper to calculate the center of a polygon
const calculateCenter = (coords) => {
    if (!coords || coords.length === 0) return defaultPos;
    const latSum = coords.reduce((sum, coord) => sum + coord.lat, 0);
    const lngSum = coords.reduce((sum, coord) => sum + coord.lng, 0);
    return {
        lat: latSum / coords.length,
        lng: lngSum / coords.length
    };
};

    const handleSaveZone = async () => {
        if (!zoneName.trim()) {
            setLocalStatus({ message: 'Error: Toll zone name cannot be empty.', isError: true });
            return;
        }
        if (!newZoneCoordinates || newZoneCoordinates.length < 3 || !currentPolygon) {
            setLocalStatus({ message: 'Error: Please draw a valid polygon.', isError: true });
            return;
        }
        if (!drawingLibReady) {
            setLocalStatus({ message: 'Maps library not ready yet. Please wait a moment and try again.', isError: true });
            return;
        }
        const payload = {
        name: zoneName.trim(),
        coordinates: newZoneCoordinates,
        center: calculateCenter(newZoneCoordinates),
        max_distance: parseFloat(maxDistance) || 5000, // Fallback to 5km
        flat_rate: parseFloat(flatRate) || 150        // Fallback to ₹150
    };
        setLocalStatus({ message: 'Saving zone...', isError: false });

        // Calculate center for Geohash generation on the backend
        const bounds = new window.google.maps.LatLngBounds();
        newZoneCoordinates.forEach(coord => {
            bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
        const center = bounds.getCenter().toJSON();
        
        try {
            const response = await fetch('http://localhost:5000/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: zoneName, coordinates: newZoneCoordinates, center }),
            });
            const data = await response.json();
            
            if (data.success) {
                setLocalStatus({ message: data.message, isError: false });
                setZoneName('');
                setNewZoneCoordinates(null);
                currentPolygon.setMap(null);
                setCurrentPolygon(null);
                
                // Trigger a full zone reload in App.jsx
                const zonesResponse = await fetch('http://localhost:5000/api/zones');
                const zonesData = await zonesResponse.json();
                if (zonesData.success) setZones(zonesData.zones);

            } else {
                setLocalStatus({ message: data.message, isError: true });
            }
        } catch (error) {
            console.error('Failed to save zone:', error);
            setLocalStatus({ message: "Network Error: Could not reach the server.", isError: true });
        }
    };


    if (!isLoaded) return <div className="card">Loading Maps...</div>;

    return (
        <section id="zone-creator-card" className="card">
            <h2 className="card-header">1. Zone Creator</h2>
            <div className="form-group">
                <label htmlFor="zone-name-input" className="form-label">New Toll Zone Name</label>
                <input 
                    type="text" 
                    id="zone-name-input" 
                    className="form-input" 
                    placeholder="e.g., Electronic City Expressway" 
                    value={zoneName} 
                    onChange={(e) => setZoneName(e.target.value)}
                />
            </div>
            <p className="form-label">Use the tools on the map to draw the zone boundary:</p>
            <div id="zone-creator-map">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultPos}
                    zoom={12}
                >
                    {drawingLibReady && drawingOptions && (
                        <DrawingManager
                            drawingMode={window.google.maps.drawing.OverlayType.POLYGON}
                            options={drawingOptions}
                            onPolygonComplete={onPolygonComplete}
                        />
                    )}
                </GoogleMap>
            </div>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Max Zone Distance (meters) - Situation B Fallback</label>
                <input 
                    type="number" className="form-input" placeholder="e.g. 5000"
                    value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Flat Rate Toll (₹) - Situation C</label>
                <input 
                    type="number" className="form-input" placeholder="e.g. 150"
                    value={flatRate} onChange={(e) => setFlatRate(e.target.value)}
                />
            </div>
            <button 
                onClick={handleSaveZone} 
                className="btn btn-green" 
                style={{marginTop: '1rem'}}
                disabled={!newZoneCoordinates || !zoneName.trim()}
            >
                Save Toll Zone
            </button>
            
            <div id="zone-creator-status" className={`status-box ${localStatus.isError ? 'status-error' : 'status-warning'}`}>
                {localStatus.message}
            </div>
            
            <button onClick={() => navigate('/')} className="btn btn-gray" style={{marginTop: '0.5rem'}}>Back to Menu</button>
        </section>
    );
}

export default ZoneCreatorPage;