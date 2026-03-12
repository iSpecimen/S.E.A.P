from __future__ import annotations
import math as math
from dataclasses import dataclass

from SimSys.Objects.Plane import Plane
from .HoldingPatternQueue import HoldingPatternQueue
from .TakeOffQueue import TakeOffQueue
from .TakeOffRunway import TakeOffRunway
from .MixedRunway import MixedRunway
from .LandingRunway import LandingRunway
from .Logger import Logger

@dataclass
class UserConfig:
    runways: list[tuple[str, str] | None] | None = None   # To accommodate status changes, runway configs are now lists of tuples [mode, status]
    max_hqueue_size: int | float | None = None
    max_tqueue_size: int | float | None = None
    emergency_callsign: list[str | None] | None = None

class Simulation:
    def __init__(self, sim_name: str, user_config: dict[int, UserConfig], inbound_rate: int = 15, outbound_rate: int = 15):  # Added sim_name parameter. For multi-sim handling. "1.0, 1.1, 2.0.. etc"
        # Components
        self.sim_name = sim_name
        self.hqueue = HoldingPatternQueue(2000)
        self.tqueue = TakeOffQueue()
        
        # Save the schedule of configuration changes
        self.user_config_schedule: dict[int, UserConfig]= user_config
        self.inbound_flow = inbound_rate or 15
        self.outbound_flow = outbound_rate or 15
        # Initialize runways using the configuration at t=0 (10-slot map)
        initial_config = self.user_config_schedule[0]
        if initial_config and initial_config.runways is not None:
            initial_runways = initial_config.runways
        else:
            initial_runways = [("Takeoff", "Available"), ("Mixed", "Available"), ("Landing", "Available"), None, None, None, None, None, None, None]

        self.runways = self.generate_runway_config(initial_runways)
        
        # Apply initial queue limits if present at t=0
        if initial_config:
            if initial_config.max_hqueue_size is not None:
                self.current_max_hqueue = initial_config.max_hqueue_size
            if initial_config.max_tqueue_size is not None:
                self.current_max_tqueue = initial_config.max_tqueue_size
        
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
        
        # Dynamic schedule generation
        self._generate_schedule(self.inbound_flow, self.outbound_flow)

    def get_state_log(self): # Ati - Just don't want to break encapsulation so added method for getting logger data.
        return self._logger.get_file_data()
    
    def inbound_outbound(self):
        return self.inbound_flow, self.outbound_flow

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
                emergency_plane._fuel_seconds = 800  # Will trigger emergency/diversion rapidly
                self.schedule_departures[i].append(emergency_plane)
                self._allPlanes.append(emergency_plane)

    def _generate_schedule(self, inbound : int, outbound : int) -> None: #flow in planes per hour
        if inbound > 0:
            inboundInterval = math.floor((60.0 / inbound) * 60.0)
            for i in range(1, 3600 * 24, inboundInterval):
                plane = Plane(f"ARR{i}", True, i)
                self.schedule_arrivals[plane.mock_values(i)].append(plane)
                self._allPlanes.append(plane)

        if outbound > 0:
            outboundInterval = math.floor((60.0 / outbound) * 60)
            for i in range(1, 3600 * 24, outboundInterval):
                plane = Plane(f"DEP{i}", False, i)
                self.schedule_departures[plane.mock_values(i)].append(plane)
                self._allPlanes.append(plane)

    def generate_runway_config(self, config: list[tuple[str,str] | None] | None) -> list[TakeOffRunway | MixedRunway | LandingRunway | None]:
        if config is None: 
            config = [("Takeoff", "Available"), ("Mixed", "Available"), ("Landing", "Available"), None, None, None, None, None, None, None]
        
        newrunways: list[TakeOffRunway | MixedRunway | LandingRunway | None] = []

        for i in range(10):
            if config[i] == None:
                newrunways.append(None) 
                continue 

            r_mode, r_status = config[i]  # Breaks when config[i] is None, so has the safety before this. 
            
            runway_number = i + 1 
            
            if r_mode == "Takeoff":
                newrunways.append(TakeOffRunway(runway_number, 90, self.tqueue, r_status))
                print(f"Runway {runway_number} | Mode: {r_mode} | Status: {r_status}")
            elif r_mode == "Mixed":
                newrunways.append(MixedRunway(runway_number, 90, self.tqueue, self.hqueue, r_status))
                print(f"Runway {runway_number} | Mode: {r_mode} | Status: {r_status}")
            elif r_mode == "Landing":
                newrunways.append(LandingRunway(runway_number, 90, self.hqueue, r_status))
                print(f"Runway {runway_number} | Mode: {r_mode} | Status: {r_status}")
            else:
                newrunways.append(None) 
        
        active_count = sum(1 for r in newrunways if r is not None )
        print(f"--> Configured {active_count} Active Runways")
        return newrunways
    
    def run(self) -> None:
        self._logger = Logger(self.sim_name)
        print("=== STARTING 24-HOUR SIMULATION (BHX) ===\n")
        
        for t in range(60 * 60 * 24):
            # Check for User Config Updates
            if t in self.user_config_schedule:
                config = self.user_config_schedule[t]
                
                if config.runways is not None:
                    self.runways = self.generate_runway_config(config.runways)
                    print(f"Runways Configured at tick {t}")
                    
                if config.max_hqueue_size is not None:
                    self.current_max_hqueue = config.max_hqueue_size
                else:
                    self.current_max_hqueue = 25   # Ati - Sometimes is None, and then next for loop breaks with undefined current
                    
                if config.max_tqueue_size is not None:
                    self.current_max_tqueue = config.max_tqueue_size
                else:
                    self.current_max_tqueue = 25
                    
                if config.emergency_callsign is not None:
                    for csign in config.emergency_callsign:
                        for p in self._allPlanes:
                            if p.callsign == csign:
                                p.declare_emergency()
                                break

            for p in self.schedule_arrivals[t]:
                if self.hqueue.size >= self.current_max_hqueue:
                    self.diverted_planes_num += 1
                else:
                    p._queue_join_time = t
                    self.hqueue.push(p)

            for p in self.schedule_departures[t]:
                if self.tqueue.size >= self.current_max_tqueue:
                    self.cancelled_planes_num += 1
                else:
                    p._queue_join_time = t
                    self.tqueue.push(p)

            self.max_tqueue_size = max(self.max_tqueue_size, self.tqueue.size)
            self.max_hqueue_size = max(self.max_hqueue_size, self.hqueue.size)
            
            self.hqueue.tick_update(t, self, self._logger)
            self.tqueue.tick_update(t, self, self._logger)
            
            for r in self.runways:
                if r is not None:
                    r.tick_update(t, self)

            active_runways = [r for r in self.runways if r is not None]
            self._logger.add_state_log(t, self.hqueue, self.tqueue, active_runways)
                
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

        self._logger.finalize()
        self._logger.clear_log_file()

if __name__ == "__main__":
    initial_map = {
        0: UserConfig(
            runways=["Takeoff", "Mixed", "Landing", None, None, None, None, None, None, None]
        )
    }
    sim = Simulation("Final_Test", initial_map, inbound_rate=40, outbound_rate=40)
    sim.run()