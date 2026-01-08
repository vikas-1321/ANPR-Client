import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';

function OperatorPage() {
    const { loggedInOperator, logout, setCameraStream, cameraStream, setAutoScanInterval, autoScanInterval } = useContext(AppContext);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scannerStatus, setScannerStatus] = useState("Ready");
    const [detectionsHistory, setDetectionsHistory] = useState([]);
    const cooldownRef = useRef(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStream(stream);
                    runScannerLoop(stream);
                };
            }
        } catch (err) { setScannerStatus("Camera Error"); }
    };

    const runScannerLoop = (stream) => {
        const interval = setInterval(async () => {
            if (cooldownRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

            const canvas = canvasRef.current;
            canvas.width = 640; canvas.height = 480;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
            const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

            try {
                setScannerStatus("Processing...");
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/anpr/sighting`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operator: loggedInOperator, base64Image }),
                });
                const result = await response.json();

                if (result.success && result.plate) {
                    // IGNORE DUPLICATES IN UI
                    if (result.isDuplicate) {
                        setScannerStatus(`Already Logged: ${result.plate}`);
                        return;
                    }

                    // FRESH LOGIC
                    cooldownRef.current = true;
                    const newEntry = {
                        plate: result.plate,
                        ownerName: result.ownerName || 'Unregistered',
                        time: new Date().toLocaleTimeString(),
                        isRegistered: result.isRegistered
                    };
                    setDetectionsHistory(prev => [newEntry, ...prev]);
                    setScannerStatus(`Detected: ${result.plate}`);

                    setTimeout(() => {
                        cooldownRef.current = false;
                        setScannerStatus("Scanning...");
                    }, 10000); // 10 second camera pause
                }
            } catch (e) { setScannerStatus("Link Error"); }
        }, 2000);
        setAutoScanInterval(interval);
    };

    const onPlateDetected = async (base64Image) => {
    try {
        const response = await fetch('http://localhost:5000/api/anpr/sighting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image, operator: currentOperator })
        });

        const result = await response.json();

        if (result.success) {
            // Ignore duplicates to keep the UI clean
            if (result.isDuplicate) return;

            // Add the new detection to your history list
            const newDetection = {
                plate: result.plate,
                ownerName: result.ownerName, // Now correctly shows 'Unregistered' for Situation C
                isRegistered: result.isRegistered,
                timestamp: new Date().toLocaleTimeString(),
                status: result.status || 'in-progress'
            };

            setDetectionsHistory(prev => [newDetection, ...prev]);
        }
    } catch (error) {
        console.error("Scanning Error:", error);
    }
};
    const stopScanner = () => {
        if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
        if (autoScanInterval) clearInterval(autoScanInterval);
        setCameraStream(null);
        setAutoScanInterval(null);
        setScannerStatus("Stopped");
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <h2>Operator: {loggedInOperator?.cameraID}</h2>
                <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', borderRadius: '8px', background: '#000' }} />
                <button onClick={cameraStream ? stopScanner : startCamera} style={{ width: '100%', padding: '15px', marginTop: '10px', background: cameraStream ? '#e74c3c' : '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    {cameraStream ? "STOP" : "START"}
                </button>
                <div style={{ marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{scannerStatus}</div>
                <div style={{ marginTop: '20px' }}>
                    <h3>Session History ({detectionsHistory.length})</h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #eee' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f4f4f4' }}>
                                <tr><th style={{ padding: '10px' }}>Time</th><th style={{ padding: '10px' }}>Plate</th><th style={{ padding: '10px' }}>Status</th></tr>
                            </thead>
                            <tbody>
                                {detectionsHistory.map((item, i) => (
                                    <tr 
                                        key={i} 
                                        style={{ 
                                            borderBottom: '1px solid #eee',
                                            // SITUATION C: Red background if unregistered
                                            backgroundColor: item.isRegistered ? 'transparent' : '#fee2e2' 
                                        }}
                                    >
                                        <td style={{ padding: '10px' }}>{item.time}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.plate}</td>
                                        <td style={{ 
                                            padding: '10px', 
                                            fontWeight: 'bold',
                                            // SITUATION B (Green) vs SITUATION C (Red)
                                            color: item.isRegistered ? '#10b981' : '#ef4444' 
                                        }}>
                                            {item.isRegistered ? "CHARGED" : "UNREGISTERED"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <button onClick={logout} style={{ marginTop: '20px', color: '#999', border: 'none', background: 'none', cursor: 'pointer' }}>Logout</button>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

export default OperatorPage;