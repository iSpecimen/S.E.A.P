import React, { createContext, useContext, useCallback, useState, useEffect } from "react";


//Context creates a shared data layer that both components can read and write to
// SimTab tells context to "switch to tab X" and MainPage reads context to get tab X's data
// createContext makes a container a child component can tap into
//useSim is a custom hook - simpler for child components because they don't have to
// write useContext(SimulationContext) every time (convenience shortcut)
const SimulationContext = createContext();
export const useSimulation = () => useContext(SimulationContext);

//Stamps out initial state for a new simulation
const createSimState = (config = {}) => ({
    //Runways dynamically generated from user input
    runways: config.runways || [{ id: 1, name: "Runway 1", mode: "Mixed", status: "AVAILABLE" },
    { id: 2, name: "Runway 2", mode: "Mixed", status: "AVAILABLE" },

    ],

    //Queues - start empty, then they are later populated by the backend
    takeoffQueue: config.takeoffQueue || [],
    holdingPattern: config.holdingPattern || [],

    //Output panels
    cancellations: config.cancellations || [],
    statistics: config.statistics || {},


    //Timeline 
    timelineSec: 0,
    playState: "paused", //"paused"| "playing"

}

);


//Wrapper component that holds all the simulation data
//'simulations' is a dictionary, where each key is a tab ID, each value is that tab's full sim state
// 'activeTabID' tracks which tab the user's looking at
// 'activeSim' look's up the current tab's data from the dictionary
// Switching tabs is very easy because all the data's in one place
export function SimulationProvider({ children }) {
    const [simulations, setSimulations] = useState({});
    const [activeTabID, setActiveTabID] = useState(null);

    const activeSim = activeTabID ? simulations[activeTabID] : null;

    //Called by SimulationTab when "+ New Simulation" is clicked
    const createSimulation = useCallback((tabID, config) => {
        setSimulations((prev) => ({
            ...prev,
            [tabID]: createSimState(config),


        }));
        setActiveTabID(tabID);
    }, []);

    //Called when copy config clicked
    //Deep copies the simulation's entire state using JSON.parse(JSON.stringify(...))
    //Copy starts identical to the original, changes only affect the copy
    //Allows you to test alternative runway settings without losing the original
    const duplicateSimulation = useCallback(
        (sourceTabID, newTabID) => {
            setSimulations((prev) => {
                const source = prev[sourceTabID];
                if (!source) return prev;
                return {
                    ...prev,

                    //Deep copy- changes to the copy don't affect the original
                    [newTabID]: JSON.parse(JSON.stringify(source)),

                };
            });
            setActiveTabID(newTabID);
        },
        []
    );

    // Called when switching tabs
    const switchTab = useCallback((tabID) => {
        setActiveTabID(tabID);
    }, []);

    // Called when closing a tab
    const removeSimulation = useCallback((tabID) => {
        setSimulations((prev) => {
            const next = { ...prev };
            delete next[tabID];
            return next;
        });
    }, []);

    //Only updates active simulation's data 
    //togglePlayPause flips between 'playing' and 'paused'

    const togglePlayPause = useCallback(() => {
        if (!activeTabID) return;
        setSimulations((prev) => ({
            ...prev,
            //Only modifies those with activeTabID, other tabs left untouched
            [activeTabID]: {
                ...prev[activeTabID],
                playState: prev[activeTabID].playState === "playing" ? "paused" : "playing",

            },
        }));
    }, [activeTabID]);

    //Changes a specific runway's mode/status when user picks from RunwayCard dropdowns

    const updateRunway = useCallback((runwayID, changes) => {
        if (!activeTabID) return;
        setSimulations((prev) => ({
            ...prev,
            [activeTabID]: {
                ...prev[activeTabID],
                runways: prev[activeTabID].runways.map((r) =>
                    r.id === runwayID ? { ...r, ...changes } : r
                ),
            },
        }));
    }, [activeTabID]);

    return (
        <SimulationContext.Provider
            value={{
                simulations, //Full dictionary
                activeTabID, //current tab ID
                activeSim, //current tab's data (most used)
                createSimulation, //SimulationTab calls this
                duplicateSimulation,
                switchTab,
                removeSimulation,
                togglePlayPause,  //Timeline calls this
                updateRunway, //RunwayCard calls this

            }}
        >{children}</SimulationContext.Provider>
    );

}

