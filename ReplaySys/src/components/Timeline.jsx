import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import "./Timeline.css";
import { useSimulation } from "../context/SimulationContext";

const Timeline = ({ disabled = false }) => {
    const { activeSim, togglePlayPause, seekToTick, setPlaybackSpeed } = useSimulation();
    const isPlaying = activeSim?.playState === "playing";
    const currentTimeSec = activeSim?.timelineSec ?? 0;

    // Speed multiplier local state
    const [speedInput, setSpeedInput] = useState("1");
    const [activeSpeed, setActiveSpeed] = useState(1);

    // Jump-to-time local state
    const [jumpTime, setJumpTime] = useState("");

    const handleSpeedApply = () => {
        const val = Math.max(1, Math.min(100, parseInt(speedInput) || 1));
        setSpeedInput(String(val));
        setActiveSpeed(val);
        setPlaybackSpeed(val);
    };

    const handleJump = () => {
        // Parse "HH:MM:SS" or "HH:MM" or just seconds
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
            <div className="timelineTimeDisplay">
                <span className="timelineCurrentTime">{formatTime(currentTimeSec)}</span>
                <span className="timelineEndTime">{formatTime(86399)}</span>
            </div>

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

            <div className="timelineTicks">
                {TICKMARKS.map((sec) => (
                    <span key={sec} className="timelineTick">
                        {formatTimeTick(sec)}
                    </span>
                ))}
            </div>

            <div className="timelineControls">
                {/* Jump to time */}
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

                {/* Play/Pause */}
                <button className="timelineBtnPlay" onClick={togglePlayPause} disabled={disabled}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon className="playIcon" />}
                </button>

                {/* Speed multiplier */}
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

const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default Timeline;

const TICKMARKS = Array.from({ length: 13 }, (_, i) => i * 2 * 3600);

const formatTimeTick = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};