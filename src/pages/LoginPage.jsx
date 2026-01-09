import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext'; 
import { useNavigate } from 'react-router-dom';
// 1. IMPORT YOUR API INSTANCE
import api from '../config/api'; 

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
        return Object.keys(selectedZone.operators || {});
    }, [selectedZone]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLocalStatus({ message: 'Logging in...', isError: false });

        if (!selectedZoneId || !selectedCameraId || !password) {
            setLocalStatus({ message: "Please fill in all fields.", isError: true });
            return;
        }

        try {
            // 2. USE API.POST INSTEAD OF FETCH
            // This automatically targets: https://your-render-url.com/api/auth/login
            const response = await api.post('/auth/login', { 
                cameraID: selectedCameraId, 
                password 
            });

            // Axios puts the response data inside a 'data' property automatically
            const data = response.data;

            if (data.success) {
                setLocalStatus({ message: data.message, isError: false });
                setLoggedInOperator(data.operator);
                navigate('/operator'); 
            } else {
                setLocalStatus({ message: data.message || "Login failed.", isError: true });
            }
        } catch (error) {
            console.error("Login error:", error);
            
            // 3. IMPROVED ERROR HANDLING
            const errorMessage = error.response?.data?.message || 
                               "Network Error: Could not reach the Express server.";
            
            setLocalStatus({ message: errorMessage, isError: true });
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