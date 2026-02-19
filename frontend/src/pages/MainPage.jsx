import React, { useState } from "react";
import "./MainPage.css";

import RunwayCard from "../components/RunwayCard.jsx";
import TakeoffQueue from "../components/TakeoffQueue.jsx";
import HoldingPattern from "../components/HoldingPattern.jsx";


// Declaring functional component const
const MainPage = () => {
    // Mock data for the Take-off Queue
    const [takeoffFlights, setTakeoffFlights] = useState([
        { callsign: 'MX123', destination: 'LONDON', time: '12:45' },
        { callsign: 'UA990', destination: 'NEW YORK', time: '13:10' },
        { callsign: 'AF442', destination: 'PARIS', time: '13:25' },
        { callsign: 'LH101', destination: 'BERLIN', time: '13:40' },
    ]);

    // Mock data for the Holding Pattern
    const [holdingFlights, setHoldingFlights] = useState([
        { callsign: 'CS261', origin: 'LISBON', time: '06:50' },
        { callsign: 'QA332', origin: 'DOHA', time: '07:15' },
    ]);
    
    // Arrivals/Departures hook 
    const [showArrDep, setShowArrDep] = useState(false);
    return (
        <div className= "mainPage">
            {/*Tab Bar - Simulation Tab Component */}
            <header className = "tabBar">

            </header>
            {/*Main Content*/}
            <div className= "mainBody">
                {/*Left Side*/}
                <div className= "leftSidebar">         
                    <TakeoffQueue flights={takeoffFlights} />
                    <HoldingPattern flights={holdingFlights} />
                </div>
                {/*Centre Card*/}
                <main className= "centre">
                    <div className="runwayGrid">
                        {/* mock up */}
                        <RunwayCard runwayName="Runway 1" initialMode="Take-off" fuelLevel={100} hoverInfo="CALL-SIGN:124 ORIGIN: BKK" />
                        <RunwayCard runwayName="Runway 2" initialMode="Mixed" />
                        <RunwayCard runwayName="Runway 3" initialMode="Landing" />
                        <RunwayCard runwayName="Runway 4" initialMode="Mixed" />
                    </div>
                    <div className="timeline">

                    </div>
                </main>

                {/*Right Side*/}
                <section className="rightSidebar">
                    <div className="Cancellations">
                        
                    </div>
                    <div className="Statistics">
                        
                    </div>
                </section>

                <button className="arrDepToggle" onClick={() => setShowArrDep(!showArrDep)}>
                    {showArrDep ? "▶" : "◀"}

                </button>
                <aside className={`arrDepSidebar ${showArrDep ? "open" : ""}`}>
                    <div className="arrivalsDepartures">

                    </div>
                </aside>
            </div>


        </div>
    );

};
export default MainPage;
