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
    runways: list[tuple[str, str] | None] | None = None   
    max_hqueue_wait: int | float | None = None
    max_tqueue_wait: int | float | None = None
    emergency_callsign: list[str | None] | None = None

class Simulation:
    def __init__(self, sim_name: str, user_config: dict[int, UserConfig], inbound_rate: int = 15, outbound_rate: int = 15):
        self.sim_name = sim_name
        self.hqueue = HoldingPatternQueue(2000)
        self.tqueue = TakeOffQueue()
        
        self.user_config_schedule: dict[int, UserConfig] = user_config
        self.inbound_flow = inbound_rate or 15
        self.outbound_flow = outbound_rate or 15
        
        initial_config = self.user_config_schedule.get(0)
        if initial_config and initial_config.runways is not None:
            initial_runways = initial_config.runways
        else:
            initial_runways = [("Takeoff", "Available"), ("Mixed", "Available"), ("Landing", "Available"), None, None, None, None, None, None, None]

        self.runways = self.generate_runway_config(initial_runways)
        
        self.current_max_hwait = 1800
        self.current_max_twait = 1800

        if initial_config:
            if initial_config.max_hqueue_wait is not None:
                self.current_max_hwait = initial_config.max_hqueue_wait
            if initial_config.max_tqueue_wait is not None:
                self.current_max_twait = initial_config.max_tqueue_wait
        
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
        
        self.recent_events: list[dict] = []

        self._logger : Logger
        self._allPlanes : list[Plane] = []
        
        self.schedule_arrivals: dict[int, list[Plane]] = {i: [] for i in range(60 * 60 * 24)}
        self.schedule_departures: dict[int, list[Plane]] = {i: [] for i in range(60 * 60 * 24)}
        
        self._generate_schedule(self.inbound_flow, self.outbound_flow)

    def get_state_log(self): 
        return self._logger.get_file_data()
    
    def inbound_outbound(self):
        return self.inbound_flow, self.outbound_flow

    def add_cancellation_diversion_event(self, tick: int, callsign: str, event_type: str) -> None:
        event_id = f"{tick}_{callsign}"
        
        if event_type == "Cancellation":
            msg = f"FLIGHT {callsign} CANCELLED: QUEUE OR WAIT LIMIT REACHED"
            ui_type = "cancellation"
        else:
            msg = f"FLIGHT {callsign} DIVERTED: LOW FUEL OR HOLD LIMIT REACHED"
            ui_type = "diversion"

        self.recent_events.append({
            "id": event_id,
            "time": tick,
            "callsign": callsign,
            "type": ui_type,
            "message": msg
        })
        
        if len(self.recent_events) > 5:
            self.recent_events.pop(0)

    def _generate_dummy_schedule(self) -> None:
        for i in range(0, 3600 * 24, 30):
            plane = Plane(f"ARR{i}", True, i)
            self.schedule_arrivals[plane.mock_values()].append(plane)
            self._allPlanes.append(plane)
            plane = Plane(f"DEP{i}", False, i)
            self.schedule_departures[plane.mock_values()].append(plane)
            self._allPlanes.append(plane)
            
            if i == 1800:
                emergency_plane = Plane(f"ARR_EMG", True, i)
                emergency_plane._fuel_seconds = 800
                self.schedule_departures[i].append(emergency_plane)
                self._allPlanes.append(emergency_plane)

    def _generate_schedule(self, inbound : int, outbound : int) -> None: 
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

            r_mode, r_status = config[i]  
            
            runway_number = i + 1 
            
            if r_mode == "Takeoff":
                newrunways.append(TakeOffRunway(runway_number, 90, self.tqueue, r_status))
            elif r_mode == "Mixed":
                newrunways.append(MixedRunway(runway_number, 90, self.tqueue, self.hqueue, r_status))
            elif r_mode == "Landing":
                newrunways.append(LandingRunway(runway_number, 90, self.hqueue, r_status))
            else:
                newrunways.append(None) 
        
        return newrunways
    
    def run(self) -> None:
        self._logger = Logger(self.sim_name)
        print("=== STARTING 24-HOUR SIMULATION (BHX) ===\n")
        
        for t in range(60 * 60 * 24):
            if t in self.user_config_schedule:
                config = self.user_config_schedule[t]
                
                if config.runways is not None:
                    self.runways = self.generate_runway_config(config.runways)
                    
                if config.max_hqueue_wait is not None:
                    self.current_max_hwait = config.max_hqueue_wait
                    
                if config.max_tqueue_wait is not None:
                    self.current_max_twait = config.max_tqueue_wait
                    
                if config.emergency_callsign is not None:
                    for csign in config.emergency_callsign:
                        for p in self._allPlanes:
                            if p.callsign == csign:
                                p.declare_emergency()
                                break

            for p in self.schedule_arrivals[t]:
                p._queue_join_time = t
                self.hqueue.push(p)

            for p in self.schedule_departures[t]:
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
            self._logger.add_state_log(t, self.hqueue, self.tqueue, active_runways, self.cancelled_planes_num, self.diverted_planes_num, self.recent_events)
                
        self.print_statistics()

    def print_statistics(self) -> None:
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
    initial_config = {
        0: UserConfig(
            runways=[
                ("Mixed", "Available"), 
                None, None, None, None, 
                None, None, None, None, None
            ],
            max_hqueue_wait=1800,
            max_tqueue_wait=1800 
        )
    }
    
    sim = Simulation(
        sim_name="Stress_Test_v1", 
        user_config=initial_config, 
        inbound_rate=150, 
        outbound_rate=150
    )
    
    sim.run()