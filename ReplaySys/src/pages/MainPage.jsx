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
    //Reading from context
    const { activeSim, seekToTick } = useSimulation();

    // Arrivals/Departures hook 
    const [showArrDep, setShowArrDep] = useState(false);

    // Fallbacks while no simulation is loaded
    const runways = activeSim?.runways || [];
    const takeoffQueue = activeSim?.takeoffQueue || [];
    const holdingPattern = activeSim?.holdingPattern || [];
    const cancellations = activeSim?.cancellations || [];
    const statistics = activeSim?.statistics || {};

    const [maxWaitConfig, setMaxWaitConfig] = useState({
        maxWaitTakeoff: 30,
        maxWaitHolding: 30
    });

    // BACKEND HOOK: replace body with context call e.g. updateMaxWait(newConfig)
    const handlemaxWaitConfigChange = (newConfig) => {
    setMaxWaitConfig(newConfig);
    };

    // BACKEND HOOK: replace body with context call e.g. updateEmergency(callsign, newState)
    const handleEmergencyToggle = (callsign, newState) => {
    const updateList = (list) =>
        list.map(f => f.callsign === callsign ? { ...f, isEmergency: newState } : f);
    setTakeoffFlights(prev => updateList(prev));
    setHoldingFlights(prev => updateList(prev));
    };


    //ERROR HANDLING
    if (activeSim?.loading) return <div className="loading">Running simulation...</div>;
    if (activeSim?.error) return <div className="error">{activeSim.error}</div>;
    if (!activeSim?.stateLog) return <div>Create a simulation to begin.</div>;

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
                    <TakeoffQueue 
                        flights={takeoffQueue}
                        onEmergencyToggle={handleEmergencyToggle}
                    />
                    <HoldingPattern 
                        flights={holdingPattern}
                        onEmergencyToggle={handleEmergencyToggle}
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
                    {/* SimulationContext handles everything */}
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
                            departures={takeoffQueue.map((p, i) => ({
                                id: i,
                                callsign: p.callsign,
                                destination: p.destination,
                                time: p.time,
                            }))}
                            arrivals={holdingPattern.map((p, i) => ({
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
