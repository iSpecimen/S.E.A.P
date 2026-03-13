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

// Declaring functional component const
const MainPage = () => {
    const ctx = useSimulation();
    console.log("ALL CONTEXT KEYS:", Object.keys(ctx));
    console.log("commitRunwayChanges is:", typeof ctx.commitRunwayChanges);

    //Reading from context
    const { activeSim, seekToTick, commitRunwayChanges, updatePlane, updateHPTQ } = useSimulation();

    // Arrivals/Departures hook 
    const [showArrDep, setShowArrDep] = useState(false);

    // Fallbacks while no simulation is loaded
    const runways = activeSim?.runways || [];
    const takeoffQueue = activeSim?.takeoffQueue || [];
    const holdingPattern = activeSim?.holdingPattern || [];
    const cancellations = activeSim?.cancellations || [];
    const statistics = activeSim?.statistics || {};

    const maxWaitConfig = activeSim?.maxWaitConfig || { maxWaitTakeoff: 30, maxWaitHolding: 30 };

    const handlemaxWaitConfigChange = (newConfig) => {
        updateHPTQ(newConfig);
    };

    // BACKEND HOOK: replace body with context call e.g. updateEmergency(callsign, newState)
    const handleEmergencyToggle = (callsign, newState) => {
        updatePlane(callsign, { isEmergency: newState });
    };


    //ERROR HANDLING
    if (activeSim?.loading) return <div className="loading">Running simulation...</div>;
    if (activeSim?.error) return <div className="error">{activeSim.error}</div>;
    if (!activeSim?.stateLog) return <div>Create a simulation to begin.</div>;

    console.log("playState:", activeSim?.playState);
    console.log("major:", activeSim?.major, "minor:", activeSim?.minor);
    return (
        <div className="mainPage">
            {/*Tab Bar - Simulation Tab Component */}
            <header className="tabBar">
                <SimulationTab
                    onTabChange={(id) => console.log("Switched to tab:", id)}
                    onNewSimulation={() => console.log("New simulation requested")}
                    onCloseTab={(id) => console.log("Closed tab:", id)}
                />

            </header>

            {/*Main Content*/}
            <div className="mainBody">
                {/*Left Side*/}
                <div className="leftSidebar">
                    {/* No emergency toggle for takeoff queue */}
                    <TakeoffQueue flights={takeoffQueue} />

                    {/* Emergency toggle only for holding pattern */}
                    <HoldingPattern
                        flights={holdingPattern}
                        onEmergencyToggle={(callsign, isEmergency) => {
                            updatePlane(callsign, { isEmergency });
                        }}
                    />
                </div>


                {/*Centre Card*/}
                <main className="centre">
                    {/* Runway Mode Legend */}
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
                    <div className="runwayGrid">
                        {/*Runways render dynamically with .map(), so each tab has its own runway config*/}
                        {runways.map((rw) => (
                            <RunwayCard
                                key={rw.id}
                                runwayID={rw.id}
                                runwayName={rw.name}
                                callSign={rw.callsign || "N/A"}
                                initialMode={rw.mode}
                                initialStatus={rw.status}
                            />))}
                    </div>
                    {/* New commit button */}
                    {/* In MainPage.jsx, replace the bare button with: */}
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <button
                            className="commitChangesBtn"
                            disabled={activeSim?.playState === "playing"}
                            onClick={() => {
                                console.log("BUTTON CLICKED");
                                commitRunwayChanges();
                            }}
                        >
                            Commit Changes
                        </button>
                    </div>
                    {/*Every time it ticks (or the user drags the slider), it calls onTimeChange(newSecond).
                    We pass seekToTick as that callback.
                    seekToTick indexes into stateLog[newSecond] and
                    updates runways/takeoffQueue/holdingPattern,
                    which causes all the components above to re-render with the correct data for that second. */}
                    <div className="timeline">
                        <Timeline />
                    </div>
                </main>

                {/*Right Side*/}
                <section className="rightSidebar">
                    <div className="Cancellations">
                        <Cancellations events={activeSim?.cancellations || []}></Cancellations>

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
                        />
                    </div>
                </section>

                <button className="arrDepToggle" onClick={() => setShowArrDep(!showArrDep)}>
                    {showArrDep ? "▶" : "◀"}

                </button>
                <aside className={`arrDepSidebar ${showArrDep ? "open" : ""}`}>
                    <div className="arrivalsDepartures">

                        <ArrivalsDepartures
                            departures={runways
                                .map((rw) => rw.plane)
                                .filter((p) => p && p.origin === "SEAP")
                                .map((p, i) => ({
                                    id: i,
                                    callsign: p.callsign,
                                    destination: p.destination,
                                    time: p.time,
                                }))}
                            arrivals={runways
                                .map((rw) => rw.plane)
                                .filter((p) => p && p.origin !== "SEAP")
                                .map((p, i) => ({
                                    id: i,
                                    callsign: p.callsign,
                                    origin: p.origin,
                                    time: p.time,
                                }))}
                        />
                    </div>
                </aside>
            </div>


        </div>
    );

};
export default MainPage;
