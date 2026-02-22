from __future__ import annotations

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .plane import Plane # type: ignore[attr-defined]
    from .Simulation import Simulation

from SimSys.Objects.queue_class import Queue, QueueNode

class HoldingPatternQueue(Queue):
    def __init__(self, base_altitude : float):
        super().__init__()

        self.base_altitude : float = base_altitude
        self.curr_max_altitude : float = 0 #Default to 0 if empty

    #adding 1000ft of vertical separation
    def push(self, plane: Plane) -> None: 
        if self.size == 0:
            self.curr_max_altitude = self.base_altitude
        else:
            self.curr_max_altitude += 1000
        
        super().push(plane)

    #decreasing maximum altitude
    def pop(self) -> Plane:
        if self.size == 1:
            self.curr_max_altitude = 0
        else:
            self.curr_max_altitude -= 1000
        
        return super().pop()
    
    def __addToTop(self, plane : Plane):
        if self._head is not None:
            toMove = self._head
            newHead = QueueNode(plane, toMove, None)
            toMove.prev = newHead
            self._head = newHead
        else:
            self._head = QueueNode(plane, None, None)
            self._tail = self._head

        self.size += 1
    
    def tick_update(self, curr_time: int, sim: Simulation) -> None:
        next_item = self._head
        while next_item is not None:
            nxt = next_item.next
            plane = next_item.val
            plane.update_litres()

            if plane.get_mins_left() < 10:
                #print(f"[{curr_time}s] DIVERSION: {plane.callsign} popped and diverted. Fuel critically low (<10 mins)!")
                sim.diverted_planes_num += 1
                self.remove(next_item)
                
            else:
                if plane.get_mins_left() < 20:
                    plane.declare_emergency()

                if plane._emergency and not plane._emergency_handled:
                    #print(f"[{curr_time}s] EMERGENCY: {plane.callsign} declaring fuel emergency (<20 mins). Bumping to top of hold.")
                    self.remove(next_item)
                    self.__addToTop(plane)
                    plane._emergency_handled = True

            next_item = nxt

    
    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not Implemented"



        
