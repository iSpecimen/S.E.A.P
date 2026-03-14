import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import "./Timeline.css";
import { useSimulation } from "../context/SimulationContext";

/**
 * Timeline: 24-hour playback controller at the bottom of the simulation page.
 *
 * Data source: Reads playState and timelineSec from SimulationContext.
 * Controls playback via togglePlayPause() and seekToTick() from context.
 *
 * Features:
 *   - Draggable slider spanning 0–86,399 seconds (full 24-hour day)
 *   - Visual track fill showing progress through the simulation
 *   - 2-hour tick marks along the slider for time orientation
 *   - Play/Pause button toggling simulation playback
 *   - Jump-to-time input: accepts "HH:MM:SS", "HH:MM", or raw seconds,
 *     clamped to valid range. Press Enter or click "Go" to jump.
 *   - Speed multiplier: user types a value (1–100) and clicks "Set" to
 *     adjust playback speed. Stored in a ref (playbackSpeedRef) in context
 *     so the interval can read it without re-mounting. Current speed
 *     displayed as a label (e.g. "8x").
 *
 * Props:
 *   disabled: When true, the play button is greyed out (unused currently
 *             but available for future loading states).
 */
const Timeline = ({ disabled = false }) => {
    const { activeSim, togglePlayPause, seekToTick, setPlaybackSpeed } = useSimulation();
    const isPlaying = activeSim?.playState === "playing";
    const currentTimeSec = activeSim?.timelineSec ?? 0;

    // Speed: local draft + confirmed value displayed as label
    const [speedInput, setSpeedInput] = useState("1");
    const [activeSpeed, setActiveSpeed] = useState(1);

    // Jump-to-time: local input string, cleared after jump
    const [jumpTime, setJumpTime] = useState("");

    // Clamp speed to 1–100, update the context ref, and show new label
    const handleSpeedApply = () => {
        const val = Math.max(1, Math.min(100, parseInt(speedInput) || 1));
        setSpeedInput(String(val));
        setActiveSpeed(val);
        setPlaybackSpeed(val);
    };

    // Parse flexible time formats and seek to that tick
    const handleJump = () => {
        const parts = jumpTime.split(":").map(Number);
        let totalSec = 0;
        if (parts.length === 3) {
            totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            totalSec = parts[0] * 3600 + parts[1] * 60;
        } else if (parts.length === 1 && !isNaN(parts[0])) {
            totalSec = parts[0];
        }
        totalSec = Math.max(0, Math.min(86399, totalSec));
        seekToTick(totalSec);
        setJumpTime("");
    };

    const handleJumpKeyDown = (e) => {
        if (e.key === "Enter") handleJump();
    };

    return (
        <div className="timelineController">
            {/* Current time and end time labels */}
            <div className="timelineTimeDisplay">
                <span className="timelineCurrentTime">{formatTime(currentTimeSec)}</span>
                <span className="timelineEndTime">{formatTime(86399)}</span>
            </div>

            {/* Slider — custom track fill overlaid on a native range input */}
            <div className="timelineSliderWrapper">
                <div className="timelineTrack">
                    <div
                        className="timelineTrackFill"
                        style={{ width: `${(currentTimeSec / 86399) * 100}%` }}
                    />
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

            {/* 2-hour tick marks for time orientation */}
            <div className="timelineTicks">
                {TICKMARKS.map((sec) => (
                    <span key={sec} className="timelineTick">
                        {formatTimeTick(sec)}
                    </span>
                ))}
            </div>

            {/* Control row: jump input, play/pause, speed multiplier */}
            <div className="timelineControls">
                {/* Jump to specific time: accepts HH:MM:SS, HH:MM, or seconds */}
                <div className="timelineJump">
                    <input
                        type="text"
                        className="jumpInput"
                        placeholder="HH:MM:SS"
                        value={jumpTime}
                        onChange={(e) => setJumpTime(e.target.value)}
                        onKeyDown={handleJumpKeyDown}
                    />
                    <button className="jumpBtn" onClick={handleJump}>
                        Go
                    </button>
                </div>

                {/* Play/Pause toggle */}
                <button className="timelineBtnPlay" onClick={togglePlayPause} disabled={disabled}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon className="playIcon" />}
                </button>

                {/* Speed multiplier: type value, click Set, label shows current speed */}
                <div className="timelineSpeed">
                    <input
                        type="number"
                        className="speedInput"
                        min={1}
                        max={100}
                        value={speedInput}
                        onChange={(e) => setSpeedInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSpeedApply(); }}
                    />
                    <button className="speedBtn" onClick={handleSpeedApply}>
                        Set
                    </button>
                    <span className="speedLabel">{activeSpeed}x</span>
                </div>
            </div>
        </div>
    );
};

/** Format seconds as HH:MM:SS for the time display */
const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default Timeline;

/** 2-hour interval marks from 00:00 to 24:00 (13 marks) */
const TICKMARKS = Array.from({ length: 13 }, (_, i) => i * 2 * 3600);

/** Format seconds as HH:MM for the tick mark labels */
const formatTimeTick = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};