import React, { createContext, useState, useEffect } from 'react';
// 1. IMPORT YOUR API INSTANCE
import api from '../config/api'; 

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [zones, setZones] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loggedInOperator, setLoggedInOperator] = useState(null);

    const fetchZones = async () => {
        try {
            // 2. USE THE API INSTANCE (This uses the Render URL)
            const response = await api.get('/zones');
            
            // Axios results are stored in .data
            setZones(response.data || []);
            setIsLoaded(true);
            console.log("✅ Zones fetched from cloud successfully");
        } catch (error) {
            console.error("❌ Failed to load zones:", error.message);
            setZones([]); // Fallback to empty to avoid crashes
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    return (
        <AppContext.Provider value={{ 
            zones, 
            setZones, 
            isLoaded, 
            fetchZones, 
            loggedInOperator, 
            setLoggedInOperator 
        }}>
            {children}
        </AppContext.Provider>
    );
};