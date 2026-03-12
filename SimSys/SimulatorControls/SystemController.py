from SimSys.Objects.Simulation import Simulation, UserConfig
from SimSys.Objects.TakeOffRunway import TakeOffRunway
from SimSys.Objects.MixedRunway import MixedRunway
from SimSys.Objects.LandingRunway import LandingRunway
import copy


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

    def get_sim_details(self, version: tuple[int, int]):
        maj, mir = version
        try:
            target_sim: Simulation = self.sim_majors[maj][mir]
        except KeyError:
            raise KeyError(f"Simulation version {maj}.{mir} does not exist. Cannot Change Config for non-existent sim")
        
        adapted_schedule = target_sim.user_config_schedule[0].runways
        runway_count = 0
        for i in range(0,9):
            if adapted_schedule[i] != None:
                runway_count+=1 
        inbound, outbound = target_sim.inbound_outbound()
        return runway_count, inbound, outbound 

    def create_runway_map(self, runway_configuration: tuple[int, int, int]):
        tf, mx, ld = runway_configuration
        runway = (
            [("Takeoff", "Available")] * tf +
            [("Mixed", "Available")] * mx +
            [("Landing", "Available")] * ld
        )
        runway += [None] * (10 - len(runway))
        return runway # Big question, does there need to be None Runways? 
    
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

    def start_sim(self, runway_configuration: tuple[int, int, int] | None = None, inbound_flow: int | None = None, outbound_flow: int | None = None, max_hq: int | None = None , max_tq: int | None = None) -> str: # Creating Tabs/ Starting first sim x.0s 
        # runway_configuration = [takeoff, mixed, landing]

        # Since it's a new major version make a new dict
        new_sim_minor: dict[int, Simulation] = {}
        if runway_configuration == None:
            runwaymap = self.default_runway_config
        else:
            runwaymap = self.create_runway_map(runway_configuration)

        user_config = {0: UserConfig(runwaymap, max_hq, max_tq, None)}

        if not self.sim_majors: # First time = main menu start
            new_sim_minor[0] = Simulation("1.0", user_config, inbound_flow, outbound_flow)
            self.sim_majors[1] = new_sim_minor # Add to sim_majors dict
        else:
            newest_major: int = len(self.sim_majors)+1
            new_sim_minor[0] = Simulation(f"{newest_major}.0", user_config, inbound_flow, outbound_flow)
            self.sim_majors[newest_major] = new_sim_minor
            self.current_focus = (newest_major, 0)

        new_sim_minor[0].run() # Now actually run the simulation, should generate a json log file.
        return self.load_sim(self.current_focus) 
        # Returns json file path

    # Takes a simulation version, runway changes, and emergency plane changes. 
    def change_runway_config(self, version: tuple[int, int], r_changes: list[tuple[int,int,str,str]], p_changes: list[int, str]) -> str : # Creating Sim. Copies, x.1, x.2s and x.3s etc
        maj, mir = version
        if not self.sim_majors:
            raise IndexError("No Major Sims have been generated yet. Therefore cannot create a copy.")

        try:
            target_sim: Simulation = self.sim_majors[maj][mir]
        except KeyError:
            raise KeyError(f"Simulation version {maj}.{mir} does not exist. Cannot Change Config for non-existent sim")
        
        newest_minor = len(self.sim_majors[maj])

        adapted_schedule = target_sim.user_config_schedule
        # print(adapted_schedule)
        inbound, outbound = target_sim.inbound_outbound()

        for tick, runway_num, newmode, newstatus in r_changes:  # Added newstatus into configuration
            # Find most recent config before this tick
            previous_tick = max(t for t in adapted_schedule if t <= tick)

            base_config = adapted_schedule[previous_tick]
            new_config = copy.deepcopy(base_config)
            oldmode, oldstatus = new_config.runways[runway_num-1]
            if oldmode == newmode and oldstatus == newstatus:
                raise KeyError(f"Runway {runway_num} config already set.")

            new_config.runways[runway_num-1] = (newmode, newstatus)   # If either one changes, means the runway needs to be set to new config. 
            adapted_schedule[tick] = new_config

            print(f"Added change at tick {tick}")

        if p_changes != None:
            for i in range(len(p_changes)):
                tick, callsign = p_changes[i] # Grab the changes from the input, and iterate through all changes. 
                for sch_tick, old_config in adapted_schedule.items():
                    if tick == sch_tick:
                        if callsign in adapted_schedule[tick].emergency_callsign: # If there's not change then 
                            raise KeyError (f"Plane {callsign} Emergency Config is already set to this.")
                        else:
                            adapted_schedule[sch_tick].emergency_callsign.append(callsign)

        print(adapted_schedule)
        newSim = Simulation(f"{maj}.{newest_minor}", adapted_schedule, inbound, outbound)
        self.sim_majors[maj][newest_minor] = newSim
        self.current_focus = (maj, newest_minor)
        newSim.run()
 
        return self.load_sim(self.current_focus)
        # Returns json file path
        pass

    def duplicate_simulation(self, major: int, minor: int):
        if not self.sim_majors:
            raise IndexError("No Major Sims have been generated yet. Therefore cannot create a copy.")
        
        try:
            target_sim: Simulation = self.sim_majors[major][minor]
        except KeyError:
            raise KeyError(f"Simulation version {major}.{minor} does not exist. Cannot copy sim for non-existent sim")
        
        newest_minor = len(self.sim_majors[major])
        target_sim_user_config = target_sim.user_config_schedule
        inbound, outbound = target_sim.inbound_outbound()
        newSim = Simulation("f{major}.{newest_minor}", target_sim_user_config, inbound, outbound)
        self.sim_majors[major][newest_minor] = newSim
        self.current_focus = (major, newest_minor)

        # Essentially, we don't need to waste time rerunning the sim we've already ran, and also, when you make a sim copy, you're basically about to make changes to it.
        # Does not return anything, just the front end letting the backend know that there's a sim tab. 
        return True

    
if __name__ == "__main__": # When debugging/testing this file, it will try create 2 fresh sims. 1.0 and 2.0
    sysCtrl = SystemController()
    testrunwaychanges = [(100, 2, "Landing", "Available"), (102, 2, "Takeoff", "Snow Clearance"), (104, 2, "Mixed", "Available")]
    testemergency = "Not Implemented, no idea what callsigns exist currently."
    
    print(sysCtrl.start_sim((3,3,3)))  # No parameters should mean it takes a default config. 
    runwayCount, inbound, outbound = sysCtrl.get_sim_details((1,0))
    print(f"Sim 1.0 details: {runwayCount} Runways, {inbound} Inbound Flow, {outbound} Outbound Flow")
    print(sysCtrl.change_runway_config((1,0),testrunwaychanges, None))


