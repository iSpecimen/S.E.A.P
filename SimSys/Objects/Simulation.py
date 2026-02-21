from __future__ import annotations

from .HoldingPatternQueue import HoldingPatternQueue
from .TakeOffQueue import TakeOffQueue
from .runway_class import MixedRunway, LandingRunway, TakeOffRunway
import random

class Plane:
    def __init__(self, callsign: str, is_arrival: bool, scheduled_time: int):
        self.callsign: str = callsign
        self.operator: str = "DummyAir"
        self.origin: str = "SOMEWHERE" if is_arrival else "BHX"
        self.destination: str = "BHX" if is_arrival else "SOMEWHERE"
        
        self.scheduled_time: int = scheduled_time
        self.system_time: int = scheduled_time
        
        self.is_arrival: bool = is_arrival
        self.altitude: float = 10000.0 if is_arrival else 0.0
        
        # Speed assigned between 166 and 333 ft/s to yield 30-60s runway times
        self.ground_speed: float = random.uniform(166, 333) 
        
        # Fuel distributed uniformly between 20-60 mins (1200 - 3600 seconds)
        self.fuel_seconds: int = random.randint(20 * 60, 60 * 60) if is_arrival else 100000
        
        self.delayed: bool = False
        self.emergency: bool = False
        self.emergency_handled: bool = False
        
        self.queue_join_time: int = 0
        self.wait_duration: int = 0

    def update_litres(self) -> None:
        self.fuel_seconds -= 1

    def get_mins_left(self) -> int:
        return int(self.fuel_seconds / 60.0)

    def declare_emergency(self) -> None:
        self.emergency = True

class Simulation:
    def __init__(self):
        # Components
        self.hqueue = HoldingPatternQueue(2000)
        self.tqueue = TakeOffQueue()
        self.runways = [MixedRunway(1, 90)] # can add more runways for test
        
        self.max_tqueue_size: int = 0
        self.max_hqueue_size: int = 0
        
        self.max_tqueue_wait: int = 0
        self.tqueue_wait_times_sum: int = 0
        self.tqueue_delay_sum: int = 0
        self.max_tqueue_delay: int = 0
        self.tqueue_processed: int = 0
        
        self.max_hqueue_wait: int = 0
        self.hqueue_wait_times_sum: int = 0
        self.hqueue_delay_sum: int = 0
        self.max_hqueue_delay: int = 0
        self.hqueue_processed: int = 0
        
        self.cancelled_planes_num: int = 0
        self.diverted_planes_num: int = 0
        
        # Timetable
        self.schedule: dict[int, list[Plane]] = {i: [] for i in range(3601)}
        self._generate_dummy_schedule()

    def _generate_dummy_schedule(self) -> None:
        # Generate roughly 15 arrivals and 15 departures for the hour to stress test
        for i in range(0, 3600, 30):
            self.schedule[i].append(Plane(f"ARR{i}", True, i))
            self.schedule[i].append(Plane(f"DEP{i}", False, i))
            
            # Injecting a low-fuel emergency plane for proof of concept
            if i == 1800:
                emergency_plane = Plane(f"ARR_EMG", True, i)
                emergency_plane.fuel_seconds = 800  # Will trigger emergency/diversion rapidly
                self.schedule[i].append(emergency_plane)

    def run(self) -> None:
        print("=== STARTING 1-HOUR SIMULATION (BHX) ===\n")
        
        for t in range(3601):
            for p in self.schedule[t]:
                p.queue_join_time = t
                if p.is_arrival:
                    self.hqueue.push(p)
                else:
                    self.tqueue.push(p)
            
            self.max_tqueue_size = max(self.max_tqueue_size, self.tqueue.size)
            self.max_hqueue_size = max(self.max_hqueue_size, self.hqueue.size)
            
            self.hqueue.tick_update(t, self)
            self.tqueue.tick_update(t, self)
            
            for r in self.runways:
                r.tick_update(t, self)
                
        self.print_statistics()

    def print_statistics(self) -> None:
        # Averages
        avg_tq_wait = (self.tqueue_wait_times_sum / self.tqueue_processed) if self.tqueue_processed else 0
        avg_tq_del = (self.tqueue_delay_sum / self.tqueue_processed) if self.tqueue_processed else 0
        avg_hq_wait = (self.hqueue_wait_times_sum / self.hqueue_processed) if self.hqueue_processed else 0
        avg_hq_del = (self.hqueue_delay_sum / self.hqueue_processed) if self.hqueue_processed else 0

        print("\n=== SIMULATION RESULTS (Client Spec Compliance) ===")
        print("--- Departures (TakeOff Queue) ---")
        print(f"Max queue size:     {self.max_tqueue_size} aircraft")
        print(f"Max wait time:      {self.max_tqueue_wait} seconds")
        print(f"Average wait time:  {avg_tq_wait:.2f} seconds")
        print(f"Max delay:          {self.max_tqueue_delay} seconds")
        print(f"Average delay:      {avg_tq_del:.2f} seconds")
        print(f"Processed count:    {self.tqueue_processed} aircraft")
        
        print("\n--- Arrivals (Holding Pattern) ---")
        print(f"Max queue size:     {self.max_hqueue_size} aircraft")
        print(f"Max wait time:      {self.max_hqueue_wait} seconds")
        print(f"Average wait time:  {avg_hq_wait:.2f} seconds")
        print(f"Max delay:          {self.max_hqueue_delay} seconds")
        print(f"Average delay:      {avg_hq_del:.2f} seconds")
        print(f"Processed count:    {self.hqueue_processed} aircraft")
        
        print("\n--- Interruptions & Alerts ---")
        print(f"Total Cancellations: {self.cancelled_planes_num}")
        print(f"Total Diversions:    {self.diverted_planes_num}")
        print("=================================================")

# Optional testing block so you can run this specific file directly
if __name__ == "__main__":
    sim = Simulation()
    sim.run()