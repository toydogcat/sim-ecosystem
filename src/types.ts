/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Species {
  Plant = 'Plant',
  Insect = 'Insect',
  Herbivore = 'Herbivore',
  Bird = 'Bird',
  Carnivore = 'Carnivore'
}

export enum AgentState {
  Wander = 'Wander',
  Forage = 'Forage', // Searching for general food
  Pursue = 'Pursue', // Actively chasing a target (prey or mate)
  Flee = 'Flee',     // Running away from a predator
  Eat = 'Eat',       // Feeding action
  Reproduce = 'Reproduce' // Trying to mate
}

export interface SimulationParams {
  // Environment
  tickRate: number;        // Physics ticks per render frame (e.g. 1, 2, 3)
  mapSize: number;         // Arena dimensions (width/depth)
  disasterSeverity: number; // Percentage of population wiped by disaster (0-100)

  // Growth & Metabolism
  plantGrowthRate: number;      // How frequently new plants spawn automatically (chance/tick)
  plantMaxPopulation: number;  // Caps plant count to prevent performance bottlenecks
  herbivoreMetabolism: number;  // Multiplier for hunger depletion rate for herbivores
  carnivoreMetabolism: number;  // Multiplier for hunger depletion rate for carnivores
  insectMetabolism: number;     // Multiplier for hunger depletion rate for insects
  birdMetabolism: number;       // Multiplier for hunger depletion rate for birds

  // Behaviors
  reproductionRate: number;     // Success rate / cooldown multiplier for reproduction
  reproductionThreshold: number; // Hunger level above which reproduction is desired (0-100)
  
  // Vision Ranges (Radius)
  insectVision: number;
  herbivoreVision: number;
  birdVision: number;
  carnivoreVision: number;

  // Maximum speeds
  insectMaxSpeed: number;
  herbivoreMaxSpeed: number;
  birdMaxSpeed: number;
  carnivoreMaxSpeed: number;
  
  // Weights for Flocking forces (for Herbivores)
  boidsSeparation: number;
  boidsAlignment: number;
  boidsCohesion: number;
}

export const DEFAULT_PARAMS: SimulationParams = {
  tickRate: 1,
  mapSize: 120,
  disasterSeverity: 50,
  
  plantGrowthRate: 0.15,
  plantMaxPopulation: 300,
  herbivoreMetabolism: 0.08,
  carnivoreMetabolism: 0.16,
  insectMetabolism: 0.05,
  birdMetabolism: 0.07,

  reproductionRate: 0.5,
  reproductionThreshold: 55,

  insectVision: 15,
  herbivoreVision: 20,
  birdVision: 35,
  carnivoreVision: 25,

  insectMaxSpeed: 0.4,
  herbivoreMaxSpeed: 0.6,
  birdMaxSpeed: 0.95,
  carnivoreMaxSpeed: 1.05,

  boidsSeparation: 1.5,
  boidsAlignment: 1.0,
  boidsCohesion: 1.0,
};

export interface AgentRecord {
  id: string;
  species: Species;
  state: AgentState;
  health: number;
  energy: number;
  age: number;
  position: { x: number; y: number; z: number };
}

export interface SimulationStats {
  plantCount: number;
  insectCount: number;
  herbivoreCount: number;
  birdCount: number;
  carnivoreCount: number;
  birthCount: number;
  deathCount: number;
  elapsedTime: number;
}
