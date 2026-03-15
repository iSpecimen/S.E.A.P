"""
Abstract base definitions for runway properties and operations.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, TypeVar, Generic, Any

if TYPE_CHECKING:
    from .Plane import Plane 
    
from SimSys.Objects.queue_class import Queue

Q = TypeVar("Q", bound=Queue)

class Runway(ABC, Generic[Q]):
    """Base abstract class representing a physical airport runway."""
    
    def __init__(self, number: int, bearing: int, status: str) -> None:
        """Initializes the runway with its physical parameters and operational status."""
        self.number: int = number
        self.bearing: int = bearing
        self.free: bool = True
        self.occupier: Plane | None = None
        self.mode: str = ""
        self.status: str = status
        self.expected_free_time: int = 0
        self._length: int = 10000 
        self._disabled: bool = (status.lower() != "available")
        self._default: str = status

    def load(self, queue: Q) -> None:
        """Pops a plane from the provided queue and assigns it to the runway."""
        if not self.free:
            raise RuntimeError("Cannot load runway: Currently in use!")

        if queue.size != 0 and not self._disabled:
            self.occupier = queue.pop()
            self.free = False
            self.status = "Runway in use"

    def unload(self) -> None:
        """Frees the runway and clears the occupying plane object."""
        self.occupier = None
        self.expected_free_time = 0
        self.free = True
        self.status = self._default

    @abstractmethod
    def tick_update(self, curr_time: int, sim: Any) -> None:
        """Abstract method to handle tick-by-tick simulation logic."""
        ...