import React, { useState } from 'react';
import './RunwayCard.css';
import planeFuelLow from '../assets/plane-fuel-low.png';
import planeFuelLowMid from '../assets/plane-fuel-lowmid.png';
import planeFuelMid from '../assets/plane-fuel-mid.png';
import planeFuelHighMid from '../assets/plane-fuel-highmid.png';
import planeFuelHigh from '../assets/plane-fuel-high.png';
import { useSimulation } from '../context/SimulationContext';

/**
 * RunwayCard: Card representing a single runway in the simulation.
 *
 * Props:
 *   runwayID: Index matching the runway's position in activeSim.runways
 *   runwayName: Display label (e.g. "Runway 1")
 *   callSign: Callsign of the plane currently on this runway, or "N/A"
 *   initialMode: Fallback mode if context hasn't loaded yet
 *   initialStatus: Fallback status if context hasn't loaded yet
 *
 * State source: Reads live mode/status/plane data from SimulationContext
 * via activeSim.runways[runwayID]. Writes user changes back to context
 * via updateRunway(), which stores them in pendingRunwayChanges for
 * later commit to the backend.
 *
 * Features:
 *   - Colour-coded tab and border: gold (Takeoff), blue (Landing),
 *     purple (Mixed), grey (Unavailable), muted variants when in use
 *   - Plane icon with fuel-level indicator (5 tiers based on minutes remaining)
 *   - Countdown showing time until runway is free
 *   - Hover popup with full flight details (route, altitude, speed, fuel, emergency)
 *   - Mode/Status dropdowns locked during playback or when runway is in use
 */

// Colour mapping for runway modes 
const colorMap = {
  'Takeoff': '#96711E',
  'Landing': '#265EA8',
  'Mixed': '#9B59B6',
  'Takeoff_muted': '#C4A96A',
  'Landing_muted': '#7AADD4',
  'Mixed_muted': '#C49FD4',
  'Unavailable': '#A0A0A0',
  'default': '#A0A0A0'
};

export default function RunwayCard({
  runwayID,
  runwayName = "runway 1",
  callSign = "N/A",
  initialMode = "Mixed",
  initialStatus = "AVAILABLE",
}) {
  const { activeSim, updateRunway } = useSimulation();

  // Read live runway state from context, fall back to props if not yet loaded
  const runway = activeSim?.runways.find(r => r.id === runwayID);
  const mode = runway?.mode || initialMode;
  const status = runway?.status || initialStatus;

  // Determine if dropdowns should be locked
  const isPlaying = activeSim?.playState === "playing";
  const isInUse = status?.toUpperCase() === 'RUNWAY IN USE';
  const isLocked = isPlaying || isInUse;

  // Extract plane data from the runway (null if no plane occupying it)
  const plane = runway?.plane;
  const fuelMinutes = plane ? Math.floor(plane._fuel_seconds / 60) : null;

  // Calculate time until runway becomes free
  const timeRemaining = runway?.expectedFreeTime ?? 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  // Write dropdown changes to context (stored in pendingRunwayChanges)
  const handleModeChange = (e) => updateRunway(runwayID, { mode: e.target.value });
  const handleStatusChange = (e) => updateRunway(runwayID, { status: e.target.value });

  // Hover state for the flight details popup
  const [isHovered, setIsHovered] = useState(false);

  // Select plane icon based on fuel level (5 tiers, 12-minute increments)
  const getFuelImage = (fuelMin) => {
    if (fuelMin <= 12) return planeFuelLow;
    if (fuelMin <= 24) return planeFuelLowMid;
    if (fuelMin <= 36) return planeFuelMid;
    if (fuelMin <= 48) return planeFuelHighMid;
    return planeFuelHigh;
  };

  const currentPlaneImg = getFuelImage(fuelMinutes);

  // Determine card colour: full colour when available, muted when in use, grey when unavailable
  const activeColor = status?.toUpperCase() === 'AVAILABLE'
    ? (colorMap[mode] || colorMap['default'])
    : status?.toUpperCase() === 'RUNWAY IN USE'
      ? (colorMap[`${mode}_muted`] || colorMap['default'])
      : colorMap['Unavailable'];

  return (
    <div
      className="runway-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="runway-wrapper">

        {/* Coloured tab showing runway name */}
        <div className="runway-tab" style={{ backgroundColor: activeColor }}>
          {runwayName}
        </div>

        {/* Main card body with plane icon and flight info */}
        <div className="runway-card" style={{ borderColor: activeColor }}>
          <div className="card-content">
            <div className="plane-icon-container">
              {plane && <img src={currentPlaneImg} alt="plane" className="plane-image" />}
            </div>
            <div className="flight-info">
              <h3>FLIGHT INFO</h3>
              <div className="info-row">
                <span className="label">Call-sign: </span>
                <span className="value">{callSign}</span>
                <div className="info-row">
                  <span className="label">Runway free in: </span>
                  <span className="value">
                    {runway?.plane
                      ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mode and Status dropdowns — locked during playback or when runway is occupied */}
        <div className="runway-controls">
          <div className="control-group">
            <label>MODE</label>
            <select value={mode} onChange={handleModeChange} disabled={isLocked}>
              <option value="Takeoff">Take-off</option>
              <option value="Landing">Landing</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <div className="control-group">
            <label>STATUS</label>
            <select value={status} onChange={handleStatusChange} disabled={isLocked}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="Runway Inspection">Runway Inspection</option>
              <option value="Snow Clearance">Snow Clearance</option>
              <option value="Equipment Failure">Equipment Failure</option>
              <option value="Runway in use" disabled hidden>IN USE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hover popup — full flight details shown when mouse hovers over card */}
      <div className="hover-info-box">
        <div className="hover-content">
          <strong>Flight Details:</strong>
          {plane ? (
            <>
              <div><strong>Callsign:</strong> {plane.callsign}</div>
              <div><strong>Operator:</strong> {plane.operator}</div>
              <div><strong>Route:</strong> {plane.origin} → {plane.destination}</div>
              <div><strong>Altitude:</strong> {Math.round(plane._altitude)} ft</div>
              <div><strong>Speed:</strong> {Math.round(plane._ground_speed)} kts</div>
              <div><strong>Fuel:</strong> {Math.floor(plane._fuel_seconds / 60)} min</div>
              <div><strong>Emergency:</strong> {plane._emergency ? "YES 🚨" : "No"}</div>
            </>
          ) : (
            <p>No aircraft on runway</p>
          )}
        </div>
      </div>
    </div>
  );
}