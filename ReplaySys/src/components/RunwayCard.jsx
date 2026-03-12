import React, { act, useState } from 'react';
import './RunwayCard.css';
import planeFuelLow from '../assets/plane-fuel-low.png';
import planeFuelLowMid from '../assets/plane-fuel-lowmid.png';
import planeFuelMid from '../assets/plane-fuel-mid.png';
import planeFuelHighMid from '../assets/plane-fuel-highmid.png';
import planeFuelHigh from '../assets/plane-fuel-high.png';
import { useSimulation } from '../context/SimulationContext';


// --- Configuration ---

// This map defines the colors for different modes.
const colorMap = {
  'Takeoff': '#96711E',
  'Landing': '#265EA8',
  'Mixed': '#9B59B6',
  'Takeoff_muted': '#C4A96A',   // muted gold
  'Landing_muted': '#7AADD4',    // muted blue
  'Mixed_muted': '#C49FD4',      // muted purple
  'Unavailable': '#A0A0A0',
  'default': '#A0A0A0' // Fallback color
};

// --- Main Component ---

export default function RunwayCard({
  runwayID,
  runwayName = "runway 1",
  callSign = "N/A",
  defaultRemainingTime = 0,
  initialMode = "Mixed",
  initialStatus = "AVAILABLE",
  hoverInfo = "No flight details available." // Content for the hover box
}) {
  const { activeSim, updateRunway } = useSimulation();
  // Read mode/status FROM CONTEXT instead of local state
  const runway = activeSim?.runways.find(r => r.id === runwayID);

  console.log("Runway from context:", runway);
  console.log("RunwayID prop:", runwayID);
  console.log("ActiveSim runways:", activeSim?.runways);

  const mode = runway?.mode || initialMode;
  const status = runway?.status || initialStatus;
  // const remainingTime = runway?.remainingTime || defaultRemainingTime;   -- We can add runway progress updates and fuel updates to be separate.

  const isPlaying = activeSim?.playState === "playing";
  const isInUse = status?.toUpperCase() === 'RUNWAY IN USE';
  const isLocked = isPlaying || isInUse;

  const plane = runway?.plane;

  const fuelMinutes = plane ? Math.floor(plane._fuel_seconds / 60) : null;

  const timeRemaining = runway?.expectedFreeTime ?? 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  // Write changes TO CONTEXT instead of local state
  const handleModeChange = (e) => updateRunway(runwayID, { mode: e.target.value });
  const handleStatusChange = (e) => updateRunway(runwayID, { status: e.target.value });
  const [isHovered, setIsHovered] = useState(false);



  const getFuelImage = (fuelMin) => {
    if (fuelMin <= 12) return planeFuelLow;
    if (fuelMin <= 24) return planeFuelLowMid;
    if (fuelMin <= 36) return planeFuelMid;
    if (fuelMin <= 48) return planeFuelHighMid;
    return planeFuelHigh;
  };

  const currentPlaneImg = getFuelImage(fuelMinutes);

  // 2. Create a "Live Color" variable 
  // This logic runs every time the component renders
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

        {/* 1. The Folder Tab */}
        <div className="runway-tab" style={{ backgroundColor: activeColor }}>
          {runwayName}
        </div>

        {/* 2. The Main Card Body */}
        <div className="runway-card" style={{ borderColor: activeColor }}>
          <div className="card-content">

            {/* Left Side: Plane Icon */}
            <div className="plane-icon-container">
              <img src={currentPlaneImg} alt="plane" className="plane-image" />
            </div>

            {/* Right Side: Flight Info */}
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

        {/* 3. The Dropdowns) */}
        <div className="runway-controls">

          {/* Mode Dropdown */}
          <div className="control-group">
            <label>MODE</label>
            <select value={mode} onChange={handleModeChange} disabled={isLocked}>
              <option value="Takeoff">Take-off</option>
              <option value="Landing">Landing</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* Status Dropdown */}
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

      <div className="hover-info-box">
        {/* Since data comes from the backend, this box will grow to fit it */}
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