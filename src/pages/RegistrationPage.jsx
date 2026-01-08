import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { GoogleMap, Marker, Polygon } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
// 1. IMPORT YOUR API INSTANCE
import api from '../api'; 

const containerStyle = { width: '100%', height: '300px' };
const defaultPos = { lat: 12.9716, lng: 77.5946 };

function RegistrationPage() {
    const { zones, isLoaded } = useContext(AppContext);
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [cameraLocation, setCameraLocation] = useState(null);
    const [localStatus, setLocalStatus] = useState({ message: 'Select a zone and click on the map to place the camera.', isError: false });
    
    const [cameraID, setCameraID] = useState('');
    const [password, setPassword] = useState('');
    const [cameraType, setCameraType] = useState('INTERMEDIATE');
    const navigate = useNavigate();

    const selectedZone = useMemo(
        () => zones.find(z => z.id === selectedZoneId) || null,
        [zones, selectedZoneId]
    );

    const handleZoneSelect = (event) => {
        const zoneId = event.target.value;
        setSelectedZoneId(zoneId);
        setCameraLocation(null);

        if (!zoneId) {
            setLocalStatus({ message: 'Select a zone and click on the map to place the camera.', isError: false });
            return;
        }

        const zone = zones.find(z => z.id === zoneId);
        if (zone) {
            setLocalStatus({ message: `Zone ${zone.name} selected. Click inside to place camera.`, isError: false });
        } else {
            setLocalStatus({ message: "Zone not found.", isError: true });
        }
    };

    const geometryLibReady = typeof window !== 'undefined' && !!window.google?.maps?.geometry;

    const handleMapClick = (e) => {
        if (!geometryLibReady || !selectedZone) {
            setLocalStatus({ message: "Error: Please wait for maps to load and select a toll zone first.", isError: true });
            return;
        }

        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        
        const isInside = window.google.maps.geometry.poly.containsLocation(
            e.latLng, 
            new window.google.maps.Polygon({ paths: selectedZone.coordinates })
        );

        if (isInside) {
            setCameraLocation(newPos);
            setLocalStatus({ message: "Location selected. Ready to register.", isError: false });
        } else {
            setCameraLocation(null);
            setLocalStatus({ message: "Error: Camera must be placed inside the selected toll zone.", isError: true });
        }
    };
    
    const handleRegistration = async (e) => {
        e.preventDefault();
        if (!cameraID || !password || !selectedZoneId || !cameraLocation) {
            setLocalStatus({ message: "Error: All fields and a map location are required.", isError: true });
            return;
        }
        
        setLocalStatus({ message: "Registering camera...", isError: false });
        
        try {
            // 2. USE API.POST INSTEAD OF FETCH
            // This targets: https://your-render-url.com/api/zones/register
            const response = await api.post('/zones/register', {
                password, 
                cameraID, 
                cameraType, 
                tollZoneId: selectedZone.id, 
                tollZoneName: selectedZone.name,
                location: cameraLocation
            });

            // Axios automatically parses JSON into 'data'
            const data = response.data;
            
            if (data.success) {
                setLocalStatus({ message: data.message, isError: false });
                setCameraID(''); 
                setPassword(''); 
                setCameraLocation(null);
            } else {
                setLocalStatus({ message: data.message || "Registration failed.", isError: true });
            }
        } catch (error) {
            console.error('Failed to register camera:', error);
            // 3. IMPROVED ERROR HANDLING
            const errMsg = error.response?.data?.message || "Network Error: Could not reach the server.";
            setLocalStatus({ message: errMsg, isError: true });
        }
    };

    if (!isLoaded) return <div className="card">Loading Maps...</div>;

    return (
        <section id="registration-card" className="card">
            <h2 className="card-header">2. Register Operator / Camera</h2>
            <form onSubmit={handleRegistration}>
                <div className="form-group">
                    <label htmlFor="toll-zone-select" className="form-label">Select Toll Zone</label>
                    <select id="toll-zone-select" className="form-input" onChange={handleZoneSelect} value={selectedZoneId}>
                        <option value="">Select a zone</option>
                        {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="register-camera-id" className="form-label">Camera ID (Login Username)</label>
                    <input type="text" id="register-camera-id" className="form-input" placeholder="e.g., CAM-01 (Unique)" value={cameraID} onChange={(e) => setCameraID(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="register-password" className="form-label">Password</label>
                    <input type="password" id="register-password" className="form-input" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="register-camera-type" className="form-label">Camera Type</label>
                    <select id="register-camera-type" className="form-input" value={cameraType} onChange={(e) => setCameraType(e.target.value)}>
                        <option value="INTERMEDIATE">Intermediate Point</option>
                        <option value="EDGE">Edge Point (Entry/Exit)</option>
                    </select>
                </div>
                
                <p className="form-label">Click inside the toll zone to set the camera's location:</p>
                <div id="map">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={selectedZone ? selectedZone.center : defaultPos}
                        zoom={selectedZone ? 14 : 12}
                        onClick={handleMapClick}
                    >
                        {selectedZone && (
                            <Polygon
                                paths={selectedZone.coordinates}
                                options={{
                                    strokeColor: "#00bcd4",
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    fillColor: "#00bcd4",
                                    fillOpacity: 0.1,
                                    clickable: false,
                                }}
                            />
                        )}
                        {cameraLocation && <Marker position={cameraLocation} />}
                    </GoogleMap>
                </div>
                
                <button type="submit" id="register-camera-btn" className="btn" style={{marginTop: '1rem'}} disabled={!cameraLocation || !selectedZoneId}>Register Operator</button>
            </form>
            {localStatus.message && (
                <div id="reg-status" className={`status-box ${localStatus.isError ? 'status-error' : 'status-warning'}`}>
                    {localStatus.message}
                </div>
            )}
            <button onClick={() => navigate('/')} className="btn btn-gray" style={{marginTop: '0.5rem'}}>Back to Menu</button>
        </section>
    );
}

export default RegistrationPage;