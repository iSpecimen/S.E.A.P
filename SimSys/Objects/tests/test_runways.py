import pytest

import SimSys.Objects.TakeOffRunway as takeoff_runway_mod
import SimSys.Objects.LandingRunway as landing_runway_mod
import SimSys.Objects.MixedRunway as mixed_runway_mod

from SimSys.Objects.TakeOffRunway import TakeOffRunway
from SimSys.Objects.LandingRunway import LandingRunway
from SimSys.Objects.MixedRunway import MixedRunway

from SimSys.Objects.TakeOffQueue import TakeOffQueue
from SimSys.Objects.HoldingPatternQueue import HoldingPatternQueue


class DummyPlane:
    def __init__(self, mins_left: int = 999, ground_speed: float = 200.0):
        self._mins_left = mins_left
        self.ground_speed = ground_speed
        self.emergency_declared = False

    def get_mins_left(self) -> int:
        return self._mins_left

    def declare_emergency(self) -> None:
        self.emergency_declared = True

    def update_litres(self) -> None:
        ...

# Fixtures (need to use monkeypatch to set global variables)

@pytest.fixture
def takeoff_q() -> TakeOffQueue:
    return TakeOffQueue()

@pytest.fixture
def landing_q() -> HoldingPatternQueue:
    return HoldingPatternQueue(1000)

@pytest.fixture
def takeoff_runway(takeoff_q: TakeOffQueue, monkeypatch: pytest.MonkeyPatch) -> TakeOffRunway:
    monkeypatch.setattr(takeoff_runway_mod, "TheTakeoffQueue", takeoff_q, raising=True)
    return TakeOffRunway(number=1, bearing=90)

@pytest.fixture
def landing_runway(landing_q: HoldingPatternQueue, monkeypatch: pytest.MonkeyPatch) -> LandingRunway:
    monkeypatch.setattr(landing_runway_mod, "TheLandingQueue", landing_q, raising=True)
    return LandingRunway(number=2, bearing=270)

@pytest.fixture
def mixed_runway(landing_q: HoldingPatternQueue, takeoff_q: TakeOffQueue, monkeypatch: pytest.MonkeyPatch,) -> MixedRunway:
    monkeypatch.setattr(mixed_runway_mod, "TheLandingQueue", landing_q, raising=True)
    monkeypatch.setattr(mixed_runway_mod, "TheTakeoffQueue", takeoff_q, raising=True)
    return MixedRunway(number=3, bearing=180)


def test_load_raises_when_not_free(takeoff_runway: TakeOffRunway, takeoff_q: TakeOffQueue):
    takeoff_runway.free = False
    with pytest.raises(RuntimeError):
        takeoff_runway.load(takeoff_q)

def test_unload_resets_state(takeoff_runway: TakeOffRunway):
    takeoff_runway.free = False
    takeoff_runway.occupier = DummyPlane()
    takeoff_runway.expected_free_time = 12
    takeoff_runway.status = "Runway in use"

    takeoff_runway.unload()

    assert takeoff_runway.free is True
    assert takeoff_runway.occupier is None
    assert takeoff_runway.expected_free_time == 0
    assert takeoff_runway.status == "Available"

def test_takeoff_tick_update_loads_when_free(takeoff_runway: TakeOffRunway, takeoff_q: TakeOffQueue):
    p = DummyPlane(mins_left=50, ground_speed=250.0)
    takeoff_q.push(p)

    assert takeoff_runway.free is True
    takeoff_runway.tick_update()

    assert takeoff_runway.free is False
    assert takeoff_runway.occupier is p
    assert takeoff_runway.status == "Runway in use"
    assert takeoff_runway.expected_free_time > 0

def test_takeoff_tick_update_decrements_and_updates_plane(takeoff_runway: TakeOffRunway, takeoff_q: TakeOffQueue):
    p = DummyPlane(mins_left=50, ground_speed=200.0)
    takeoff_q.push(p)

    takeoff_runway.tick_update()  
    start = takeoff_runway.expected_free_time
    assert start > 0

    takeoff_runway.tick_update() 
    assert takeoff_runway.expected_free_time == start - 1

def test_takeoff_declares_emergency_when_under_10_mins(takeoff_runway: TakeOffRunway, takeoff_q: TakeOffQueue):
    p = DummyPlane(mins_left=9, ground_speed=200.0)
    takeoff_q.push(p)

    takeoff_runway.tick_update() 
    takeoff_runway.tick_update()  

    assert p.emergency_declared is True

def test_takeoff_unloads_when_expected_free_time_reaches_zero(takeoff_runway: TakeOffRunway, takeoff_q: TakeOffQueue):
    p = DummyPlane(mins_left=50, ground_speed=200.0)
    takeoff_q.push(p)

    takeoff_runway.tick_update() 
    takeoff_runway.expected_free_time = 0
    takeoff_runway.tick_update()

    assert takeoff_runway.free is True
    assert takeoff_runway.occupier is None
    assert takeoff_runway.status == "Available"

def test_landing_tick_update_loads_when_free(landing_runway: LandingRunway, landing_q: HoldingPatternQueue):
    p = DummyPlane(mins_left=50, ground_speed=250.0)
    landing_q.push(p)

    assert landing_runway.free is True
    landing_runway.tick_update()

    assert landing_runway.free is False
    assert landing_runway.occupier is p
    assert landing_runway.status == "Runway in use"
    assert landing_runway.expected_free_time > 0

def test_landing_emergency_low_fuel(landing_runway: LandingRunway, landing_q: HoldingPatternQueue):
    p = DummyPlane(mins_left=5, ground_speed=200.0)
    landing_q.push(p)

    landing_runway.tick_update()
    landing_runway.tick_update()

    assert p.emergency_declared is True

def test_mixed_follows_ratio(mixed_runway: MixedRunway, landing_q: HoldingPatternQueue, takeoff_q: TakeOffQueue):
    landing_plane = DummyPlane()
    landing_q.push(landing_plane)

    p1 = DummyPlane(ground_speed=300.0)
    p2 = DummyPlane(ground_speed=300.0)
    p3 = DummyPlane(ground_speed=300.0)
    takeoff_q.push(p1)
    takeoff_q.push(p2)
    takeoff_q.push(p3)

    mixed_runway.load(landing_q, takeoff_q)
    assert mixed_runway.occupier is p1

def test_mixed_tick_update(mixed_runway: MixedRunway, landing_q: HoldingPatternQueue, takeoff_q: TakeOffQueue):
    # Make takeoff dominate so it should pick takeoff on tick_update()
    landing_q.push(DummyPlane())
    takeoff_q.push(DummyPlane())
    takeoff_q.push(DummyPlane())
    takeoff_q.push(DummyPlane())

    assert mixed_runway.free is True
    mixed_runway.tick_update()

    assert mixed_runway.free is False
    assert mixed_runway.occupier is not None
    assert mixed_runway.status == "Runway in use"
    assert mixed_runway.expected_free_time > 0
