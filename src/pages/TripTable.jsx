import React, { useState, useEffect } from 'react';
import { db } from '../config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const TripTable = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Querying Firebase directly for real-time updates
        const tripsQuery = query(
            collection(db, "vehicle_trips"), 
            orderBy("lastSightingTimestamp", "desc")
        );

        const unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
            const tripsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTrips(tripsData); 
            setLoading(false);
        }, (error) => {
            console.error("Firestore subscription error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getStatusStyle = (status) => {
        const baseStyle = { 
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontSize: '11px', 
            fontWeight: '700', 
            textTransform: 'uppercase',
            border: '1px solid'
        };

        if (status?.includes('Bypassed')) {
            return { ...baseStyle, color: '#2563eb', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' };
        }
        if (status === 'completed') {
            return { ...baseStyle, color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' };
        }
        if (status === 'in-progress') {
            return { ...baseStyle, color: '#7c3aed', backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' };
        }
        if (status === 'Invoice Pending') {
            return { ...baseStyle, color: '#d97706', backgroundColor: '#fffbeb', borderColor: '#fde68a' };
        }
        return { ...baseStyle, color: '#64748b', backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' };
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>📡 Connecting to live traffic log...</div>;
    }

    return (
        <div className="table-container" style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1e293b', margin: 0, fontFamily: 'sans-serif', fontWeight: '800' }}>🚗 Vehicle Monitoring Log</h2>
                <span style={{ fontSize: '12px', color: '#64748b', backgroundColor: '#fff', padding: '4px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    Live Updates Active
                </span>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plate</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Log Status</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toll (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trips.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No vehicle activity recorded yet.</td>
                            </tr>
                        ) : (
                            trips.map((trip, index) => {
                                const formattedTime = trip.lastSightingTimestamp?.toDate 
                                    ? trip.lastSightingTimestamp.toDate().toLocaleString() 
                                    : "Processing...";

                                const currentStatus = (trip.ownerName === 'Unregistered' && trip.status === 'in-progress') 
                                    ? 'Invoice Pending' 
                                    : trip.status;

                                return (
                                    <tr key={trip.id} style={{ 
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}>
                                        <td style={{ padding: '16px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.5px' }}>{trip.plate}</td>
                                        <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>{trip.ownerName}</td>
                                        <td style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>{formattedTime}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={getStatusStyle(currentStatus)}>
                                                {currentStatus}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '800', color: trip.totalToll > 0 ? '#1e293b' : '#cbd5e1' }}>
                                            {trip.totalToll > 0 ? `₹${trip.totalToll.toFixed(2)}` : "—"}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TripTable;