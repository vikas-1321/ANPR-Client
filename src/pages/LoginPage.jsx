import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext'; 
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const { zones, setLoggedInOperator } = useContext(AppContext);
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [password, setPassword] = useState('');
    const [localStatus, setLocalStatus] = useState({ message: '', isError: false });
    const navigate = useNavigate();

    const selectedZone = useMemo(
        () => zones.find(zone => zone.id === selectedZoneId) || null,
        [zones, selectedZoneId]
    );

  const cameraOptions = useMemo(() => {
    if (!selectedZone) return [];
    return Object.keys(selectedZone.operators || {}); // It looks for the keys in the 'operators' map
}, [selectedZone]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLocalStatus({ message: 'Logging in...', isError: false });

        if (!selectedZoneId) {
            setLocalStatus({ message: "Please select a toll zone.", isError: true });
            return;
        }
        if (!selectedCameraId) {
            setLocalStatus({ message: "Please select a camera to login.", isError: true });
            return;
        }
        if (!password) {
            setLocalStatus({ message: "Password is required.", isError: true });
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cameraID: selectedCameraId, password }),
            });

            const data = await response.json();

            if (data.success) {
                setLocalStatus({ message: data.message, isError: false });
                setLoggedInOperator(data.operator);
                navigate('/operator'); 
            } else {
                setLocalStatus({ message: data.message, isError: true });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setLocalStatus({ message: "Network Error: Could not reach the Express server.", isError: true });
        }
    };

    return (
        <section id="login-card" className="card">
            <h2 className="card-header">3. Operator Login</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="login-zone" className="form-label">Toll Zone</label>
                    <select 
                        id="login-zone" 
                        className="form-input"
                        value={selectedZoneId}
                        onChange={(e) => {
                            setSelectedZoneId(e.target.value);
                            setSelectedCameraId('');
                        }}
                    >
                        <option value="">Select a toll zone</option>
                        {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="login-cameraid" className="form-label">Camera ID</label>
                    <select 
                        id="login-cameraid" 
                        className="form-input" 
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        disabled={!selectedZone || cameraOptions.length === 0}
                    >
                        <option value="">
                            {selectedZone ? 'Select a camera' : 'Select a zone first'}
                        </option>
                        {cameraOptions.map(cameraId => (
                            <option key={cameraId} value={cameraId}>{cameraId}</option>
                        ))}
                    </select>
                    {!selectedZone && (
                        <p className="form-help">Choose a toll zone to see its registered cameras.</p>
                    )}
                    {selectedZone && cameraOptions.length === 0 && (
                        <p className="form-help">No cameras registered in this zone yet.</p>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="login-password" className="form-label">Password</label>
                    <input 
                        type="password" 
                        id="login-password" 
                        className="form-input" 
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit" id="login-btn" className="btn" style={{marginTop: '1rem'}}>Login</button>
            </form>
            {localStatus.message && (
                <div id="login-status" className={`status-box ${localStatus.isError ? 'status-error' : 'status-success'}`}>
                    {localStatus.message}
                </div>
            )}
            <button onClick={() => navigate('/')} className="btn btn-gray" style={{marginTop: '0.5rem'}}>Back to Menu</button>
        </section>
    );
}

export default LoginPage;