import React, { createContext, useState, useEffect } from 'react';
import api from '../config/api'; 

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [zones, setZones] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchZones = async () => {
            try {
                const response = await api.get('/zones');
                // Axios uses .data
                setZones(response.data || []); 
                setIsLoaded(true);
            } catch (error) {
                console.error("❌ Context Error:", error);
                setIsLoaded(true);
            }
        };
        fetchZones();
    }, []);

    return (
        <AppContext.Provider value={{ zones, isLoaded }}>
            {children}
        </AppContext.Provider>
    );
};