import pytest

from SimSys.Objects.HoldingPatternQueue import HoldingPatternQueue
from SimSys.Objects.Simulation import Simulation

# Plane is not implemented yet; provide a minimal stub for tests.
try:
    from SimSys.Objects.plane import Plane  # type: ignore[attr-defined]
except Exception:  # pragma: no cover - used only when Plane is missing
    class Plane:  # type: ignore[no-redef]
        emergency : bool = False

        def update_litres(self): 
            ...

        def get_mins_left(self) -> int:
            return 100

@pytest.fixture
def hpq():
    # Pick a simple base altitude for predictable tests
    return HoldingPatternQueue(base_altitude=5000.0)


def test_init_sets_altitudes_and_empty_queue(hpq):
    assert hpq.base_altitude == 5000.0
    assert hpq.curr_max_altitude == 0
    assert hpq.size == 0


def test_push_first_sets_curr_max_to_base(hpq):
    hpq.push(Plane())
    assert hpq.size == 1
    assert hpq.curr_max_altitude == 5000.0


def test_push_second_increments_by_1000(hpq):
    hpq.push(Plane())
    hpq.push(Plane())
    assert hpq.size == 2
    assert hpq.curr_max_altitude == 6000.0


def test_push_multiple_increments_correctly(hpq):
    for i in range(5):
        hpq.push(Plane())
    assert hpq.size == 5
    # base for first plane, then +1000 for each additional plane (4 more)
    assert hpq.curr_max_altitude == 5000.0 + 4 * 1000


def test_pop_from_single_resets_curr_max_to_zero(hpq):
    hpq.push(Plane())
    popped = hpq.pop()
    assert popped is not None
    assert hpq.size == 0
    assert hpq.curr_max_altitude == 0


def test_pop_from_two_decrements_by_1000(hpq):
    hpq.push(Plane())
    hpq.push(Plane())

    hpq.pop()
    assert hpq.size == 1
    assert hpq.curr_max_altitude == 5000.0


def test_pop_all_never_goes_negative(hpq):
    for i in range(3):
        hpq.push(Plane())
    assert hpq.curr_max_altitude == 7000.0

    hpq.pop()
    assert hpq.curr_max_altitude == 6000.0

    hpq.pop()
    assert hpq.curr_max_altitude == 5000.0

    hpq.pop()
    assert hpq.curr_max_altitude == 0

    # sanity: shouldn't be negative when empty
    assert hpq.curr_max_altitude >= 0
    assert hpq.size == 0


def test_fifo_order(hpq):
    p1 = Plane()
    p2 = Plane()
    p3 = Plane()

    hpq.push(p1)
    hpq.push(p2)
    hpq.push(p3)

    assert hpq.pop() is p1
    assert hpq.pop() is p2
    assert hpq.pop() is p3

def test_one_emergency_prioritised(hpq):
    p1 = Plane()
    p2 = Plane()
    p3 = Plane()
    p4 = Plane()

    hpq.push(p1)
    hpq.push(p2)
    hpq.push(p3)
    hpq.push(p4)

    p3.emergency = True

    dummySim : Simulation = Simulation()

    hpq.tick_update(0, dummySim)

    assert hpq.pop() is p3
    assert hpq.pop() is p1
    assert hpq.pop() is p2
    assert hpq.pop() is p4

def test_two_emergency_prioritised(hpq):
    p1 = Plane()
    p2 = Plane()
    p3 = Plane()
    p4 = Plane()

    hpq.push(p1)
    hpq.push(p2)
    hpq.push(p3)
    hpq.push(p4)

    p2.emergency = True
    p3.emergency = True

    dummySim : Simulation = Simulation()

    hpq.tick_update(0, dummySim)

    assert hpq.pop() is p3
    assert hpq.pop() is p2
    assert hpq.pop() is p1
    assert hpq.pop() is p4

def test_two_emergency__at_head_prioritised(hpq):
    p1 = Plane()
    p2 = Plane()
    p3 = Plane()
    p4 = Plane()

    hpq.push(p1)
    hpq.push(p2)
    hpq.push(p3)
    hpq.push(p4)

    p1.emergency = True
    p2.emergency = True

    dummySim : Simulation = Simulation()

    hpq.tick_update(0, dummySim)
    hpq.tick_update(0, dummySim)
    hpq.tick_update(0, dummySim)

    assert hpq.pop() is p2
    assert hpq.pop() is p1
    assert hpq.pop() is p3
    assert hpq.pop() is p4
