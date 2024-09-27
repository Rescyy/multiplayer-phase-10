class PlayerInstance:
    def __init__(self, name: str, order: int):
        self.name = name
        self.order = order
        self.hand = []
        self.phase = None
        self.completed_phases = []
        self.points = 0
        self.skipped = False