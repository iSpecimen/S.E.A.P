import React, { useState } from "react";
import "./MainPage.css";
import Timeline from "../components/Timeline";
import Cancellations from "../components/Cancellations";
import ArrivalsDepartures from "../components/ArrivalsDepartures";
import RunwayCard from "../components/RunwayCard";
import TakeoffQueue from "../components/TakeoffQueue";
import HoldingPattern from "../components/HoldingPattern";
import Statistics from "../components/Statistics";
import SimulationTab from "../components/SimulationTab";
import { useSimulation } from "../context/SimulationContext";

/**
 * MainPage: Composes all major UI components into a three-column layout:
 *
 *   Left sidebar:TakeoffQueue + HoldingPattern (with emergency toggle)
 *   Centre: Runway legend, RunwayCard grid, Commit button, Timeline
 *   Right sidebar: Cancellations feed + Statistics panel
 *   Sliding panel: ArrivalsDepartures (toggled via ◀/▶ button)
 *
 * Data flow:
 *   All data comes from SimulationContext via the activeSim object.
 *   MainPage acts as the wiring layer that connects context state to components.
 *
 * User interactions handled here:
 *   - Commit Changes button: sends pending runway/plane/wait time edits to backend
 *   - Emergency toggle: passed to HoldingPattern
 *   - Max wait config: passed to Statistics
 *   - Arrivals/Departures: derived from planes currently on runways
 *
 */
const MainPage = () => {
    // Pull all needed state and actions from context
    const { activeSim, seekToTick, commitRunwayChanges, updatePlane, updateHPTQ, committing } = useSimulation();

    // Toggle state for the sliding arrivals/departures sidebar
    const [showArrDep, setShowArrDep] = useState(false);

    // GETTING STATE FROM CONTEXT
    const runways = activeSim?.runways || [];
    const takeoffQueue = activeSim?.takeoffQueue || [];
    const holdingPattern = activeSim?.holdingPattern || [];
    const cancellations = activeSim?.cancellations || { totalCancelled: 0, totalDiverted: 0, events: [] };
    const statistics = activeSim?.statistics || {};
    const maxWaitConfig = activeSim?.maxWaitConfig || { maxWaitTakeoff: 30, maxWaitHolding: 30 };

    // Route threshold changes to context's updateHPTQ (stores in pendingHPTQChanges)
    const handlemaxWaitConfigChange = (newConfig) => {
        updateHPTQ(newConfig);
    };

    // Check if user has any uncommitted edits (controls commit button enabled state)
    const hasPendingChanges =
        Object.keys(activeSim?.pendingRunwayChanges || {}).length > 0 ||
        Object.keys(activeSim?.pendingPlaneChanges || {}).length > 0 ||
        Object.keys(activeSim?.pendingHPTQChanges || {}).length > 0;

    // LOADING / ERROR STATES
    if (activeSim?.loading) return <div className="loading">Running simulation...</div>;
    if (activeSim?.error) return <div className="error">{activeSim.error}</div>;
    if (!activeSim?.stateLog) return <div>Create a simulation to begin.</div>;

    /** Format seconds since midnight as HH:MM for arrivals/departures table */
    function formatSecondsToTime(totalSeconds) {
        if (totalSeconds == null) return "--:--";
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    return (
        <div className="mainPage">
            {/* Commit overlay: shown while backend processes config changes */}
            {committing && (
                <div className="commitOverlay">
                    <div className="commitPopup">
                        <div className="commitSpinner" />
                        <p>Opening a new tab with your configs...</p>
                    </div>
                </div>
            )}

            {/* TAB BAR */}
            <header className="tabBar">
                <SimulationTab />
            </header>

            {/* MAIN CONTENT (three-column layout) */}
            <div className="mainBody">

                {/* LEFT SIDEBAR: Flight queues*/}
                <div className="leftSidebar">
                    <TakeoffQueue flights={takeoffQueue} />
                    <HoldingPattern
                        flights={holdingPattern}
                        onEmergencyToggle={(callsign, isEmergency) => {
                            updatePlane(callsign, { isEmergency });
                        }}
                    />
                </div>

                {/* CENTRE: Runways + Controls + Timeline */}
                <main className="centre">
                    {/* Colour legend mapping runway modes to their border colours */}
                    <div className="runwayLegend">
                        <span className="legendItem">
                            <span className="legendDot" style={{ backgroundColor: '#96711E' }} />
                            Take-off
                        </span>
                        <span className="legendItem">
                            <span className="legendDot" style={{ backgroundColor: '#265EA8' }} />
                            Landing
                        </span>
                        <span className="legendItem">
                            <span className="legendDot" style={{ backgroundColor: '#9B59B6' }} />
                            Mixed
                        </span>
                        <span className="legendItem">
                            <span className="legendDot" style={{ backgroundColor: '#A0A0A0' }} />
                            Unavailable
                        </span>
                    </div>

                    {/* Runway cards: rendered dynamically so each tab has its own config */}
                    <div className="runwayGrid">
                        {runways.map((rw) => (
                            <RunwayCard
                                key={rw.id}
                                runwayID={rw.id}
                                runwayName={rw.name}
                                callSign={rw.callsign || "N/A"}
                                initialMode={rw.mode}
                                initialStatus={rw.status}
                            />
                        ))}
                    </div>

                    {/* Commit button: disabled during playback or when no edits pending */}
                    <div style={{ textAlign: 'center' }}>
                        <button
                            className="commitChangesBtn"
                            disabled={activeSim?.playState === "playing" || !hasPendingChanges}
                            onClick={() => commitRunwayChanges()}
                        >
                            Commit Changes
                        </button>
                    </div>

                    {/* Timeline controller — seekToTick provides O(1) scrubbing */}
                    <div className="timeline">
                        <Timeline />
                    </div>
                </main>

                {/* ─── RIGHT SIDEBAR: Cancellations + Statistics ────── */}
                <section className="rightSidebar">
                    <div className="Cancellations">
                        <Cancellations
                            events={cancellations.events}
                            totalCancelled={cancellations.totalCancelled}
                            totalDiverted={cancellations.totalDiverted}
                        />
                    </div>
                    <div className="Statistics">
                        <Statistics
                            maxWaitConfig={maxWaitConfig}
                            onMaxWaitConfigChange={handlemaxWaitConfigChange}
                            maxInTakeoff={statistics.max_tqueue_size}
                            maxInHolding={statistics.max_hqueue_size}
                            avgWaitTakeoff={statistics.avg_tqueue_wait}
                            avgWaitHolding={statistics.avg_hqueue_wait}
                            avgDelayTakeoff={statistics.avg_tqueue_delay}
                            avgDelayArrival={statistics.avg_hqueue_delay}
                            maxDelayTakeoff={statistics.max_tqueue_delay}
                            maxDelayHolding={statistics.max_hqueue_delay}
                            totalCancelled={cancellations.totalCancelled}
                            totalDiverted={cancellations.totalDiverted}
                        />
                    </div>
                </section>

                {/* ─── ARRIVALS/DEPARTURES SLIDING PANEL ────────────── */}
                <button className="arrDepToggle" onClick={() => setShowArrDep(!showArrDep)}>
                    {showArrDep ? "▶" : "◀"}
                </button>
                <aside className={`arrDepSidebar ${showArrDep ? "open" : ""}`}>
                    <div className="arrivalsDepartures">
                        {/* Derived from planes currently occupying runways,
                            split by origin: SEAP = departure, other = arrival */}
                        <ArrivalsDepartures
                            departures={runways
                                .map((rw) => rw.plane)
                                .filter((p) => p && p.origin === "SEAP")
                                .map((p, i) => ({
                                    id: i,
                                    callsign: p.callsign,
                                    destination: p.destination,
                                    time: formatSecondsToTime(p._scheduled_time),
                                }))}
                            arrivals={runways
                                .map((rw) => rw.plane)
                                .filter((p) => p && p.origin !== "SEAP")
                                .map((p, i) => ({
                                    id: i,
                                    callsign: p.callsign,
                                    origin: p.origin,
                                    time: formatSecondsToTime(p._scheduled_time),
                                }))}
                        />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MainPage;