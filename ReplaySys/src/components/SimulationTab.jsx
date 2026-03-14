import React, { useCallback } from "react";
import "./SimulationTab.css";
import { useSimulation } from "../context/SimulationContext";

/**
 * SimulationTab – Tab bar component for managing multiple simulations.
 * Renders a horizontal row of tabs, each representing a simulation or
 * configuration copy, plus action buttons for creating new simulations
 * and duplicating configs.
 *
 * Data source: Reads entirely from SimulationContext:
 *   - simulations: dictionary of all tab states (keyed by version string)
 *   - activeTabID: currently selected tab
 *   - labelMap: display labels ({ simNumber, copyNumber } per tab)
 *
 * Tab types:
 *   - Root simulations: labelled "Simulation 1", "Simulation 2", etc.
 *   - Config copies: labelled "Simulation 1.1", "Simulation 1.2", etc.
 *     Created via "Copy Config" which deep-clones the active simulation.
 *
 * Each tab shows:
 *   - A coloured dot (green = playing, amber = paused)
 *   - The simulation label
 *   - A close button (×) that handles tab cleanup and auto-switching
 *
 * Actions:
 *   - "Copy Config": Deep-copies the active tab's state into a new tab,
 *     allowing the user to test alternative runway configs side-by-side.
 *   - "+ New Simulation": Clears activeTabID so App.jsx renders StartPage,
 *     letting the user input fresh parameters for a brand new simulation.
 */
export default function SimulationTab() {
  const {
    simulations,
    activeTabID,
    labelMap,
    switchTab,
    removeSimulation,
    duplicateSimulation,
    requestNewSimulation,
  } = useSimulation();

  const tabIDs = Object.keys(simulations);

  // Build display label from labelMap: handles root sims and config copies
  const getLabel = (tabID) => {
    const info = labelMap[tabID];
    if (!info) {
      const sim = simulations[tabID];
      if (sim?.loading) return "Loading...";
      return "Simulation";
    }
    if (info.copyNumber != null) {
      return `Simulation ${info.simNumber}.${info.copyNumber}`;
    }
    return `Simulation ${info.simNumber}`;
  };

  const activate = useCallback(
    (id) => switchTab(id),
    [switchTab]
  );

  // Clears activeTabID, App.jsx renders StartPage, then user enters new config.
  // The sim counter increments in context's createSimulation when submitted.
  const addSimulation = useCallback(() => {
    requestNewSimulation();
  }, [requestNewSimulation]);

  // Deep-copies the active simulation into a new tab.
  // Label assignment (X.1, X.2) handled by context's duplicateSimulation.
  const copyConfig = useCallback(() => {
    if (!activeTabID) return;
    const newID = `${activeTabID}_copy_${Date.now()}`;
    duplicateSimulation(activeTabID, newID);
  }, [activeTabID, duplicateSimulation]);

  // Close a tab: auto-switches to nearest remaining tab,
  // or returns to StartPage if no tabs are left.
  const closeTab = useCallback(
    (id) => {
      const remaining = tabIDs.filter((k) => k !== id);
      if (remaining.length === 0) {
        removeSimulation(id);
        requestNewSimulation();
      } else {
        if (activeTabID === id) {
          const idx = tabIDs.indexOf(id);
          const next = remaining[Math.min(idx, remaining.length - 1)];
          switchTab(next);
        }
        removeSimulation(id);
      }
    },
    [tabIDs, activeTabID, removeSimulation, switchTab, requestNewSimulation]
  );

  return (
    <div className="SimTabWrapper">
      <div className="SimTabBar">
        {/* Scrollable tab row */}
        <div className="SimTabScroll">
          {tabIDs.map((tabID) => {
            const isActive = tabID === activeTabID;
            const sim = simulations[tabID];
            const isPlaying = sim?.playState === "playing";
            const isCopy = labelMap[tabID]?.copyNumber != null;

            return (
              <button
                key={tabID}
                className={`SimTab ${isActive ? "SimTabActive" : ""} ${isCopy ? "SimTabConfig" : ""}`}
                onClick={() => activate(tabID)}
                title={getLabel(tabID)}
              >
                {/* Play state indicator dot */}
                <span
                  className={`SimTabDot ${
                    isPlaying ? "SimTabDotPlaying" : "SimTabDotPaused"
                  }`}
                />
                <span className="SimTabLabel">{getLabel(tabID)}</span>
                {/* Close button */}
                <span
                  className="SimTabClose"
                  role="button"
                  tabIndex={0}
                  aria-label={`Close ${getLabel(tabID)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabID);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      closeTab(tabID);
                    }
                  }}
                >
                  ×
                </span>
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="SimTabActions">
          <button className="SimTabButtonCopy" onClick={copyConfig}>
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