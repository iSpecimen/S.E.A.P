import numpy as np
from operator import attrgetter
from typing import Any

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .HoldingPatternQueue import HoldingPatternQueue # type: ignore[attr-defined]
    from .TakeOffQueue import TakeOffQueue # type: ignore[attr-defined]
    from .runway_class import Runway # type: ignore[attr-defined]

class Logger:
    def __init__(self):
        #schemas
        self.__plane_schema : tuple = ("callsign","operator","origin","destination", "schedule_time","altitude","fuel_seconds","ground_speed","delayed","emergency")
        self.__HoldingQueue : tuple = ("base_altitude", "callsigns") #planeIDs will be in queue order
        self.__TakeoffQueue : tuple = ("callsigns",) #planeIDs will be in queue order
        self.__runways : tuple = ("runways",) #will just hold array of runways
        self.__runwaySchema : tuple = ("mode", "status", "callsigns", "bearing", "number", "expected_free_time") # for each runway

        self.__plane_get = attrgetter(*self.__plane_schema)
        self.__runway_attr_get = attrgetter(
            "mode", "status", "bearing", "number", "expected_free_time"
        )

        self.__planes : np.array #This should be constant, and populated once the timetable is generated!

        self.__state_logs: list[dict[str, Any]] = []

    @staticmethod
    def _queue_callsigns(q) -> list[str]:
        return [p.callsign for p in q.getNodeAsList()]

    @staticmethod
    def _runway_callsign(r) -> str:
        return "N/A" if r.occupier is None else r.occupier.callsign

    #Note: differs from UML because creating many dictionaries at runtime is resource intensive
    def add_state_log(self, tick : int, holding_pattern : HoldingPatternQueue, takeoff_queue : TakeOffQueue, runways : list[Runway]):
        seen = {}
        for p in getattr(holding_pattern, "queue", []):
            seen[p.callsign] = p
        for p in getattr(takeoff_queue, "queue", []):
            seen[p.callsign] = p
        planes = list(seen.values())

        plane_rows = [self.__plane_get(p) for p in planes]

        holding_values = [
            holding_pattern.base_altitude,
            self._queue_callsigns(holding_pattern),
        ]

        takeoff_values = [
            self._queue_callsigns(takeoff_queue),
        ]

        takeoff_values = [
            self._queue_callsigns(takeoff_queue),
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
            "planes": {"schema": self.__plane_schema, "rows": plane_rows},
            "HoldingQueue": {"schema": self.__HoldingQueue, "values": holding_values},
            "TakeoffQueue": {"schema": self.__TakeoffQueue, "values": takeoff_values},
            "runways": {
                "schema": self.__runways,
                "runways": {"schema": self.__runwaySchema, "rows": runway_rows},
            },
        }

        self.__state_logs.append(payload)

    #usage: get_state_logs_as_json(tick=x) OR get_sate_logs(lower_bound = x, upper_bound = x)
    def get_state_logs_as_json(self, tick : int | None = None, lower_bound : int | None = None, upper_bound : int | None = None) -> str:
        if (tick == None and (lower_bound == None or upper_bound == None)):
            raise ValueError("Invalid Arguments!")

        if tick is not None: #specific tick
            raise NotImplementedError()
        else: #logs within given range
            raise NotImplementedError()
