import React from 'react';
import FlightQueue from "./FlightQueue.jsx";

/**
 * TakeoffQueue: Uses FlightQueue to display outbound planes
 *
 * Props:
 *   flights: Array of plane objects from activeSim.takeoffQueue,
 *            each with: { callsign, destination, time, isEmergency, ... }
 *
 *
 * Unlike HoldingPattern, no onEmergencyToggle is passed — the emergency
 * toggle in FlightQueue is automatically disabled when this prop is absent,
 * since only airborne planes in the holding pattern can declare emergencies.
 */
export default function TakeoffQueue({ flights = [] }) {
  const columns = ['Call-sign', 'Destination', 'Time'];

  // Map destination to location so FlightQueue can render both queue types the same way 
  const formattedData = flights.map(f => ({
    ...f,
    location: f.destination,
    time: f.time
  }));

  return (
    <div className="TakeoffQueue">
      <FlightQueue
        title="Take-off Queue"
        columns={columns}
        data={formattedData}
      />
    </div>
  );
}