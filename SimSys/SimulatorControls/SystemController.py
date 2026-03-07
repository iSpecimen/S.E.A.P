from SimSys.Objects.Simulation import Simulation
from SimSys.Objects.TakeOffRunway import TakeOffRunway
from SimSys.Objects.MixedRunway import MixedRunway
from SimSys.Objects.LandingRunway import LandingRunway

class SystemController():
    def __init__(self):
        self.sim_majors: dict[int, dict[int, Simulation]] = {} # BEWARE THAT MAJORS START INCREMENT FROM 1, MINORS START FROM 0
        # Simulations will be keyed by their versions 
        # dict[major, dict[minor, Simulation]]
        # sim_majors[1][0] = sim 1.0
        # (major) "1.x, 2.x, 3.x..."
        # (minor) "x.0, x.1, x.2..."
        self.current_focus: tuple[int,int] = (1,0)
        self.default_runway_config = {0: ["Takeoff", "Mixed", "Landing", None, None, None, None, None, None, None]}
    
    def create_runway_map(self, runway_configuration: tuple[int, int, int]):
        tf, mx, ld = runway_configuration
        runway = (
            ["Takeoff"] * tf +
            ["Mixed"] * mx +
            ["Landing"] * ld
        )
        runway += [None] * (10 - len(runway))
        return {0: runway} # Big question, does there need to be None Runways? 
    
    def get_current_focus(self):
        return self.current_focus
    
    def load_sim(self, sim_version: tuple[int, int]) -> tuple[str, str]: # Changing Tab focus to new sim. Will return file_path and file_name
        if not self.sim_majors:
            raise IndexError("No Major Sims have been generated yet.")
        
        major, minor = sim_version
        try:
            target_sim: Simulation = self.sim_majors[major][minor]
        except KeyError:
            raise KeyError(f"Simulation version {major}.{minor} does not exist.")
        
        # Return the json log file path
        return target_sim.get_state_log()

    def start_sim(self, runway_configuration: tuple[int, int, int] | None = None, inbound_flow: int | None = None, outbound_flow: int | None = None) -> str: # Creating Tabs/ Starting first sim x.0s 
        # runway_configuration = [takeoff, mixed, landing]
        
        # Since it's a new major version make a new dict
        new_sim_minor: dict[int, Simulation] = {}
        if runway_configuration == None:
            runwaymap = self.default_runway_config
        else:
            runwaymap = self.create_runway_map(runway_configuration)
        if not self.sim_majors: # First time = main menu start
            new_sim_minor[0] = Simulation("1.0", runwaymap, inbound_flow, outbound_flow)
            self.sim_majors[1] = new_sim_minor # Add to sim_majors dict
        else:
            newest_major: int = len(self.sim_majors)+1
            new_sim_minor[0] = Simulation(f"{newest_major}.0", runwaymap, inbound_flow, outbound_flow)
            self.sim_majors[newest_major] = new_sim_minor
            self.current_focus = (newest_major, 0)

        new_sim_minor[0].run() # Now actually run the simulation, should generate a json log file.
        return self.load_sim(self.current_focus) 
        # Returns json file path


    def change_runway_config(self, tick: int, runway_num: int, newmode: str) -> str: # Creating Sim. Copies, x.1, x.2s and x.3s etc
        if not self.sim_majors:
            raise IndexError("No Major Sims have been generated yet. Therefore cannot create a copy.")
        maj, mir = self.current_focus
        try:
            target_sim: Simulation = self.sim_majors[maj][mir]
        except KeyError:
            raise KeyError(f"Simulation version {maj}.{mir} does not exist. Cannot Change Config for non-existent sim")
        newest_minor = len(self.sim_majors[maj])

        adapted_schedule = target_sim.runway_config_schedule
        inbound, outbound = target_sim.inbound_outbound()

        if adapted_schedule[0][runway_num-1] == newmode:
            raise KeyError (f"Runway Config is already set to this.")
        else:
            adapted_schedule[0][runway_num-1] = newmode
            finalconfig = {0: target_sim.runway_config_schedule[0]}
            finalconfig[tick] = adapted_schedule[0]
        newSim = Simulation(f"{maj}.{newest_minor}", finalconfig, inbound, outbound)
        self.sim_majors[maj][newest_minor] = newSim
        self.current_focus = (maj, newest_minor)
        newSim.run()
 
        return self.load_sim(self.current_focus) 
        # Returns json file path
        pass

    
if __name__ == "__main__": # When debugging/testing this file, it will try create 2 fresh sims. 1.0 and 2.0
    sysCtrl = SystemController()
    print(sysCtrl.start_sim((3,3,3)))  # No parameters should mean it takes a default config. 
    print(sysCtrl.change_runway_config(1000, 2, "Landing"))


