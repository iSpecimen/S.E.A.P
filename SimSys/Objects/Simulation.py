from __future__ import annotations

from SimSys.Objects.Plane import Plane
from .HoldingPatternQueue import HoldingPatternQueue
from .TakeOffQueue import TakeOffQueue
from .TakeOffRunway import TakeOffRunway
from .MixedRunway import MixedRunway
from .LandingRunway import LandingRunway

from .Logger import Logger

class Simulation:
    def __init__(self):
        # Components
        self.hqueue = HoldingPatternQueue(2000)
        self.tqueue = TakeOffQueue()
        self.runways = [TakeOffRunway(1, 90, self.tqueue),TakeOffRunway(1, 90, self.tqueue),TakeOffRunway(1, 90, self.tqueue),LandingRunway(1,90,self.hqueue),LandingRunway(1,90,self.hqueue),LandingRunway(1,90,self.hqueue)] # can add more runways for test
        
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

        self._logger : Logger

        self._allPlanes : list[Plane] = []
        
        # Timetable
        self.schedule_arrivals: dict[int, list[Plane]] = {i: [] for i in range(60 * 60 * 24)}
        self.schedule_departures: dict[int, list[Plane]] = {i: [] for i in range(60 * 60 * 24)}
        self._generate_dummy_schedule()

    def _generate_dummy_schedule(self) -> None:
        # Generate roughly 15 arrivals and 15 departures for the hour to stress test
        for i in range(0, 3600 * 24, 30):
            plane = Plane(f"ARR{i}", True, i)
            self.schedule_arrivals[plane.mock_values()].append(plane)
            self._allPlanes.append(plane)
            plane = Plane(f"DEP{i}", False, i)
            self.schedule_departures[plane.mock_values()].append(plane)
            self._allPlanes.append(plane)
            
            # Injecting a low-fuel emergency plane for proof of concept
            if i == 1800:
                emergency_plane = Plane(f"ARR_EMG", True, i)
                emergency_plane.fuel_seconds = 800  # Will trigger emergency/diversion rapidly
                self.schedule_departures[i].append(emergency_plane)
                self._allPlanes.append(emergency_plane)

    def run(self) -> None:
        self._logger = Logger()
        print("=== STARTING 24-HOUR SIMULATION (BHX) ===\n")
        
        for t in range(60 * 60 * 24):
            for p in self.schedule_arrivals[t]:
                p.queue_join_time = t
                if p._is_arrival:
                    self.hqueue.push(p)
                    self.hqueue_processed += 1
                else:
                    self.tqueue.push(p)
                    self.tqueue_processed += 1

            for p in self.schedule_departures[t]:
                p.queue_join_time = t
                if p._is_arrival:
                    self.hqueue.push(p)
                    self.hqueue_processed += 1
                else:
                    self.tqueue.push(p)
                    self.tqueue_processed += 1
            
            self.max_tqueue_size = max(self.max_tqueue_size, self.tqueue.size)
            self.max_hqueue_size = max(self.max_hqueue_size, self.hqueue.size)
            
            self.hqueue.tick_update(t, self)
            self.tqueue.tick_update(t, self)
            
            for r in self.runways:
                r.tick_update(t, self)

            self._logger.add_state_log(t, self.hqueue, self.tqueue, self.runways)
                
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

        self._logger.clear_log_file()

# Optional testing block so you can run this specific file directly
if __name__ == "__main__":
    sim = Simulation()
    sim.run()