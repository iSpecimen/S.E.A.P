import React from 'react';
import FlightQueue from "./FlightQueue.jsx";

export default function TakeoffQueue({ flights = [], onEmergencyToggle }) {
  // Columns specific to Take-off
  const columns = ['Call-sign', 'Destination', 'Time'];
  
  // We map the data to ensure the 'location' property matches the column
  const formattedData = flights.map(f => ({
    ...f,
    location: f.destination, // Mapping destination to the 'location' slot
    time: f.time
  }));

  return (
    <div className="TakeoffQueue">
      <FlightQueue 
        title="Take-off Queue" 
        columns={columns} 
        data={formattedData}
        onEmergencyToggle={onEmergencyToggle}
      />
    </div>
  );
}