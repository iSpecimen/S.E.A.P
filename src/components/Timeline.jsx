import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import "./Timeline.css"


const Timeline = ({ onTimeChange,
    onPlayStateChange,
    initialTime = 0,
    disabled = false }) => {
    //Track where we are in the 24-hour day in seconds
    const [currentTimeSec, setCurrentTimeSec] = useState(initialTime);
    const [isPlaying, setIsPlaying] = useState(false);
    //Stores interval ID 
    // Ref rather than state so that changing it doesn't cause a re-render
    const intervalID = useRef(null);
    const handlePlayPause = () => {
        if (isPlaying) {
            //Stop the clock
            clearInterval(intervalID.current);
            intervalID.current = null;
            setIsPlaying(false);
        }
        else {
            //Use the functional form of the setter rather than reading currentTimeSec directly
            // Functional form always gets the latest value, not the one made at creation
            intervalID.current = setInterval(() => {
                setCurrentTimeSec((prev) => {
                    if (prev >= 86399) {
                        clearInterval(intervalID.current);
                        intervalID.current = null;
                        setIsPlaying(false);
                        return 86399;
                    }
                    return prev + 1;
                });
            }, 1000);
            setIsPlaying(true);
        }
    }
    //Tells parent component about time changes, so the simulation can fetch the right the right log values at the right times
    useEffect(() => {
        if (onTimeChange) onTimeChange(currentTimeSec);
    }, [currentTimeSec]);

    //Parent notified so that the simulation will know when the lock/unlock runway mode changes
    useEffect(() => {
        if (onPlayStateChange) onPlayStateChange(isPlaying);
    }, [isPlaying]);


    //Cleanup function - undoes what the last function did
    useEffect(() => {
        return () => {
            if (intervalID.current) clearInterval(intervalID.current);
        };
    }, []);



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
                    onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
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
            <button className="timelineBtnPlay" onClick={handlePlayPause}>
                {isPlaying ? <PauseIcon /> : <PlayIcon className="playIcon" />}
            </button>
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




//These are the marks along the timeline slider so the user has a sense of where they are
const TICKMARKS = Array.from({ length: 12 }, (_, i) => i * 2 * 3600);



//Seconds to minute to hour conversions
const formatTimeTick = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};