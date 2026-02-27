from operator import attrgetter
from .HoldingPatternQueue import HoldingPatternQueue
from .TakeOffQueue import TakeOffQueue
from .runway_class import Runway
import json
from pathlib import Path
from datetime import datetime
import uuid

class Logger:
    def __init__(self, sim_name: str):  # Added sim_name str for multi-sim handling, "1.0, 1.1, 2.0.. etc"
        self.sim_name = sim_name
        #schemas
        self.__plane_schema : tuple = ("callsign","operator","origin","destination", "_scheduled_time","_altitude","_fuel_seconds","_ground_speed","_delayed","_emergency")
        self.__HoldingQueue : tuple = ("base_altitude", "planes") #planeIDs will be in queue order
        self.__TakeoffQueue : tuple = ("planes",) #planeIDs will be in queue order
        self.__runways : tuple = ("runways",) #will just hold array of runways
        self.__runwaySchema : tuple = ("mode", "status", "callsigns", "bearing", "number", "expected_free_time") # for each runway

        self.__plane_get = attrgetter(*self.__plane_schema)
        self.__runway_attr_get = attrgetter(
            "mode", "status", "bearing", "number", "expected_free_time"
        )   
        
        # Added sim_name to be included run_id, easier to reference json file in SystemController
        self.run_id = f"{self.sim_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        self._file_path = log_dir / f"state_{self.run_id}.jsonl"
        self._file__path_event = log_dir / f"event_{self.run_id}.jsonl"
        self._file_log = Path(self._file_path).open("wb")
        self._file_event = Path(self._file__path_event).open("wb")

        self._log_index : list = [0] * 60*60*24
        self._log_offset : int = 0
        self._last_logged_tick: int = -1
        self._dumps = json.dumps

    def _queue_planes_as_dicts(self, q):
        rows = [self.__plane_get(p) for p in q.getNodeAsList()]
        return self.rows_to_dicts(self.__plane_schema, rows)

    @staticmethod
    def _runway_callsign(r) -> str:
        return "N/A" if r.occupier is None else r.occupier.callsign

    @staticmethod
    def rows_to_dicts(schema, rows):
        return [dict(zip(schema, row)) for row in rows]

    #Note: differs from UML because creating many dictionaries at runtime is resource intensive
    def add_state_log(self, tick : int, holding_pattern : HoldingPatternQueue, takeoff_queue : TakeOffQueue, runways : list[Runway]):
        self._log_index[tick] = self._log_offset

        holding_values = [
            holding_pattern.base_altitude,
            self._queue_planes_as_dicts(holding_pattern),
        ]

        takeoff_values = [
            self._queue_planes_as_dicts(takeoff_queue),
        ]

        runway_rows = []
        for r in runways:
            mode, status, bearing, number, expected_free_time = self.__runway_attr_get(r)
            runway_rows.append((
                mode,
                status,
                self._runway_callsign(r),
                bearing,
                number,
                expected_free_time,
            ))

        payload = {
            "tick": tick,

            "HoldingQueue": dict(zip(self.__HoldingQueue, holding_values)),

            "TakeoffQueue": dict(zip(self.__TakeoffQueue, takeoff_values)),

            "runways": self.rows_to_dicts(self.__runwaySchema, runway_rows),
        }

        encoded_line = self._dumps(payload, separators=(",", ":")).encode("utf-8") + b"\n"
        self._file_log.write(encoded_line)
        self._log_offset += len(encoded_line)
        self._last_logged_tick = tick

    def add_event_log(self, tick: int, log: str) -> None:
        hour: int = tick // 3600
        minute: int = (tick % 3600) // 60
        second: int = tick % 60

        logStr = f"[{hour:02}:{minute:02}:{second:02}] {log}\n"

        line = {"tick": tick, "event": logStr}

        encoded_line = self._dumps(line, separators=(",", ":")).encode("utf-8") + b"\n"
        self._file_event.write(encoded_line)


    #usage: get_state_logs_as_json(tick=x) OR get_sate_logs(lower_bound = x, upper_bound = x) OR get_state_logs() (entire log - NOT RECOMENDED! just pass the entire file at that point)
    def get_state_logs_as_json(self, tick : int | None = None, lower_bound : int | None = None, upper_bound : int | None = None) -> str:
        if self._last_logged_tick < 0:
            raise ValueError("No state logs are available.")

        self._file_log.flush()

        if tick is None and lower_bound is None and upper_bound is None:
            lower_bound = 0
            upper_bound = self._last_logged_tick

        if tick is not None and (lower_bound is not None or upper_bound is not None):
            raise ValueError("Provide either tick OR (lower_bound and upper_bound), not both.")

        if tick is not None: #specific tick
            if tick < 0 or tick > self._last_logged_tick:
                raise ValueError("Tick is out of logged range.")

            start_offset = self._log_index[tick]
            if tick == self._last_logged_tick:
                end_offset = self._log_offset
            else:
                end_offset = self._log_index[tick + 1]

            with Path(self._file_path).open("rb") as file_obj:
                file_obj.seek(start_offset)
                data = file_obj.read(end_offset - start_offset)
            return data.decode("utf-8").rstrip("\n")
        else: #logs within given range
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

            lines = [line for line in data.decode("utf-8").splitlines() if line]
            return "[" + ",".join(lines) + "]"
        
    def clear_log_file(self) -> None:
        if self._file_path.exists():
            #self._file_log.close()
            #self._file_event.close()
            #self._file_path.unlink()
            #self._file__path_event.unlink()
            ...