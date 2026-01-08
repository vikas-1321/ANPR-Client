import React from 'react';
import { Link } from 'react-router-dom';

function MainMenu() {
    return (
        <section id="main-menu-card" className="card">
            <h2 className="card-header">Main Menu</h2>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <Link to="/zone-creator" className="btn btn-green">Create New Zone</Link>
                <Link to="/register" className="btn">Register Operator</Link>
                <Link to="/login" className="btn">Operator Login</Link>
                <Link to="/pathway-manager" className="btn btn-gray">Pathway Manager</Link>
                <Link to="/trips" className="btn" style={{gridColumn: '1 / -1'}}>Vehicle Trips</Link>
            </div>
        </section>
    );
}

export default MainMenu;