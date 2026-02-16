import React, { useState } from "react";
import "./MainPage.css";

// Declaring functional component const
const MainPage = () => {
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
                <section className= "leftSidebar">
                    <div className="TakeoffQueue">
                        
                    </div>
                    <div className="HoldingPattern">
                        
                    </div>

                </section>
                {/*Centre Card*/}
                <main className= "centre">
                    <div className="runwayGrid">

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
