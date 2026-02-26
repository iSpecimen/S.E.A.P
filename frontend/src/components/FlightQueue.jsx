import React from 'react';
import './FlightQueue.css';

export default function FlightTable({ title, columns, data = [] }) {
  // Set the total number of rows you want to see in the table at all times
  const minRows = 10;
  
  // Calculate how many empty rows are needed
  // If data.length is 4, we need 6 empty rows. If it's 15, we need 0.
  const emptyRowsCount = Math.max(0, minRows - data.length);

  return (
    <div className="flight-table-container">
      <div className="flight-table-header">{title}</div>
      <div className="table-wrapper">
        <table className="flight-data-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 1. Render actual flight data */}
            {data.map((flight, i) => (
              <tr key={`flight-${i}`}>
                <td>{flight.callsign}</td>
                <td>{flight.location}</td>
                <td>{flight.time}</td>
              </tr>
            ))}

            {/* 2. Render empty rows to fill the remaining space */}
            {[...Array(emptyRowsCount)].map((_, i) => (
              <tr key={`empty-${i}`} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}