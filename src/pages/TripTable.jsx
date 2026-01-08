import React, { useState, useEffect } from 'react';
import { db } from '../config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const TripTable = () => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
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
    });

    return () => unsubscribe();
  }, []);

  // Helper function to style the status badges
  // 1. Updated Status Styling for "Invoice Pending"
const getStatusStyle = (status) => {
    // Situation A: GPS Connected or Searching
    if (status?.includes('Bypassed')) {
        return { color: '#2563eb', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #bfdbfe' };
    }
    // Situation B: ANPR Charge Completed
    if (status === 'completed') {
        return { color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #a7f3d0' };
    }
    // In-Progress Session (Waiting for Exit)
    if (status === 'in-progress') {
        return { color: '#7c3aed', backgroundColor: '#f5f3ff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #ddd6fe' };
    }
    // SITUATION C: Unregistered Vehicle Log
    if (status === 'Invoice Pending') {
        return { color: '#d97706', backgroundColor: '#fffbeb', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #fde68a' };
    }
    return { color: '#64748b', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
};

  return (
    <div className="table-container" style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px', fontFamily: 'sans-serif', fontWeight: '700' }}>Vehicle Monitoring Log</h2>
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plate</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Log Status</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Toll (₹)</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, index) => {
              const formattedTime = trip.lastSightingTimestamp?.toDate 
                ? trip.lastSightingTimestamp.toDate().toLocaleString() 
                : "Syncing...";

              // LOGIC: Map unregistered 'in-progress' trips to 'Invoice Pending' status
              const currentStatus = (trip.ownerName === 'Unregistered' && trip.status === 'in-progress') 
                ? 'Invoice Pending' 
                : trip.status;

              return (
                <tr key={trip.id} style={{ 
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f1f5f9',
                  borderBottom: '1px solid #e2e8f0',
                  transition: 'background-color 0.2s'
                }}>
                  <td style={{ padding: '16px', fontWeight: '700', color: '#334155' }}>{trip.plate}</td>
                  <td style={{ padding: '16px', color: '#475569' }}>{trip.ownerName}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>{formattedTime}</td>
                  <td style={{ padding: '16px' }}>
                      <span style={getStatusStyle(currentStatus)}>
                          {currentStatus?.toUpperCase()}
                      </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '700', color: trip.totalToll > 0 ? '#0f172a' : '#94a3b8' }}>
                      {trip.totalToll > 0 ? `₹${trip.totalToll}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TripTable;