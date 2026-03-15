"""
Concrete class for dedicated Landing Runways. 
Consumes only HoldingPatternQueues.
"""

from SimSys.Objects.runway_class import Runway
from SimSys.Objects.HoldingPatternQueue import HoldingPatternQueue
from math import ceil
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .Simulation import Simulation

class LandingRunway(Runway[HoldingPatternQueue]):
    """Runway specifically designed to handle inbound arriving traffic."""
    
    def __init__(self, number: int, bearing: int, landingQueue: HoldingPatternQueue, status: str) -> None:
        """Initializes the landing runway with its associated holding pattern queue."""
        super().__init__(number, bearing, status)
        self.mode: str = "Landing"
        self.landingQueue: HoldingPatternQueue = landingQueue

    def load(self, queue: HoldingPatternQueue) -> None:
        """Loads a plane from the holding queue and calculates expected runway usage time."""
        super().load(queue)

        if self.occupier is not None:
            timing: float = self._length / self.occupier._ground_speed
            self.expected_free_time = ceil(timing)

    def tick_update(self, curr_time: int, sim: "Simulation") -> None:
        """Runs a single second of queue consumption logic and tracks arrival performance."""
        if self.free and not self._disabled:
            
            if self.landingQueue.size > 0:
                self.load(self.landingQueue)
                
                if self.occupier is not None:
                    wait_time: int = curr_time - self.occupier._queue_join_time
                    delay: int = curr_time - self.occupier._scheduled_time
                    
                    sim.hqueue_wait_times_sum += wait_time
                    sim.hqueue_delay_sum += max(0, delay)
                    sim.max_hqueue_wait = max(sim.max_hqueue_wait, wait_time)
                    sim.max_hqueue_delay = max(sim.max_hqueue_delay, delay)
                    sim.hqueue_processed += 1
                
        elif self.expected_free_time > 0 and self.occupier is not None:
            
            if self.occupier.get_mins_left() < 10:
                self.occupier.declare_emergency()
                
            self.expected_free_time -= 1
            self.occupier.update_litres()
            
        else:
            self.unload()