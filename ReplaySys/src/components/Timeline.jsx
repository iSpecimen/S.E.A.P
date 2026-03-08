import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef } from "react";
import "./Timeline.css"
import { useSimulation } from "../context/SimulationContext";


const Timeline = ({ disabled = false }) => {
    // Read play state and current tick FROM CONTEXT
    const { activeSim, togglePlayPause, seekToTick } = useSimulation();
    const isPlaying = activeSim?.playState === "playing";
    const currentTimeSec = activeSim?.timelineSec ?? 0;

    return (
        <div className="timelineController">
            {/*Max number of seconds in a day is 86399 */}
            <div className="timelineTimeDisplay">
                <span className="timelineCurrentTime">{formatTime(currentTimeSec)}</span>
                <span className="timelineEndTime">{formatTime(86399)}</span>
            </div>
            {/*Can control the track visually with an extra wrapper*/}
            <div className="timelineSliderWrapper">
                <div className="timelineTrack">
                    <div className="timelineTrackFill"
                        style={{ width: `${(currentTimeSec / 86399) * 100}%` }} />
                </div>
                <input
                    type="range"
                    min={0}
                    max={86399}
                    value={currentTimeSec}
                    onChange={(e) => seekToTick(Number(e.target.value))}
                    className="timelineSlider"
                />
            </div>
            <div className="timelineTicks">
                {TICKMARKS.map((sec) => (
                    <span key={sec} className="timelineTick">
                        {formatTimeTick(sec)}
                    </span>
                ))}
            </div>
            <div className="timelineControls">
                <button className="timelineBtnPlay" onClick={togglePlayPause} disabled={disabled}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon className="playIcon" />}
                </button>
            </div>
        </div>
    );
};

// Seconds TO Minutes to Hours helper
const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
export default Timeline;

// These are the marks along the timeline slider so the user has a sense of where they are
const TICKMARKS = Array.from({ length: 12 }, (_, i) => i * 2 * 3600);

// Seconds to minute to hour conversions
const formatTimeTick = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};