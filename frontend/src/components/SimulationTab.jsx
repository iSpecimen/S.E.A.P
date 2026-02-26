import React, { useState, useCallback, useEffect } from "react";
import "./SimulationTab.css";
import { useSimulation } from "../context/SimulationContext";
//Each tab needs a unique key
// This helper combines a timestamp with a counter so IDs never collide
let id = 0;
const uid = () => `sim-${Date.now()}-${++id}`;

// This function creates tabs with properties ID, label, parentID, state, and created time
// If parentID=null, then it's a root simulation
// Otherwise, it's a configuration copy
const createTab = (label, parentID = null) => ({
  id: uid(),
  label,
  parentID,
  state: "paused",
  createdAt: Date.now(),
});




export default function SimulationTab({
  onNewSimulation,
  onTabChange,
  onCloseTab, }) {

  const { createSimulation,
    duplicateSimulation,
    switchTab,
    removeSimulation,

  } = useSimulation();

  //Initialise state with one active tab
  const [tabs, setTabs] = useState(() => { return [createTab("Simulation 1")]; });
  const [activeID, setActiveID] = useState(tabs[0].id);

  // Register first tab
  useEffect(() => {
    createSimulation(tabs[0].id);
  }, []);  // run once


  //Derived values so you don't need an extra state
  const activeTab = tabs.find((t) => t.id === activeID);
  const simCount = tabs.filter((t) => !t.parentID).length;


  //Tab activation handler
  //Updates local active ID and tells the context to switch

  const activate = useCallback(
    (id) => {
      setActiveID(id); //local: update tab styling
      switchTab(id); //Context: switch simulation data
    },
    [switchTab]
  );

  //Clicking + New Simulation creates a root tab with no parentID
  //Should also navigate back to the start page so the user can enter new runway/flow parameters
  const addSimulation = useCallback(() => {
    const next = createTab(`Simulation ${simCount + 1}`);
    setTabs((prev) => [...prev, next]);
    activate(next.id);
    createSimulation(next.id);

  }, [simCount, activate, createSimulation])


  // When you pause and change runway settings, clicking Play duplicates current sim into a new tab
  // The copy's parentID is the same as the root simulation
  // Label shows which config number it is
  const duplicateAsConfig = useCallback(() => {
    if (!activeTab) return;
    // Always trace back to the root simulation
    const rootID = activeTab.parentID ?? activeTab.id;
    const rootLabel = tabs.find((t) => t.id === rootID)?.label ?? activeTab.label;
    // Counts existing copies to find the new one
    const copyCount = tabs.filter(
      (t) => t.parentID === rootID
    ).length;
    const next = createTab(
      `${rootLabel} Config ${copyCount + 1}`, rootID
    )
    setTabs((prev) => [...prev, next]);
    activate(next.id);
    duplicateSimulation(activeID, next.id); //deep-copy

  }, [activeTab, tabs, activate, duplicateSimulation])

  // Handles when tab is closed
  // If you close the tab and there's only one tab open - a new tab is auto opened
  // Otherwise, the nearest remaining tab is selected
  const closeTab = useCallback(
    (id) => {
      setTabs((prev) => {
        const remaining = prev.filter((t) => t.id !== id);
        if (remaining.length === 0) {
          //Never leaves the bar empty
          const fresh = createTab("Simulation 1");
          setActiveID(fresh.id);
          switchTab(fresh.id);
          createSimulation(fresh.id);
          return[fresh];
        }
        if (activeID === id) {
          //Selects nearest neighbour
          const idx = prev.findIndex((t) => t.id === id);
          const next = remaining[Math.min(idx, remaining.length - 1)];
          setActiveID(next.id);
          switchTab(next.id);


        }
        return remaining;
      });
      removeSimulation(id);

    },
    [activeID, onCloseTab, createSimulation, removeSimulation]
  );

  // Toggles play/pause button
  const togglePlayPause = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? {
            ...t,
            state:
              t.state === "playing"
                ? "paused"
                : "playing",
          }
          : t
      )
    );
  }, [activeID]);
  return (
    <div className="SimTabWrapper">
      {/* Tab bar */}
      <div className="SimTabBar">
        <div className="SimTabScroll">
          {tabs.map((tab) => {
            const isActive = tab.id === activeID;
            const isConfig = !!tab.parentId;
            //Renders each tab as a button
            // Active tabs get a highlighted style
            // Config copies get an italic label
            // Bar scrolls horizontally when there's many tabs
            return (
              <button
                key={tab.id}
                className={`SimTab ${isActive ? "SimTabActive" : ""} ${isConfig ? "SimTabConfig" : ""
                  }`}
                onClick={() => activate(tab.id)}
                title={tab.label}
              >
                {/* status dot (green = playing, amber = paused) */}
                <span
                  className={`SimTabDot ${tab.state === "playing" ? "SimTabDotPlaying" : "SimTabDotPaused"
                    }`}
                />

                <span className="SimTabLabel">{tab.label}</span>

                {/* close button */}
                <span
                  className="SimTabClose"
                  role="button"
                  tabIndex={0}
                  aria-label={`Close ${tab.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }
                  }}
                >
                  × {/*This is to close */}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action buttons (to create a copy, and a fresh simulation)*/}
        <div className="SimTabActions">
          <button className="SimTabButtonCopy" onClick={duplicateAsConfig}>
            Copy Config
          </button>
          <button className="SimTabButtonNew" onClick={addSimulation}>
            + New Simulation
          </button>
        </div>
      </div>


    </div>
  );
}





