import React from 'react';
import FlightQueue from "./FlightQueue.jsx";

export default function HoldingPattern({ flights = [], onEmergencyToggle }) {
  // Columns specific to Holding
  const columns = ['Call-sign', 'Origin', 'Time'];

  const formattedData = flights.map(f => ({
    ...f,
    location: f.origin, // Mapping origin to the 'location' slot
    time: f.time
  }));

  return (
    <div className="HoldingPattern">
      <FlightQueue 
        title="Holding Pattern" 
        columns={columns} 
        data={formattedData}
        onEmergencyToggle={onEmergencyToggle}
      />
    </div>
  );
}