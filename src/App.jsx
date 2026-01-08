import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext.js';
import { GOOGLE_MAPS_API_KEY } from './config.js';
import { useLoadScript } from '@react-google-maps/api';
import MainMenu from './pages/MainMenu.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OperatorPage from './pages/OperatorPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import ZoneCreatorPage from './pages/ZoneCreatorPage.jsx';
import PathwayManagerPage from './pages/PathwayManagerPage.jsx';
import TripTablePage from './pages/VehicleTripsPage.jsx';
import './index.css'; 

const libraries = ["drawing", "geometry"];

function App() {
    // Global States
    const [loggedInOperator, setLoggedInOperator] = useState(null);
    const [zones, setZones] = useState([]);
    const [status, setStatus] = useState({ message: '', isError: false });
    const [cameraStream, setCameraStream] = useState(null);
    const [autoScanInterval, setAutoScanInterval] = useState(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });
    
    // Auth & Camera Cleanup
    const logout = () => {
        // Stop camera stream if active
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        // Clear scanner interval
        if (autoScanInterval) {
            clearInterval(autoScanInterval);
            setAutoScanInterval(null);
        }
        setLoggedInOperator(null);
        setStatus({ message: 'Logged out successfully.', isError: false });
    };
    
    // Load Zones on App Start
    useEffect(() => {
        const loadZones = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/zones');
                const data = await response.json();
                if (data.success) {
                    setZones(data.zones);
                } else {
                    setStatus({ message: `Error loading zones: ${data.message}`, isError: true });
                }
            } catch (error) {
                console.error('Failed to load zones:', error);
                setStatus({ message: "Network Error: Cannot connect to Express server.", isError: true });
            }
        };
        loadZones();
    }, [loggedInOperator]); // Reload zones after login/logout for updated camera lists

    return (
        <AppContext.Provider value={{ 
            loggedInOperator, setLoggedInOperator, logout, 
            zones, setZones, 
            status, setStatus,
            isLoaded, loadError,
            cameraStream, setCameraStream,
            autoScanInterval, setAutoScanInterval
        }}>
            <Router>
                <div className="container">
                    <header className="header"><h1>ANPR Toll System Simulator</h1></header>
                    <main>
                        {/* Global Status Message Display */}
                        {status.message && (
                            <div id="global-status-box" className={`status-box ${status.isError ? 'status-error' : 'status-success'}`}>
                                <p>{status.message}</p>
                            </div>
                        )}

                        <Routes>
                            <Route path="/" element={<MainMenu />} />
                            <Route path="/zone-creator" element={<ZoneCreatorPage />} />
                            <Route path="/register" element={<RegistrationPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            
                            {/* Protected Route for Operators */}
                            <Route 
                                path="/operator" 
                                element={loggedInOperator ? <OperatorPage /> : <Navigate to="/login" />} 
                            />
                            <Route path="/pathway-manager" element={<PathwayManagerPage />} />
                            <Route path="/trips" element={<TripTablePage />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AppContext.Provider>
    );
}

export default App;