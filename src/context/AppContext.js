import { createContext } from 'react';

// Create a context object with default values
export const AppContext = createContext({
    // Auth State
    loggedInOperator: null,
    setLoggedInOperator: () => {},
    logout: () => {},
    
    // Zone/Data State
    zones: [],
    setZones: () => {},
    
    // Status Display
    status: { message: '', isError: false },
    setStatus: () => {},

    // Google Maps Loading State (NEW ADDITION)
    isLoaded: false,
    loadError: null,

    // Camera Stream (Local State)
    cameraStream: null,
    setCameraStream: () => {},
    autoScanInterval: null,
    setAutoScanInterval: () => {}
});