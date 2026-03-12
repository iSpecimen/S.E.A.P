import time
import pytest
# needs pytest-timeout as a plugin

from SimSys.Objects.Logger import Logger
from SimSys.Objects.Plane import Plane
from SimSys.Objects.Simulation import Simulation, UserConfig


# RS.1 - can't test as needs UI
# RS.2 - ^^^
# RS.3 - ^^^
# RS.4 - ^^^

initial_map = {
        0: UserConfig(
            runways=[("Mixed", "Available"), None, None, None, None, None, None, None, None, None]
        )
    }

def test_ss1():
    sim = Simulation("SIM-TEST", initial_map)
    # simulation generates dummy schedule upon initialisation, delete it
    for i in range(3600 * 24):
        sim.schedule_arrivals[i] = []
    plane = Plane("PLN-TEST", True, 1000)
    # insert plane into empty schedule spot
    sim.schedule_arrivals[1000].append(plane)
    # ensure expected state is the case
    assert(sim.schedule_arrivals[1000][0] == plane)
    for i in sim.schedule_arrivals.keys():
        if i != 1000:
            assert(len(sim.schedule_arrivals[i]) == 0)

def test_ss2():
    sim = Simulation("SIM-TEST", initial_map)
    plane = Plane("PLN-TEST", True, 1000)
    # ensure schedule handles invalid times without crashing entirely
    with pytest.raises(KeyError):
        sim.schedule_arrivals[-1].append(plane)
    with pytest.raises(KeyError):
        sim.schedule_arrivals[86500].append(plane)

def test_ss3():
    sim = Simulation("SIM-TEST", initial_map)
    plane = Plane("PLN-TEST", True, 1000)
    # enqueue plane to an empty queue
    assert(sim.tqueue.size == 0)
    sim.tqueue.push(plane)
    # check length 1 & head == tail == plane
    assert(sim.tqueue.size == 1)
    assert(sim.tqueue.pop() == plane)

@pytest.mark.timeout(120)
# don't get stuck on executing this
def test_ss4():
    execution_times = []
    # run 5 simulations
    for i in range(5):
        sim = Simulation(f"SIM-{i}", initial_map)
        sim._generate_dummy_schedule()
        start_time = time.time()
        sim.run()
        execution_times.append(time.time() - start_time)
    # ensure average time is less than 15 seconds
    avg_time = sum(execution_times) / len(execution_times)
    assert(avg_time < 15)

def test_ss5():
    logger = Logger("SIM-TEST")
    initial_map = {
        0: None
    }
    sim = Simulation("SIM-TEST", initial_map)
    plane1 = Plane("PLN-TEST-1", True, 1000)
    plane1.declare_emergency()
    plane1._fuel_seconds = 25 * 60
    plane2 = Plane("PLN-TEST-2", True, 1000)
    plane2.declare_emergency()
    plane2._fuel_seconds = 15 * 60
    # push planes to simulation
    sim.hqueue.push(plane1)
    sim.hqueue.push(plane2)
    # tick once
    sim.hqueue.tick_update(0, sim, logger)
    # ensure p2 is the first plane to land
    assert(sim.hqueue.pop().callsign == plane2.callsign)

def test_ss6():
    logger = Logger("SIM-TEST")
    sim = Simulation("SIM-TEST", initial_map)
    plane = Plane("PLN-TEST", True, 1000)
    plane._fuel_seconds = 21 * 60
    sim.hqueue.push(plane)
    # keep ticking until the plane is in an emergency
    assert(not plane._emergency)
    # do not check plane.is_emergency() - returns false after handling it
    i = 0
    while not plane._emergency:
        sim.hqueue.tick_update(i, sim, logger)
        i += 1
        if i > (21 * 60):
            break
    # check threshold is 20 minutes
    assert((21 * 60 - 20 * 60) == i - 1) # 20 minutes is when emergency flag is true (off-by-one)

def test_ss7():
    logger = Logger("SIM-TEST")
    sim = Simulation("SIM-TEST", initial_map)
    plane = Plane("PLN-TEST", True, 1000)
    plane._fuel_seconds = 11 * 60
    sim.hqueue.push(plane)
    # keep ticking until the plane is diverted
    assert(sim.diverted_planes_num == 0)
    i = 0
    while sim.diverted_planes_num == 0:
        sim.hqueue.tick_update(i, sim, logger)
        i += 1
    assert((11 * 60 - 10 * 60) == i - 1) # divert when we hit 10 minute threshold (off-by-one)
    # check diversion at 10 minute threshold
    assert(sim.hqueue.size == 0)

def test_ss8():
    logger = Logger("SIM-TEST")
    sim = Simulation("SIM-TEST", initial_map)
    plane = Plane("PLN-TEST", True, 1000)
    plane._fuel_seconds = 30 * 60
    sim.hqueue.push(plane)
    # tick for 10 minutes
    for i in range(600):
        sim.hqueue.tick_update(i, sim, logger)
    # ensure we have used 10 minutes of fuel
    assert (plane._fuel_seconds == 20 * 60)