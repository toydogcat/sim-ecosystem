/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Species, AgentState, SimulationParams, DEFAULT_PARAMS, SimulationStats } from '../types';
import { SpatialHashGrid } from './SpatialHashGrid';
import {
  Agent,
  PlantAgent,
  InsectAgent,
  HerbivoreAgent,
  BirdAgent,
  CarnivoreAgent
} from './Agent';

export class Ecosystem {
  public agents: Agent[] = [];
  public params: SimulationParams;
  public grid: SpatialHashGrid<Agent>;
  public scene: THREE.Scene;
  
  // Stats
  public stats: SimulationStats = {
    plantCount: 0,
    insectCount: 0,
    herbivoreCount: 0,
    birdCount: 0,
    carnivoreCount: 0,
    birthCount: 0,
    deathCount: 0,
    elapsedTime: 0
  };

  // Keep a clean rolling logs of counts for Lotka-Volterra chart visualization
  public history: {
    elapsedTime: number;
    Plant: number;
    Insect: number;
    Herbivore: number;
    Bird: number;
    Carnivore: number;
  }[] = [];
  
  private historyCounter: number = 0;
  private historyInterval: number = 40; // Collect data every 40 ticks

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.params = { ...DEFAULT_PARAMS };
    this.grid = new SpatialHashGrid<Agent>(8);
  }

  /**
   * Set dynamic parameter updates on the fly
   */
  public updateParams(newParams: Partial<SimulationParams>): void {
    this.params = { ...this.params, ...newParams };
    // Synchronize max speeds on active agents
    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      if (a.species === Species.Insect) a.maxSpeed = this.params.insectMaxSpeed;
      if (a.species === Species.Herbivore) a.maxSpeed = this.params.herbivoreMaxSpeed;
      if (a.species === Species.Bird) a.maxSpeed = this.params.birdMaxSpeed;
      if (a.species === Species.Carnivore) a.maxSpeed = this.params.carnivoreMaxSpeed;
    }
  }

  /**
   * Individual spawner helper
   */
  public spawnAgent(species: Species, x: number, z: number): Agent {
    let agent: Agent;

    switch (species) {
      case Species.Plant:
        agent = new PlantAgent(x, 0, z);
        break;
      case Species.Insect:
        agent = new InsectAgent(x, 0.2, z);
        agent.maxSpeed = this.params.insectMaxSpeed;
        agent.visionRadius = this.params.insectVision;
        break;
      case Species.Herbivore:
        agent = new HerbivoreAgent(x, 0.4, z);
        agent.maxSpeed = this.params.herbivoreMaxSpeed;
        agent.visionRadius = this.params.herbivoreVision;
        break;
      case Species.Bird:
        agent = new BirdAgent(x, 10, z);
        agent.maxSpeed = this.params.birdMaxSpeed;
        agent.visionRadius = this.params.birdVision;
        break;
      case Species.Carnivore:
        agent = new CarnivoreAgent(x, 0.5, z);
        agent.maxSpeed = this.params.carnivoreMaxSpeed;
        agent.visionRadius = this.params.carnivoreVision;
        break;
    }

    // Design visual mesh and link to scene
    const mesh = agent.createMesh();
    this.scene.add(mesh);
    
    // Position mesh sync
    agent.syncMesh();

    this.agents.push(agent);
    
    // Increment birth log
    this.stats.birthCount++;
    this.recalculateCounts();

    return agent;
  }

  /**
   * Spawns a pack of random agents
   */
  public spawnRandomGroup(species: Species, count: number): void {
    const halfSize = this.params.mapSize / 2 - 4;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * halfSize * 2;
      const z = (Math.random() - 0.5) * halfSize * 2;
      this.spawnAgent(species, x, z);
    }
  }

  /**
   * Purges 50% of animal populations resembling natural catastrophe
   */
  public triggerNaturalDisaster(): void {
    // Collect non-plant agents
    const animals = this.agents.filter(a => a.species !== Species.Plant);
    
    // Determine target delete count
    const wipePercent = this.params.disasterSeverity / 100;
    const wipeCount = Math.floor(animals.length * wipePercent);
    
    // Shuffle animals
    const shuffledIdxs = Array.from({ length: animals.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
      
    const victims = new Set<string>();
    for (let i = 0; i < Math.min(wipeCount, shuffledIdxs.length); i++) {
      victims.add(animals[shuffledIdxs[i]].id);
    }

    // Update statuses
    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      if (victims.has(a.id)) {
        a.isDead = true;
        a.deathReason = 'starvation'; // models sudden fatal trauma
      }
    }
  }

  /**
   * Resets entire ecosphere
   */
  public reset(): void {
    // Delete all meshes
    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      if (a.mesh) {
        this.scene.remove(a.mesh);
      }
    }
    this.agents = [];
    this.history = [];
    this.stats.birthCount = 0;
    this.stats.deathCount = 0;
    this.stats.elapsedTime = 0;
    this.historyCounter = 0;
    
    // Populate base biosphere
    this.spawnRandomGroup(Species.Plant, 75);
    this.spawnRandomGroup(Species.Insect, 35);
    this.spawnRandomGroup(Species.Herbivore, 22);
    this.spawnRandomGroup(Species.Bird, 12);
    this.spawnRandomGroup(Species.Carnivore, 5);
  }

  /**
   * Ticks a single simulation step
   */
  public step(): void {
    this.stats.elapsedTime++;

    // 1. Clear and populate spatial hash grid
    this.grid.clear();
    for (let i = 0; i < this.agents.length; i++) {
      if (!this.agents[i].isDead) {
        this.grid.insert(this.agents[i]);
      }
    }

    // 2. Behavioral phase: evaluate AI and compute forces for each agent
    const newBirths: { species: Species; x: number; z: number }[] = [];

    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      if (agent.isDead) continue;

      // Skip behavior for Plants as they are static
      if (agent.species === Species.Plant) continue;

      // Query neighbors inside vision circle
      const neighbors = this.grid.getNeighbors(agent.position.x, agent.position.z, agent.visionRadius);

      // Distribute neighbors by types
      const predators: Agent[] = [];
      const potentialFoods: Agent[] = [];
      const prospectiveMates: Agent[] = [];
      const sameFlock: HerbivoreAgent[] = [];

      for (let j = 0; j < neighbors.length; j++) {
        const other = neighbors[j];
        if (other.id === agent.id || other.isDead) continue;

        // Check if other is a predator
        if (this.isPredator(agent.species, other.species)) {
          predators.push(other);
        }

        // Check if other is potential food
        if (this.isPrey(agent.species, other.species, agent.energy)) {
          potentialFoods.push(other);
        }

        // Check if they can mate (same species, both mature, both sexually responsive)
        if (
          other.species === agent.species &&
          agent.reproductiveUrge > this.params.reproductionThreshold &&
          other.reproductiveUrge > this.params.reproductionThreshold
        ) {
          prospectiveMates.push(other);
        }

        // Collect matching boid members (relevant for Herbivore flocking)
        if (agent.species === Species.Herbivore && other.species === Species.Herbivore) {
          sameFlock.push(other as HerbivoreAgent);
        }
      }

      // ACCUMULATE STEER FORCES
      const fleeForce = new THREE.Vector3(0, 0, 0);
      const pursueForce = new THREE.Vector3(0, 0, 0);
      const flockForce = new THREE.Vector3(0, 0, 0);
      const wanderForce = agent.wander(0.3);

      agent.state = AgentState.Wander;

      // 1. FLEE predator logic (Highest priority)
      if (predators.length > 0) {
        agent.state = AgentState.Flee;
        // Run away from closest predator
        let closestPred: Agent | null = null;
        let minDist = Infinity;
        for (let p = 0; p < predators.length; p++) {
          const d = agent.position.distanceTo(predators[p].position);
          if (d < minDist) {
            minDist = d;
            closestPred = predators[p];
          }
        }
        if (closestPred) {
          fleeForce.add(agent.flee(closestPred.position, 2.0));
        }
      }

      // 2. MATING (Second priority if full and safe)
      let matingTriggered = false;
      if (predators.length === 0 && agent.reproductiveUrge > this.params.reproductionThreshold && prospectiveMates.length > 0) {
        agent.state = AgentState.Reproduce;
        // Steer toward first matching mate
        const targetMate = prospectiveMates[0];
        pursueForce.add(agent.seek(targetMate.position, 1.2));

        // Breeding contact resolver
        const distToMate = agent.position.distanceTo(targetMate.position);
        if (distToMate < (agent.size + targetMate.size) * 1.1) {
          // A child is spawned at midpoint if chance succeeds
          if (Math.random() < this.params.reproductionRate) {
            const midX = (agent.position.x + targetMate.position.x) / 2;
            const midZ = (agent.position.z + targetMate.position.z) / 2;
            newBirths.push({ species: agent.species, x: midX, z: midZ });

            // Subtract energy cost from parents
            agent.energy = Math.max(15, agent.energy - 35);
            targetMate.energy = Math.max(15, targetMate.energy - 35);

            // Set reproduction cooldown
            agent.reproductionCooldown = 120; // 120 ticks before breeding again
            targetMate.reproductionCooldown = 120;

            agent.reproductiveUrge = 0;
            targetMate.reproductiveUrge = 0;
            
            matingTriggered = true;
          }
        }
      }

      // 3. HUNTER / FORAGE (Third priority if hungry)
      if (!matingTriggered && predators.length === 0 && potentialFoods.length > 0 && agent.energy < 75) {
        agent.state = AgentState.Forage;

        // Hunt closest food
        let closestFood: Agent | null = null;
        let minDist = Infinity;
        for (let f = 0; f < potentialFoods.length; f++) {
          const d = agent.position.distanceTo(potentialFoods[f].position);
          if (d < minDist) {
            minDist = d;
            closestFood = potentialFoods[f];
          }
        }

        if (closestFood) {
          agent.state = AgentState.Pursue;

          // Birds swoop downward on Y axis to hunt crawl insects
          if (agent.species === Species.Bird && closestFood.species === Species.Insect) {
            // Dive: adjust height towards insect
            const target = closestFood.position.clone();
            pursueForce.add(agent.seek(target, 1.5));
          } else {
            pursueForce.add(agent.seek(closestFood.position, 1.2));
          }

          // Contact bite collision check
          const chewRadius = (agent.size + closestFood.size) * 0.95;
          const currentDistance = agent.position.distanceTo(closestFood.position);
          
          if (currentDistance <= chewRadius) {
            // Predator eats prey!
            closestFood.isDead = true;
            closestFood.deathReason = 'eaten';
            
            // Gain calorie energy
            let foodValue = 40;
            if (closestFood.species === Species.Plant) foodValue = 35;
            if (closestFood.species === Species.Insect) foodValue = 50;
            if (closestFood.species === Species.Herbivore) foodValue = 85; // Heavy meals!
            
            agent.energy = Math.min(100, agent.energy + foodValue);
            agent.state = AgentState.Eat;
          }
        }
      }

      // 4. Herbivore Flocking weights
      if (agent.species === Species.Herbivore) {
        flockForce.add((agent as HerbivoreAgent).computeBoidForces(sameFlock, this.params));
      }

      // Bird altitude stabilization forces (coax back to the air)
      if (agent.species === Species.Bird && agent.state === AgentState.Wander) {
        const floatTendency = new THREE.Vector3(0, (10 - agent.position.y) * 0.05, 0);
        agent.applyForce(floatTendency);
      }

      // Add final forces
      agent.applyForce(fleeForce);
      agent.applyForce(pursueForce);
      agent.applyForce(flockForce);
      agent.applyForce(wanderForce);
    }

    // 3. Spawn descendants
    for (let k = 0; k < newBirths.length; k++) {
      const b = newBirths[k];
      this.spawnAgent(b.species, b.x, b.z);
    }

    // 4. Update phase: tick physics vectors and death cleanups
    const survivingAgents: Agent[] = [];
    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      
      agent.update(this.params);

      if (agent.isDead) {
        this.stats.deathCount++;
        if (agent.mesh) {
          this.scene.remove(agent.mesh);
        }
      } else {
        survivingAgents.push(agent);
      }
    }
    this.agents = survivingAgents;

    // 5. Soil Plant Growth / Seed dispersion
    const currentPlants = this.agents.filter(a => a.species === Species.Plant);
    
    // Self seeding: existing plants spawn seeds close by
    for (let i = 0; i < currentPlants.length; i++) {
      const parent = currentPlants[i];
      if (parent.reproductiveUrge > 90 && this.agents.length < 500 && currentPlants.length < this.params.plantMaxPopulation) {
        if (Math.random() < this.params.plantGrowthRate * 0.4) {
          const spawnRadius = 3 + Math.random() * 8;
          const theta = Math.random() * Math.PI * 2;
          const childX = parent.position.x + Math.cos(theta) * spawnRadius;
          const childZ = parent.position.z + Math.sin(theta) * spawnRadius;
          
          const halfMap = this.params.mapSize / 2 - 2;
          if (Math.abs(childX) < halfMap && Math.abs(childZ) < halfMap) {
            this.spawnAgent(Species.Plant, childX, childZ);
            parent.reproductiveUrge = 0;
            parent.energy = 40;
          }
        }
      }
    }

    // Baseline spontaneous plant emergence (guarantees pasture handles total local depletion)
    if (currentPlants.length < this.params.plantMaxPopulation && Math.random() < this.params.plantGrowthRate) {
      const halfSize = this.params.mapSize / 2 - 4;
      const x = (Math.random() - 0.5) * halfSize * 2;
      const z = (Math.random() - 0.5) * halfSize * 2;
      this.spawnAgent(Species.Plant, x, z);
    }

    // 6. Aggregate analytics timeline log
    this.recalculateCounts();
    this.historyCounter++;
    if (this.historyCounter >= this.historyInterval) {
      this.historyCounter = 0;
      this.history.push({
        elapsedTime: this.stats.elapsedTime,
        Plant: this.stats.plantCount,
        Insect: this.stats.insectCount,
        Herbivore: this.stats.herbivoreCount,
        Bird: this.stats.birdCount,
        Carnivore: this.stats.carnivoreCount
      });
      // Cap rolling history count to look good
      if (this.history.length > 100) {
        this.history.shift();
      }
    }
  }

  /**
   * Quick predicate mapping if speciesA flees from speciesB
   */
  private isPredator(species: Species, otherSpecies: Species): boolean {
    if (species === Species.Insect && otherSpecies === Species.Bird) return true;
    if (species === Species.Herbivore && otherSpecies === Species.Carnivore) return true;
    return false;
  }

  /**
   * Quick predicate mapping if species can eat other species
   */
  private isPrey(species: Species, otherSpecies: Species, currentEnergy: number): boolean {
    if (species === Species.Insect && otherSpecies === Species.Plant) return true;
    if (species === Species.Herbivore && otherSpecies === Species.Plant) return true;
    if (species === Species.Bird && otherSpecies === Species.Insect) return true;
    if (species === Species.Carnivore) {
      if (otherSpecies === Species.Herbivore) return true;
      // Carnivores hunt fly-birds if hunger is extremely severe (under 25% energy)
      if (otherSpecies === Species.Bird && currentEnergy < 25) return true;
    }
    return false;
  }

  /**
   * Recounts populations
   */
  private recalculateCounts(): void {
    let pls = 0, ins = 0, hbs = 0, bds = 0, crn = 0;
    for (let i = 0; i < this.agents.length; i++) {
      const sp = this.agents[i].species;
      if (sp === Species.Plant) pls++;
      else if (sp === Species.Insect) ins++;
      else if (sp === Species.Herbivore) hbs++;
      else if (sp === Species.Bird) bds++;
      else if (sp === Species.Carnivore) crn++;
    }

    this.stats.plantCount = pls;
    this.stats.insectCount = ins;
    this.stats.herbivoreCount = hbs;
    this.stats.birdCount = bds;
    this.stats.carnivoreCount = crn;
  }
}
