import React from 'react';
import FlightQueue from "./FlightQueue.jsx";

/**
 * HoldingPattern: uses FlightQueue to map inbound planes landing at 'SEAP'.
 *
 * Props:
 *   flights: Array of plane objects from activeSim.holdingPattern,
 *            each with: { callsign, origin, time, isEmergency, ... }
 *   onEmergencyToggle: Passed through FlightQueue to allow users to cause emergencies. 
 */
export default function HoldingPattern({ flights = [], onEmergencyToggle }) {
  const columns = ['Call-sign', 'Origin', 'Time'];

  // Map origin to location so FlightQueue can render both queue types the same way
  const formattedData = flights.map(f => ({
    ...f,
    location: f.origin,
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