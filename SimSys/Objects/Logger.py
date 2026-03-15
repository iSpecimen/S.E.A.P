"""
Handles JSON file streaming, log compression, and event tracking for the simulation backend.
"""

from operator import attrgetter
from typing import Any
from .HoldingPatternQueue import HoldingPatternQueue
from .TakeOffQueue import TakeOffQueue
from .runway_class import Runway
import json
from pathlib import Path
from datetime import datetime
import uuid
import gzip
import shutil

DELETE_LOGS : bool = False

class Logger:
    """Records simulation states and events, writing them sequentially to .jsonl files."""
    
    def __init__(self, sim_name: str) -> None:
        """Initializes schemas, file paths, and file writer objects for state and event logs."""
        self.sim_name: str = sim_name
        self.__plane_schema : tuple[str, ...] = ("callsign","operator","origin","destination", "_scheduled_time","_altitude","_fuel_seconds","_ground_speed","_delayed","_emergency")
        self.__HoldingQueue : tuple[str, ...] = ("base_altitude", "planes")
        self.__TakeoffQueue : tuple[str, ...] = ("planes",)
        self.__runways : tuple[str, ...] = ("runways",)
        self.__runwaySchema : tuple[str, ...] = ("mode", "status", "plane", "bearing", "number", "expected_free_time")

        self.__plane_get = attrgetter(*self.__plane_schema)
        self.__runway_attr_get = attrgetter(
            "mode", "status", "bearing", "number", "expected_free_time"
        )   
        
        self.run_id: str = f"{self.sim_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        log_dir: Path = Path("logs")
        log_dir.mkdir(exist_ok=True)
        self._file_name: str = f"state_{self.run_id}.jsonl"
        self._file_path: Path = log_dir / self._file_name
        self._file__path_event: Path = log_dir / f"event_{self.run_id}.jsonl"
        self._file_log = Path(self._file_path).open("w", encoding="utf-8")
        self._file_log.write("[")
        self._first_entry: bool = True
        self._file_event = Path(self._file__path_event).open("wb")

        self._log_index : list[int] = [0] * 60*60*24
        self._log_offset : int = 0
        self._last_logged_tick: int = -1
        self._dumps = json.dumps
        self._compressed: bool = False

    def get_file_data(self) -> tuple[Any, str]:
        """Returns the file path object and file name string."""
        return (self._file_path, self._file_name)
    
    def _queue_planes_as_dicts(self, q: Any) -> list[dict[str, Any]]:
        """Converts queue nodes into dictionary representations based on the plane schema."""
        rows: list[Any] = [self.__plane_get(p) for p in q.getNodeAsList(10)]
        return self.rows_to_dicts(self.__plane_schema, rows)

    @staticmethod
    def _runway_callsign(r: Runway) -> str:
        """Safely retrieves the callsign of the occupying plane."""
        return "N/A" if r.occupier is None else r.occupier.callsign

    @staticmethod
    def rows_to_dicts(schema: tuple[str, ...], rows: list[Any]) -> list[dict[str, Any]]:
        """Maps schema keys to object row values to generate JSON-compatible dictionaries."""
        return [dict(zip(schema, row)) for row in rows]

    def add_state_log(self, tick : int, holding_pattern : HoldingPatternQueue, takeoff_queue : TakeOffQueue, runways : list[Runway], cancellations: int, diversions: int, recent_events: list[dict[str, Any]]) -> None:
        """Constructs the JSON payload for the current tick and appends it to the state log."""
        self._log_index[tick] = self._log_offset

        holding_values: list[Any] = [
            holding_pattern.base_altitude,
            self._queue_planes_as_dicts(holding_pattern),
        ]

        takeoff_values: list[Any] = [
            self._queue_planes_as_dicts(takeoff_queue),
        ]

        runway_rows: list[Any] = []
        for r in runways:
            mode, status, bearing, number, expected_free_time = self.__runway_attr_get(r)
            plane = None if r.occupier is None else dict(zip(self.__plane_schema, self.__plane_get(r.occupier)))
            runway_rows.append((
                mode,
                status,
                plane,
                bearing,
                number,
                expected_free_time,
            ))

        payload: dict[str, Any] = {
            "tick": tick,
            "HoldingQueue": dict(zip(self.__HoldingQueue, holding_values)),
            "TakeoffQueue": dict(zip(self.__TakeoffQueue, takeoff_values)),
            "runways": self.rows_to_dicts(self.__runwaySchema, runway_rows),
            "cancellations": cancellations,
            "diversions": diversions,
            "events": recent_events
        }

        json_obj: str = self._dumps(payload, separators=(",", ":"))

        if not self._first_entry:
            self._file_log.write(f",\n")

        self._file_log.write(json_obj)
        self._first_entry = False
        self._last_logged_tick = tick
        
    def add_event_log(self, tick: int, log: str) -> None:
        """Formats and writes a discrete event log to the binary JSONL event file."""
        hour: int = tick // 3600
        minute: int = (tick % 3600) // 60
        second: int = tick % 60

        logStr: str = f"[{hour:02}:{minute:02}:{second:02}] {log}\n"

        line: dict[str, Any] = {"tick": tick, "event": logStr}

        encoded_line: bytes = self._dumps(line, separators=(",", ":")).encode("utf-8") + b"\n"
        self._file_event.write(encoded_line)

    def get_state_logs_as_json(self, tick : int | None = None, lower_bound : int | None = None, upper_bound : int | None = None) -> str:
        """Retrieves specific ticks or a bounded range of logs directly from the file system."""
        if self._last_logged_tick < 0:
            raise ValueError("No state logs are available.")

        self._file_log.flush()

        if tick is None and lower_bound is None and upper_bound is None:
            lower_bound = 0
            upper_bound = self._last_logged_tick

        if tick is not None and (lower_bound is not None or upper_bound is not None):
            raise ValueError("Provide either tick OR (lower_bound and upper_bound), not both.")

        if tick is not None:
            if tick < 0 or tick > self._last_logged_tick:
                raise ValueError("Tick is out of logged range.")

            start_offset: int = self._log_index[tick]
            if tick == self._last_logged_tick:
                end_offset: int = self._log_offset
            else:
                end_offset = self._log_index[tick + 1]

            with Path(self._file_path).open("rb") as file_obj:
                file_obj.seek(start_offset)
                data: bytes = file_obj.read(end_offset - start_offset)
            return data.decode("utf-8").rstrip("\n")
        else:
            if lower_bound is None or upper_bound is None:
                raise ValueError("Both lower_bound and upper_bound are required.")
            if lower_bound < 0 or upper_bound < 0 or lower_bound > upper_bound:
                raise ValueError("Invalid range.")
            if upper_bound > self._last_logged_tick:
                raise ValueError("Range exceeds logged ticks.")

            start_offset = self._log_index[lower_bound]
            if upper_bound == self._last_logged_tick:
                end_offset = self._log_offset
            else:
                end_offset = self._log_index[upper_bound + 1]

            with Path(self._file_path).open("rb") as file_obj:
                file_obj.seek(start_offset)
                data = file_obj.read(end_offset - start_offset)

            lines: list[str] = [line for line in data.decode("utf-8").splitlines() if line]
            return "[" + ",".join(lines) + "]"
        
    def finalize(self) -> None:
        """Closes file handles and compresses the state log using gzip."""
        self._file_log.write("]")
        self._file_log.close()
        self._file_event.close()

        gz_path: Path = self._file_path.with_suffix(self._file_path.suffix + ".gz")
        with open(self._file_path, "rb") as f_in:
            with gzip.open(gz_path, "wb") as f_out:
                shutil.copyfileobj(f_in, f_out)
        self._compressed = True

    def clear_log_file(self) -> None:
        """Deletes uncompressed log files if DELETE_LOGS configuration is enabled."""
        if DELETE_LOGS:
            if self._file_path.exists():
                self._file_log.close()
                self._file_event.close()
                self._file_path.unlink()
                self._file__path_event.unlink()