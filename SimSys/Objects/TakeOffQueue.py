from queue_class import Queue

class TakeOffQueue(Queue):
    def __init__(self):
        super().__init__()

    def tick_update(self) -> None:
        ...
    
    def get_json_dict(self) -> dict:
        return {"Not": "Implemented"}
    
    def to_string(self) -> str:
        return "Not Implemented"