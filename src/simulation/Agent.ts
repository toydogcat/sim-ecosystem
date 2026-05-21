/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Species, AgentState, SimulationParams, DEFAULT_PARAMS } from '../types';

let agentIdCounter = 0;
function generateId(): string {
  agentIdCounter++;
  return `${Date.now()}-${agentIdCounter}`;
}

export class Agent {
  public id: string;
  public species: Species;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public acceleration: THREE.Vector3;
  public health: number = 100;
  public energy: number = 80; // Hunger meters
  public age: number = 0;
  public reproductiveUrge: number = 0;
  public state: AgentState = AgentState.Wander;
  public isDead: boolean = false;
  
  // Custom specifications per agent
  public size: number = 1.0;
  public maxSpeed: number = 1.0;
  public visionRadius: number = 20;
  public maxLife: number = 100;
  public matureAge: number = 10;
  
  public deathReason: 'starvation' | 'old_age' | 'eaten' | '' = '';
  
  // Three.js visual attachment
  public mesh: THREE.Group | null = null;
  
  // Inside mating state, track target mate
  public mateTargetId: string | null = null;
  public huntTargetId: string | null = null;
  
  // Cooldowns
  public reproductionCooldown: number = 0;
  public actionTimer: number = 0; // standard custom timers
  
  constructor(species: Species, x: number, y: number, z: number) {
    this.id = generateId();
    this.species = species;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      0,
      (Math.random() - 0.5) * 0.5
    );
    this.acceleration = new THREE.Vector3(0, 0, 0);
    
    // Randomized lifetime to prevent synchronized die-offs
    this.maxLife = 80 + Math.random() * 60;
  }

  /**
   * Recursive disposal helper to clean up GPU assets and avoid memory leaks
   */
  public destroy(): void {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
      this.mesh = null;
    }
  }

  /**
   * Builds the low-poly THREE.js visual representation.
   * This is overridden by children.
   */
  public createMesh(): THREE.Group {
    const group = new THREE.Group();
    // Fallback: simple colored box
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    group.add(new THREE.Mesh(geo, mat));
    return group;
  }

  /**
   * Apply a steering force to acceleration
   */
  public applyForce(force: THREE.Vector3): void {
    this.acceleration.add(force);
  }

  /**
   * Steering behavior pointing towards a target
   */
  public seek(targetPos: THREE.Vector3, weight: number = 1.0): THREE.Vector3 {
    const desired = new THREE.Vector3().subVectors(targetPos, this.position);
    const d = desired.length();
    if (d > 0) {
      desired.normalize();
      desired.multiplyScalar(this.maxSpeed);
      const steer = new THREE.Vector3().subVectors(desired, this.velocity);
      steer.clampLength(0, 0.1); // Limit steering force
      steer.multiplyScalar(weight);
      return steer;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * Steering behavior fleeing from a predator
   */
  public flee(predatorPos: THREE.Vector3, weight: number = 1.5): THREE.Vector3 {
    const desired = new THREE.Vector3().subVectors(this.position, predatorPos);
    const d = desired.length();
    if (d > 0 && d < this.visionRadius) {
      desired.normalize();
      desired.multiplyScalar(this.maxSpeed);
      const steer = new THREE.Vector3().subVectors(desired, this.velocity);
      steer.clampLength(0, 0.15); // Powerful fleeing response
      steer.multiplyScalar(weight);
      return steer;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * Smooth wandering steer force
   */
  public wander(weight: number = 0.5): THREE.Vector3 {
    // Standard wander step
    const circleCenter = this.velocity.clone().normalize().multiplyScalar(2.0);
    const displacement = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      this.species === Species.Bird ? (Math.random() - 0.5) * 0.8 : 0,
      (Math.random() - 0.5) * 1.5
    );
    const wanderForce = circleCenter.add(displacement);
    wanderForce.clampLength(0, 0.05);
    wanderForce.multiplyScalar(weight);
    return wanderForce;
  }

  /**
   * Update the physics position, rotation and vital status.
   */
  public update(params: SimulationParams): void {
    if (this.isDead) return;

    // 1. Age progression
    this.age += 0.025;
    if (this.age >= this.maxLife) {
      this.isDead = true;
      this.deathReason = 'old_age';
      return;
    }

    // 2. Cooldown ticks
    if (this.reproductionCooldown > 0) {
      this.reproductionCooldown -= 1;
    }

    // 3. Metabolic depletion
    let metabolism = 0.05;
    if (this.species === Species.Herbivore) metabolism = params.herbivoreMetabolism;
    if (this.species === Species.Carnivore) metabolism = params.carnivoreMetabolism;
    if (this.species === Species.Insect) metabolism = params.insectMetabolism;
    if (this.species === Species.Bird) metabolism = params.birdMetabolism;

    // Speed penalty: running consumes more energy
    const speedRatio = this.velocity.length() / (this.maxSpeed || 1);
    const cost = metabolism * (0.8 + 0.4 * speedRatio);
    this.energy = Math.max(0, this.energy - cost);

    // Starvation check
    if (this.energy <= 0) {
      this.health = Math.max(0, this.health - 0.6); // Starve slowly
      if (this.health <= 0) {
        this.isDead = true;
        this.deathReason = 'starvation';
        return;
      }
    } else {
      // Regenerate health if energy is abundant
      if (this.health < 100) {
        this.health = Math.min(100, this.health + 0.2);
      }
    }

    // 4. Reproductive urge accretion
    if (this.age > this.matureAge && this.energy > params.reproductionThreshold && this.reproductionCooldown <= 0) {
      this.reproductiveUrge = Math.min(100, this.reproductiveUrge + 0.4);
    } else {
      this.reproductiveUrge = Math.max(0, this.reproductiveUrge - 1.0);
    }

    // 5. Physics integration
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0, 0); // Reset acceleration

    // Keep ground animals glued to the pasture surface (y = height adjustment)
    const margin = params.mapSize / 2;
    if (this.species !== Species.Bird) {
      this.position.y = this.size / 2;
    } else {
      // Keep birds within reasonable flight altitudes
      // Allow swooping down to y = 0.2 during pursuit or eating to catch crawling insects
      const minAltitude = (this.state === AgentState.Pursue || this.state === AgentState.Eat) ? 0.2 : 3.0;
      if (this.position.y < minAltitude) {
        this.position.y = minAltitude;
        this.velocity.y = Math.abs(this.velocity.y) * 0.5;
      } else if (this.position.y > 18.0) {
        this.position.y = 18.0;
        this.velocity.y = -Math.abs(this.velocity.y) * 0.5;
      }
    }

    // Boundary constraints: bounce back off walls gracefully
    if (this.position.x < -margin) {
      this.position.x = -margin;
      this.velocity.x *= -1;
    } else if (this.position.x > margin) {
      this.position.x = margin;
      this.velocity.x *= -1;
    }

    if (this.position.z < -margin) {
      this.position.z = -margin;
      this.velocity.z *= -1;
    } else if (this.position.z > margin) {
      this.position.z = margin;
      this.velocity.z *= -1;
    }

    // Update ThreeJS mesh position, orientation, and subtle animations
    this.syncMesh();
  }

  /**
   * Ties simulated physics parameters to the Three.js 3D Mesh
   */
  public syncMesh(): void {
    if (!this.mesh) return;

    this.mesh.position.copy(this.position);

    // Rotate mesh towards motion vector on X-Z plane
    if (this.velocity.x !== 0 || this.velocity.z !== 0) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = angle;
    }

    // Custom mesh scaling based on age & scale
    let scaleMultiplier = 1.0;
    if (this.age < this.matureAge) {
      // Spawn at half size and grow
      scaleMultiplier = 0.5 + 0.5 * (this.age / this.matureAge);
    }
    
    // Death size decay effect
    if (this.isDead) scaleMultiplier = 0.001;

    this.mesh.scale.set(this.size * scaleMultiplier, this.size * scaleMultiplier, this.size * scaleMultiplier);
  }
}

// ==========================================
// 1. PLANT (FLORA) - Producer
// ==========================================
export class PlantAgent extends Agent {
  private baseHeight: number;

  constructor(x: number, y: number, z: number) {
    super(Species.Plant, x, y, z);
    this.maxSpeed = 0; // Totally static
    this.velocity.set(0, 0, 0);
    this.size = 0.8 + Math.random() * 0.6;
    this.matureAge = 4;
    this.maxLife = 50 + Math.random() * 40;
    this.baseHeight = this.size;
  }

  public override createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Small stem/trunk
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 5);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.15;
    group.add(trunk);

    // Low-poly round bush/leaves
    const foliageColors = [0x2e8b57, 0x3cb371, 0x228b22, 0x006400];
    const chosenColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];
    const foliageMat = new THREE.MeshLambertMaterial({ color: chosenColor, flatShading: true });

    // Multi-faceted cluster of pyramids for high craft look
    const leafGroup = new THREE.Group();
    
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 6), foliageMat);
    cone1.position.y = 0.6;
    leafGroup.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 5), foliageMat);
    cone2.position.y = 0.95;
    leafGroup.add(cone2);

    group.add(leafGroup);

    // Float slightly on pasture
    group.position.y = 0;
    
    this.mesh = group;
    return group;
  }

  public override update(params: SimulationParams): void {
    this.age += 0.015; // Age slower
    if (this.age >= this.maxLife) {
      this.isDead = true;
      this.deathReason = 'old_age';
      return;
    }

    // Photosynthesis: plants absorb energy automatically from the sun!
    this.energy = Math.min(100, this.energy + 0.12);
    if (this.energy > params.reproductionThreshold) {
      this.reproductiveUrge = Math.min(100, this.reproductiveUrge + 0.5);
    }

    this.syncMesh();
  }
}

// ==========================================
// 2. INSECT - Primary Consumer (Small)
// ==========================================
export class InsectAgent extends Agent {
  constructor(x: number, y: number, z: number) {
    super(Species.Insect, x, y, z);
    this.size = 0.45;
    this.maxSpeed = DEFAULT_PARAMS.insectMaxSpeed;
    this.visionRadius = DEFAULT_PARAMS.insectVision;
    this.matureAge = 5;
    this.maxLife = 60 + Math.random() * 40;
  }

  public override createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Cute beetle body: segmented red-orange sphere
    const bodyGeo = new THREE.SphereGeometry(0.35, 6, 6);
    // Scale body longways
    bodyGeo.scale(1.2, 0.8, 0.8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xdf7413, flatShading: true }); // bright orange
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.15;
    group.add(body);

    // Tiny black strip
    const stripeGeo = new THREE.BoxGeometry(0.5, 0.05, 0.05);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.2, 0);
    group.add(stripe);

    // Insect antennae
    const antGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4);
    const antMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    
    const leftAnt = new THREE.Mesh(antGeo, antMat);
    leftAnt.rotation.z = Math.PI / 4;
    leftAnt.position.set(0.18, 0.25, 0.15);
    group.add(leftAnt);

    const rightAnt = leftAnt.clone();
    rightAnt.position.x = -0.18;
    rightAnt.rotation.z = -Math.PI / 4;
    group.add(rightAnt);

    this.mesh = group;
    return group;
  }
}

// ==========================================
// 3. HERBIVORE (RABBIT/DEER) - Flocking Flock Consumer
// ==========================================
export class HerbivoreAgent extends Agent {
  constructor(x: number, y: number, z: number) {
    super(Species.Herbivore, x, y, z);
    this.size = 0.9;
    this.maxSpeed = DEFAULT_PARAMS.herbivoreMaxSpeed;
    this.visionRadius = DEFAULT_PARAMS.herbivoreVision;
    this.matureAge = 12;
    this.maxLife = 100 + Math.random() * 60;
  }

  public override createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body: cylindrical boxy shape, light tan
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.7, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c, flatShading: true }); // Tan
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    group.add(body);

    // Cute bunny ears!
    const earGeo = new THREE.BoxGeometry(0.08, 0.4, 0.06);
    const earMat = new THREE.MeshLambertMaterial({ color: 0xffe4e1, flatShading: true }); // Pink interior look
    
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(0.15, 0.85, 0.15);
    leftEar.rotation.z = -0.1;
    group.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = -0.15;
    rightEar.rotation.z = 0.1;
    group.add(rightEar);

    // Tail (small sphere)
    const tailGeo = new THREE.SphereGeometry(0.12, 4, 4);
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.45, -0.38);
    group.add(tail);

    this.mesh = group;
    return group;
  }

  /**
   * Computes standard flocking (Boids forces) based on neighbors
   */
  public computeBoidForces(neighbors: HerbivoreAgent[], params: SimulationParams): THREE.Vector3 {
    const flockForce = new THREE.Vector3(0, 0, 0);
    if (neighbors.length === 0) return flockForce;

    const separation = new THREE.Vector3(0, 0, 0);
    const alignment = new THREE.Vector3(0, 0, 0);
    const cohesion = new THREE.Vector3(0, 0, 0);

    let sepCount = 0;
    let alignCount = 0;
    let cohCount = 0;

    const sepDist = 3.5; // distance inside which agents push apart

    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      if (neighbor.id === this.id) continue;

      const d = this.position.distanceTo(neighbor.position);

      // 1. Separation
      if (d > 0 && d < sepDist) {
        const diff = new THREE.Vector3().subVectors(this.position, neighbor.position);
        diff.normalize();
        diff.divideScalar(d); // Closer neighbor: stronger pushing force
        separation.add(diff);
        sepCount++;
      }

      // 2. Alignment & 3. Cohesion
      alignment.add(neighbor.velocity);
      alignCount++;

      cohesion.add(neighbor.position);
      cohCount++;
    }

    // Assemble forces
    if (sepCount > 0) {
      separation.divideScalar(sepCount);
      separation.normalize();
      separation.multiplyScalar(this.maxSpeed);
      separation.sub(this.velocity);
      separation.clampLength(0, 0.15);
      separation.multiplyScalar(params.boidsSeparation);
      flockForce.add(separation);
    }

    if (alignCount > 0) {
      alignment.divideScalar(alignCount);
      alignment.normalize();
      alignment.multiplyScalar(this.maxSpeed);
      alignment.sub(this.velocity);
      alignment.clampLength(0, 0.1);
      alignment.multiplyScalar(params.boidsAlignment);
      flockForce.add(alignment);
    }

    if (cohCount > 0) {
      cohesion.divideScalar(cohCount);
      const steer = this.seek(cohesion, params.boidsCohesion);
      steer.clampLength(0, 0.08);
      flockForce.add(steer);
    }

    return flockForce;
  }
}

// ==========================================
// 4. BIRD - Secondary Flying Predator
// ==========================================
export class BirdAgent extends Agent {
  private flapFactor: number = 0;
  private wingGroupL: THREE.Mesh | null = null;
  private wingGroupR: THREE.Mesh | null = null;
  public altitudeTarget: number = 10.0;

  constructor(x: number, y: number, z: number) {
    // Flying bird: starts off the ground in index air zone [5, 12]
    super(Species.Bird, x, 7 + Math.random() * 6, z);
    this.size = 0.85;
    this.maxSpeed = DEFAULT_PARAMS.birdMaxSpeed;
    this.visionRadius = DEFAULT_PARAMS.birdVision;
    this.matureAge = 8;
    this.maxLife = 90 + Math.random() * 50;
    this.flapFactor = Math.random() * 100;
  }

  public override createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body: sleek cone pointing forward
    const bodyGeo = new THREE.ConeGeometry(0.28, 0.8, 5);
    // Point the cone forward (by default pointing up, so rotate x)
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4169e1, flatShading: true }); // Royal Blue
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Beak
    const beakGeo = new THREE.ConeGeometry(0.1, 0.25, 4);
    beakGeo.rotateX(Math.PI / 2);
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xffd700, flatShading: true }); // Gold
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0.1, 0.45);
    group.add(beak);

    // Left Wing (flat box)
    const wingGeo = new THREE.BoxGeometry(0.65, 0.04, 0.25);
    const wingMat = new THREE.MeshLambertMaterial({ color: 0x1e90ff, flatShading: true }); // Dodgy Blue
    
    this.wingGroupL = new THREE.Mesh(wingGeo, wingMat);
    // Shift model center to flock-pivot connection joins
    this.wingGroupL.geometry.translate(0.325, 0, 0);
    this.wingGroupL.position.set(0.18, 0.18, 0);
    group.add(this.wingGroupL);

    // Right Wing
    this.wingGroupR = new THREE.Mesh(wingGeo, wingMat);
    this.wingGroupR.geometry.translate(-0.325, 0, 0);
    this.wingGroupR.position.set(-0.18, 0.18, 0);
    group.add(this.wingGroupR);

    this.mesh = group;
    return group;
  }

  public override syncMesh(): void {
    super.syncMesh();
    if (!this.mesh) return;

    // Custom 3D diving rotations
    const forwardInXZ = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    if (forwardInXZ.length() > 0.01) {
      // Angle relative to XZ plane (dive/climb angle)
      const pitch = Math.atan2(this.velocity.y, forwardInXZ.length());
      // Apply pitch to mesh
      this.mesh.rotation.x = -pitch;
    }

    // Elegant flapping logic! Wing rotates over sinusoid
    this.flapFactor += 0.22;
    const flapAngle = Math.sin(this.flapFactor) * 0.35;
    
    if (this.wingGroupL) {
      this.wingGroupL.rotation.z = flapAngle;
    }
    if (this.wingGroupR) {
      this.wingGroupR.rotation.z = -flapAngle;
    }
  }
}

// ==========================================
// 5. CARNIVORE - App Predator (Wolf/Fox)
// ==========================================
export class CarnivoreAgent extends Agent {
  constructor(x: number, y: number, z: number) {
    super(Species.Carnivore, x, y, z);
    this.size = 1.35;
    this.maxSpeed = DEFAULT_PARAMS.carnivoreMaxSpeed;
    this.visionRadius = DEFAULT_PARAMS.carnivoreVision;
    this.matureAge = 14;
    this.maxLife = 120 + Math.random() * 80;
  }

  public override createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body: Heavy blocky crimson shape
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.5, 1.1);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xbf2c2c, flatShading: true }); // Crimson Red
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    group.add(body);

    // Menacing snout/jaw block
    const snoutGeo = new THREE.BoxGeometry(0.32, 0.28, 0.45);
    const snoutMat = new THREE.MeshLambertMaterial({ color: 0x801e1e, flatShading: true }); // Dark block
    const snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.position.set(0, 0.48, 0.65);
    group.add(snout);

    // Small snout point
    const noseGeo = new THREE.BoxGeometry(0.12, 0.1, 0.1);
    const noseMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.54, 0.88);
    group.add(nose);

    // Pointy wolf ears
    const earGeo = new THREE.ConeGeometry(0.1, 0.28, 4);
    const earMat = new THREE.MeshLambertMaterial({ color: 0xbf2c2c, flatShading: true });
    
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(0.16, 0.72, 0.1);
    leftEar.rotation.y = Math.PI / 4;
    group.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = -0.16;
    group.add(rightEar);

    // Glowing yellow eyes!
    const eyeGeo = new THREE.SphereGeometry(0.06, 4, 4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // Yellow glow
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.12, 0.52, 0.72);
    group.add(leftEye);

    const rightEye = leftEye.clone();
    rightEye.position.x = -0.12;
    group.add(rightEye);

    // Pointy fluffy tail
    const tailGeo = new THREE.ConeGeometry(0.16, 0.52, 4);
    tailGeo.rotateX(-Math.PI / 3); // rotate outwards downwards
    const tailMat = new THREE.MeshLambertMaterial({ color: 0x822020 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.35, -0.68);
    group.add(tail);

    this.mesh = group;
    return group;
  }
}
