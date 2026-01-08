import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
// 1. IMPORT YOUR API INSTANCE
import api from '../config/api'; 

function PathwayManagerPage() {
    const { zones, isLoaded } = useContext(AppContext);
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [currentPathways, setCurrentPathways] = useState([]);
    const [pathwayInput, setPathwayInput] = useState('');
    const [localStatus, setLocalStatus] = useState({ message: 'Select a zone to manage pathways.', isError: false });
    const navigate = useNavigate();

    const selectedZone = useMemo(
        () => zones.find(z => z.id === selectedZoneId) || null,
        [zones, selectedZoneId]
    );

    const handleZoneChange = (event) => {
        const zoneId = event.target.value;
        setSelectedZoneId(zoneId);

        if (!zoneId) {
            setCurrentPathways([]);
            setLocalStatus({ message: 'Select a zone to manage pathways.', isError: false });
            return;
        }

        const zone = zones.find(z => z.id === zoneId);
        if (zone) {
            setCurrentPathways(zone.operatorPathways || []);
            setLocalStatus({ message: `Managing pathways for ${zone.name}.`, isError: false });
        } else {
            setCurrentPathways([]);
            setLocalStatus({ message: 'Zone not found.', isError: true });
        }
    };

    const handleAddPathway = () => {
        const pathText = pathwayInput.trim();
        if (!pathText) return;
        
        const newPath = pathText.split(',').map(id => id.trim().toUpperCase()).filter(p => p.length > 0);
        
        if (newPath.length < 2) {
            setLocalStatus({ message: 'Pathway must contain at least two camera IDs.', isError: true });
            return;
        }

        const availableCameras = Object.keys(selectedZone?.operators || {});
        const isValid = newPath.every(id => availableCameras.includes(id));
        
        if (!isValid) {
            setLocalStatus({ message: 'Error: Pathway contains unregistered camera IDs.', isError: true });
            return;
        }

        setCurrentPathways(prev => [...prev, { path: newPath }]);
        setPathwayInput('');
        setLocalStatus({ message: 'Pathway added. Click "Save" to commit changes.', isError: false });
    };

    const handleRemovePathway = (index) => {
        setCurrentPathways(prev => prev.filter((_, i) => i !== index));
        setLocalStatus({ message: 'Pathway removed. Click "Save" to commit changes.', isError: false });
    };

    const handleSavePathways = async () => {
        if (!selectedZoneId) {
            setLocalStatus({ message: 'Please select a toll zone first.', isError: true }); 
            return; 
        }

        setLocalStatus({ message: 'Saving pathways...', isError: false });

        try {
            // 2. USE API.PUT INSTEAD OF FETCH
            // This targets: https://your-render-url.com/api/zones/:id/pathways
            const response = await api.put(`/zones/${selectedZoneId}/pathways`, { 
                operatorPathways: currentPathways 
            });
            
            // Axios automatically parses JSON into 'data'
            const data = response.data;
            
            if (data.success) {
                setLocalStatus({ message: data.message, isError: false });
            } else {
                setLocalStatus({ message: data.message || 'Failed to save.', isError: true });
            }
        } catch (error) {
            console.error('Failed to save pathways:', error);
            // 3. IMPROVED ERROR MESSAGE
            const errMsg = error.response?.data?.message || 'Network Error: Could not reach the server.';
            setLocalStatus({ message: errMsg, isError: true });
        }
    };

    if (!isLoaded) return <div className="card">Loading Zones...</div>;

    return (
        <section id="pathway-manager-card" className="card">
            <h2 className="card-header">4. Pathway Manager</h2>
            <p className="form-label" style={{marginBottom: '1rem'}}>Define the ordered driving paths for cameras within a toll zone.</p>
            
            <div className="form-group">
                <label htmlFor="pathway-toll-zone-select" className="form-label">Select Toll Zone to Edit</label>
                <select 
                    id="pathway-toll-zone-select" 
                    className="form-input" 
                    value={selectedZoneId}
                    onChange={handleZoneChange}
                >
                    <option value="">Select a zone</option>
                    {zones.map(zone => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <h3 className="form-label" style={{fontWeight: 600}}>Available Cameras in this Zone:</h3>
                <div id="available-cameras-list" style={{padding: '0.5rem', backgroundColor: 'var(--primary-bg)', borderRadius: '0.25rem', minHeight: '20px', fontSize: '0.85rem', color: 'var(--orange)'}}>
                    {selectedZone ? (Object.keys(selectedZone.operators).join(', ') || 'No cameras registered.') : 'Select a zone first.'}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="pathway-input" className="form-label">New Pathway (comma-separated camera IDs)</label>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                    <input 
                        type="text" 
                        id="pathway-input" 
                        className="form-input" 
                        placeholder="e.g., CAM-01,CAM-02,CAM-03"
                        value={pathwayInput}
                        onChange={(e) => setPathwayInput(e.target.value)}
                    />
                    <button id="add-pathway-btn" className="btn btn-small btn-green" onClick={handleAddPathway} disabled={!selectedZone}>Add</button>
                </div>
            </div>
            
            <div className="form-group">
                <h3 className="form-label" style={{fontWeight: 600}}>Current Pathways to be Saved:</h3>
                <div id="pathways-list-div" style={{border: '1px solid var(--border-color)', borderRadius: '0.375rem', padding: '0.75rem', minHeight: '50px'}}>
                    {currentPathways.length === 0 ? (
                        <p style={{color: 'var(--text-dim)', fontSize: '0.85rem'}}>No pathways defined yet. Add one above.</p>
                    ) : (
                        currentPathways.map((path, index) => (
                            <div key={index} className="pathway-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                                <span>{path.path.join(' ➔ ')}</span>
                                <button onClick={() => handleRemovePathway(index)} className="btn btn-small btn-red">Remove</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <button 
                id="save-pathways-btn" 
                className="btn btn-green" 
                style={{marginTop: '1rem'}}
                onClick={handleSavePathways}
                disabled={!selectedZoneId}
            >
                Save Pathways to Firebase
            </button>
            
            {localStatus.message && (
                <div id="pathway-status" className={`status-box ${localStatus.isError ? 'status-error' : 'status-warning'}`}>
                    {localStatus.message}
                </div>
            )}
            
            <button onClick={() => navigate('/')} className="btn btn-gray" style={{marginTop: '0.5rem'}}>Back to Menu</button>
        </section>
    );
}

export default PathwayManagerPage;