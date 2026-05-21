/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Species } from '../types';

export interface GridAgent {
  id: string;
  species: Species;
  position: { x: number; y: number; z: number };
}

export class SpatialHashGrid<T extends GridAgent> {
  private cellSize: number;
  private grid: Map<string, T[]>;

  constructor(cellSize: number = 8) {
    this.cellSize = cellSize;
    this.grid = new Map<string, T[]>();
  }

  /**
   * Clears the grid
   */
  public clear(): void {
    this.grid.clear();
  }

  /**
   * Generates a key for the coordinates
   */
  private getKey(x: number, z: number): string {
    const ix = Math.floor(x / this.cellSize);
    const iz = Math.floor(z / this.cellSize);
    return `${ix},${iz}`;
  }

  /**
   * Inserts an agent into the grid based on its position
   */
  public insert(agent: T): void {
    const key = this.getKey(agent.position.x, agent.position.z);
    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(agent);
  }

  /**
   * Retrieves all agents within the matching cells overlapping the radius
   */
  public getNeighbors(x: number, z: number, radius: number): T[] {
    const minX = x - radius;
    const maxX = x + radius;
    const minZ = z - radius;
    const maxZ = z + radius;

    const startX = Math.floor(minX / this.cellSize);
    const endX = Math.floor(maxX / this.cellSize);
    const startZ = Math.floor(minZ / this.cellSize);
    const endZ = Math.floor(maxZ / this.cellSize);

    const result: T[] = [];

    for (let ix = startX; ix <= endX; ix++) {
      for (let iz = startZ; iz <= endZ; iz++) {
        const key = `${ix},${iz}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const agent = cell[i];
            // Calculate actual distance on X-Z plane to filter out cell corners
            const dx = agent.position.x - x;
            const dz = agent.position.z - z;
            if (dx * dx + dz * dz <= radius * radius) {
              result.push(agent);
            }
          }
        }
      }
    }

    return result;
  }
}
