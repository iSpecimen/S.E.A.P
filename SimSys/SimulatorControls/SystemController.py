from SimSys.Objects.Simulation import Simulation

class SystemController():
    def __init__(self):
        self.sim_majors: dict[int, dict[int, Simulation]] = {} # BEWARE THAT MAJORS START INCREMENT FROM 1, MINORS START FROM 0
        # Simulations will be keyed by their versions 
        # dict[major, dict[minor, Simulation]]
        # sim_majors[1][0] = sim 1.0
        # (major) "1.x, 2.x, 3.x..."
        # (minor) "x.0, x.1, x.2..."
        self.current_focus: tuple[int,int] = (1,0)
    
    
    def load_sim(self, sim_version: tuple[int, int]) -> str: # Changing Tabs
        if not self.sim_majors:
            raise IndexError("No Major Sims have been generated yet.")
        
        major, minor = sim_version
    
        try:
            target_sim: Simulation = self.sim_majors[major][minor]
        except KeyError:
            raise KeyError(f"Simulation version {major}.{minor} does not exist.")
        
        # Return the json log file path
        return str(target_sim._logger._file_path)

    def start_sim(self) -> str: # Creating Tabs/ Starting first sim x.0s 
        # Since it's a new major version make a new dict
        new_sim_minor: dict[int, Simulation] = {}
        if not self.sim_majors: # First time = main menu start
            new_sim_minor[0] = Simulation("1.0")
            self.sim_majors[1] = new_sim_minor # Add to sim_majors dict
        else:
            newest_major: int = len(self.sim_majors)+1
            new_sim_minor[0] = Simulation(f"{newest_major}.0")
            self.sim_majors[newest_major] = new_sim_minor
            self.current_focus = (newest_major, 0)

        new_sim_minor[0].run() # Now actually run the simulation, should generate a json log file.
        return self.load_sim(self.current_focus) 
        # Returns json file path


    def change_runway_config(self) -> str: # Creating Sim. Copies, x.1, x.2s and x.3s etc
        if not self.sim_majors:
            raise IndexError("No Major Sims have been generated yet. Therefore cannot create a copy.")
        maj, mir = self.current_focus
        try:
            target_sim: Simulation = self.sim_majors[maj][mir]
        except KeyError:
            raise KeyError(f"Simulation version {maj}.{mir} does not exist. Cannot Change Config for non-existent sim")

        # Returns json file path
        pass

if __name__ == "__main__":
    sysCtrl = SystemController()
    print(sysCtrl.start_sim())