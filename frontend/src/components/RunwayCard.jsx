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
// You can add more modes and colors here.
const colorMap = {
  'Take-off': '#96711E',
  'Landing': '#265EA8',
  'Mixed': '#9B59B6',
  'Unavailable': '#A0A0A0',
  'default': '#A0A0A0' // Fallback color
};

// --- Main Component ---

export default function RunwayCard({
  runwayID,
  runwayName = "runway 1",
  callSign = "N/A",
  fuelLevel = 60,
  initialMode = "Mixed",
  initialStatus = "AVAILABLE",
  hoverInfo = "No flight details available." // Content for the hover box
}) {
  const { activeSim, updateRunway } = useSimulation();
  // Read mode/status FROM CONTEXT instead of local state
  const runway = activeSim?.runways.find(r => r.id === runwayID);
  const mode = runway?.mode || "Mixed";
  const status = runway?.status || "AVAILABLE";

  // Write changes TO CONTEXT instead of local state
  const handleModeChange = (e) => updateRunway(runwayID, { mode: e.target.value });
  const handleStatusChange = (e) => updateRunway(runwayID, { status: e.target.value });
  const [isHovered, setIsHovered] = useState(false);



  const getFuelImage = (level) => {
    if (level <= 20) return planeFuelLow;
    if (level <= 40) return planeFuelLowMid;
    if (level <= 60) return planeFuelMid;
    if (level <= 80) return planeFuelHighMid;
    return planeFuelHigh;
  };

  const currentPlaneImg = getFuelImage(fuelLevel);

  // 2. Create a "Live Color" variable 
  // This logic runs every time the component renders
  const activeColor = status === 'AVAILABLE'
    ? (colorMap[mode] || colorMap['default'])
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
              </div>
            </div>

          </div>
        </div>

        {/* 3. The Dropdowns) */}
        <div className="runway-controls">

          {/* Mode Dropdown */}
          <div className="control-group">
            <label>MODE</label>
            <select value={mode} onChange={handleModeChange}>
              <option value="Take-off">Take-off</option>
              <option value="Landing">Landing</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="control-group">
            <label>STATUS</label>
            <select value={status} onChange={handleStatusChange}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="Runway Inspection">Runway Inspection</option>
              <option value="Snow Clearance">Snow Clearance</option>
              <option value="Equipment Failure">Equipment Failure</option>
            </select>
          </div>

        </div>
      </div>

      <div className="hover-info-box">
        {/* Since data comes from the backend, this box will grow to fit it */}
        <div className="hover-content">
          <strong>Flight Details:</strong>
          <p>{hoverInfo || "Could not load data."}</p>
        </div>
      </div>
    </div>
  );
}