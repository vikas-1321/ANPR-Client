import React from 'react';
import TripTable from './TripTable.jsx';

function VehicleTripsPage() {
    return (
        <section className="card">
            <h2 className="card-header">Vehicle Trips</h2>
            <p 
  className="form-label" 
  style={{ 
    marginBottom: '1rem', 
    color: '#9d9999' // Added the requested color
  }}
>
  Live updates from Firebase show the latest vehicle detections across all zones.
</p>
            <TripTable />
        </section>
    );
}

export default VehicleTripsPage;




