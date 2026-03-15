"""
Concrete class for Arrival Queues handling active airborne traffic.
Contains emergency elevation and prioritization logic.
"""

from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .Plane import Plane 
    from .Logger import Logger 
    from .Simulation import Simulation

from SimSys.Objects.queue_class import Queue, QueueNode

class HoldingPatternQueue(Queue):
    """Manages planes waiting to land, dynamically adjusting the holding altitude."""
    def __init__(self, base_altitude: float) -> None:
        super().__init__()
        self.base_altitude: float = base_altitude
        self.curr_max_altitude: float = 0 

    def push(self, plane: Plane) -> None: 
        """Pushes plane and elevates holding pattern height by 1000 ft."""
        if self.size == 0:
            self.curr_max_altitude = self.base_altitude
        else:
            self.curr_max_altitude += 1000
            
        super().push(plane)

    def pop(self) -> Plane:
        """Pops plane and reduces holding pattern height."""
        if self.size == 1:
            self.curr_max_altitude = 0
        else:
            self.curr_max_altitude -= 1000
            
        return super().pop()
    
    def __addToTop(self, plane: Plane) -> None:
        """Helper to force emergency aircraft to the front of the landing queue."""
        if self._head is not None:
            toMove: QueueNode = self._head
            newHead: QueueNode = QueueNode(plane, toMove, None)
            toMove.prev = newHead
            self._head = newHead
        else:
            self._head = QueueNode(plane, None, None)
            self._tail = self._head
            
        self.size += 1
    
    def tick_update(self, curr_time: int, sim: "Simulation", logger: "Logger") -> None:
        """Scans waiting aircraft for timeouts, fuel exhaustion, and emergencies."""
        next_item: QueueNode | None = self._head
        
        while next_item is not None:
            nxt: QueueNode | None = next_item.next
            plane: Plane = next_item.val
            plane.update_litres()

            wait_duration: int = curr_time - plane._queue_join_time
            
            if wait_duration > sim.current_max_hwait:
                logger.add_event_log(curr_time, f"DIVERSION: {plane.callsign} diverted. Exceeded max wait time ({sim.current_max_hwait}s).")
                sim.diverted_planes_num += 1
                sim.add_cancellation_diversion_event(curr_time, plane.callsign, "Diversion")
                self.remove(next_item)
            
            elif plane.get_mins_left() < 10:
                logger.add_event_log(curr_time, f"DIVERSION: {plane.callsign} diverted. Fuel critically low (<10 mins)!")
                sim.diverted_planes_num += 1
                sim.add_cancellation_diversion_event(curr_time, plane.callsign, "Diversion")
                self.remove(next_item)
                
            else:
                if plane.get_mins_left() < 20:
                    plane.declare_emergency()

                if plane._emergency and not plane._emergency_handled:
                    logger.add_event_log(curr_time, f"EMERGENCY: {plane.callsign} declaring fuel emergency (<20 mins). Bumping to top of hold.")
                    self.remove(next_item)
                    self.__addToTop(plane)
                    plane._emergency_handled = True

            next_item = nxt