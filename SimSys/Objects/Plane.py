import random


class Plane:
    def __init__(self, callsign: str, is_arrival: bool, scheduled_time: int):
        self.callsign: str = callsign
        self.operator: str = "UNKNOWN"
        self.origin: str = "???"
        self.destination: str = "???"

        # UML suggests these need to be private, but for scheduling they need to be updated
        self._scheduled_time: int = scheduled_time
        self._system_time: int = scheduled_time

        self._is_arrival: bool = is_arrival
        self._altitude: float = 10000.0 if is_arrival else 0.0

        # Speed assigned between 166 and 333 ft/s to yield 30-60s runway times
        self._ground_speed: float = random.uniform(166, 333)

        self._delayed: bool = False
        self._emergency: bool = False
        self._emergency_handled: bool = False

        self._queue_join_time: int = 0
        self._wait_duration: int = 0

        self._fuel_seconds: int = 0

    def mock_values(self) -> int:
        """Populate plane data with dummy info, returns time the plane should depart/take-off"""
        self._scheduled_time = random.randint(0, 24 * 60 * 60)  # 24 hours
        self._system_time = int(random.gauss(self._scheduled_time, 5 * 60))  # 5 minute deviation
        self._fuel_seconds = random.gauss(40 * 60, 20 * 60)  # 20 <-> 60 minutes of fuel left
        self.operator: str = "DummyAir"
        self.origin = random.choice(
            ["LHR", "LGW", "MAN", "STN", "BHX", "GLA", "EDI", "LTN", "BFS", "BRS"]) if self._is_arrival else "SEAP"
        self.destination = "SEAP" if self._is_arrival else random.choice(
            ["LHR", "LGW", "MAN", "STN", "BHX", "GLA", "EDI", "LTN", "BFS", "BRS"])
        return self._system_time

    def update_litres(self) -> None:
        self._fuel_seconds -= 1

    def get_mins_left(self) -> int:
        return int(self._fuel_seconds / 60.0)

    def declare_emergency(self) -> None:
        self._emergency = True

    def is_emergency(self) -> bool:
        return self._emergency and not self._emergency_handled

    def delay(self) -> None:
        self._delayed = True