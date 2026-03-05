import React from 'react';
import './FlightQueue.css';

export default function FlightQueue({ title, columns, data = [], onEmergencyToggle }) {
  const minRows = 10;
  const emptyRowsCount = Math.max(0, minRows - data.length);

  return (
    <div className="flight-table-container">
      <div className="flight-table-header">{title}</div>
      <div className="table-wrapper">
        <table className="flight-data-table">
          <thead>
            <tr>
              {columns.map((col, i) => <th key={i}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((flight, i) => (
              <tr 
                key={`${flight.callsign}-${i}`} 
                className={`flight-row ${flight.isEmergency ? 'emergency-active' : ''}`}
              >
                <td>{flight.callsign}</td>
                <td>{flight.location}</td>
                <td className="time-cell">
                  {flight.time}
                  {/* Hover Popup for Emergency Toggle */}
                  <div className="flight-actions-popup">
                    <p className="popup-label">{flight.callsign} Details...</p>
                    <div className="emergency-control">
                      <span>EMERGENCY</span>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={!!flight.isEmergency} 
                          onChange={() => onEmergencyToggle(flight.callsign, !flight.isEmergency)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {[...Array(emptyRowsCount)].map((_, i) => (
              <tr key={`empty-${i}`} className="empty-row">
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}