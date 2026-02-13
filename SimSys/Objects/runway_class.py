from __future__ import annotations

from abc import ABC, abstractmethod

from typing import TYPE_CHECKING, TypeVar, Generic
if TYPE_CHECKING:
    from .plane import Plane # type: ignore[attr-defined]
    
from SimSys.Objects.queue_class import Queue

Q = TypeVar("Q", bound=Queue)

class Runway(ABC, Generic[Q]):
    def __init__(self, number : int, bearing : int):
        self.number : int = number
        self.bearing : int = bearing
        self.free : bool = True
        self.occupier : Plane | None = None
        self.mode : str = ""
        self.status : str = "Available"
        self.expected_free_time : int = 0 #time until runway becomes free
        self._length = 10000 #in ft, used to calculate timings.

    def load(self, queue : Q) -> None:
        if not self.free:
            raise RuntimeError("Cannot load runway: Currently in use!")

        if queue.size != 0:
            self.occupier = queue.pop()
            self.free = False
            self.status = "Runway in use"

        #Let concrete methods extend and deal with the expected free time.

    def unload(self) -> None:
        self.occupier = None
        self.expected_free_time = 0
        self.free = True
        self.status = "Available"

    @abstractmethod
    def to_string(self) -> str:
        ...

    @abstractmethod
    def get_json_dict(self) -> dict:
        ...

    @abstractmethod
    def tick_update(self) -> None:
        ...




    

    