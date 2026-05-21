/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Ecosystem } from '../simulation/Ecosystem';
import { Species, SimulationStats, SimulationParams } from '../types';

interface ViewportProps {
  ecosystem: Ecosystem | null;
  onInit: (eco: Ecosystem) => void;
  onUpdateStats: (stats: SimulationStats) => void;
  isPaused: boolean;
  params: SimulationParams;
}

export default function Viewport({ ecosystem, onInit, onUpdateStats, isPaused, params }: ViewportProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const ecosystemRef = useRef<Ecosystem | null>(null);
  
  // Local loading state
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync parameters to the simulation ref on change
  useEffect(() => {
    if (ecosystemRef.current) {
      ecosystemRef.current.updateParams(params);
    }
  }, [params]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Initialize Scene Details
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505'); // Outer dark abyss
    scene.fog = new THREE.FogExp2('#050505', 0.0065); // Soft volumetric mist

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 55, 95);

    // 3. Renderer configuration
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent camera from slipping under floor
    controls.minDistance = 15;
    controls.maxDistance = 250;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight('#2a2d36', 1.2);
    scene.add(ambientLight);

    // Solar sun casting soft low-poly shadows
    const sunLight = new THREE.DirectionalLight('#fffcf0', 2.2);
    sunLight.position.set(70, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunSunScale(sunLight);
    scene.add(sunLight);

    function sunSunScale(light: THREE.DirectionalLight) {
      const d = 100;
      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;
      light.shadow.bias = -0.0005;
    }

    // Secondary soft blue rim light (futuristic cyberpunk bio-glow)
    const rimLight = new THREE.DirectionalLight('#43c3ff', 0.8);
    rimLight.position.set(-60, 40, -60);
    scene.add(rimLight);

    // 6. Cybernetic Biodome Floor Base
    const radius = params.mapSize / 2;
    
    // Core pasture grass lawn (Green/dark terrain plate)
    const terrainGeo = new THREE.CylinderGeometry(radius, radius, 1.5, 45);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: '#1a2e1d', // Emerald pine lawn
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -0.75;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Cyber Rim Grid Ring
    const rimGeo = new THREE.CylinderGeometry(radius + 1.5, radius + 1.5, 2.0, 45, 1, true);
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#0e1711',
      roughness: 0.5,
      metalness: 0.8
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = -1.0;
    scene.add(rim);

    // Dynamic Circular Grid Helpers
    const outerGrid = new THREE.GridHelper(params.mapSize, 24, '#1c2e23', '#0c140f');
    outerGrid.position.y = 0.01;
    scene.add(outerGrid);

    // Put some cute low poly rocks on outer boundaries
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d, flatShading: true });
    for (let i = 0; i < 15; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(2 + Math.random() * 4, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      
      const angle = (i / 15) * Math.PI * 2 + Math.random() * 0.3;
      const d = radius - 4 - Math.random() * 5;
      rock.position.set(Math.cos(angle) * d, 1 + Math.random() * 0.5, Math.sin(angle) * d);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.scale.set(1, 0.4 + Math.random() * 0.8, 1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }

    // 7. Fire hazard ring when disaster buttons is triggered (Particle mock bounds)
    const domeMat = new THREE.MeshBasicMaterial({
      color: '#00eeff',
      wireframe: true,
      transparent: true,
      opacity: 0.03
    });
    const domeGeo = new THREE.SphereGeometry(radius * 1.1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = -1.0;
    scene.add(dome);

    // 8. Initialize Ecosystem Instance
    const ecoInstance = new Ecosystem(scene);
    ecosystemRef.current = ecoInstance;
    
    // Spawn initial seed arrays
    ecoInstance.updateParams(params);
    ecoInstance.reset();

    // Fire React initialization callback hook
    onInit(ecoInstance);
    setIsInitializing(false);

    // 9. Simulation loop & throttling parameters
    let animationFrameId: number;
    let tickCounter = 0;

    const renderLoop = () => {
      // Step simulation if active
      if (!isPaused && ecosystemRef.current) {
        const speedMultiplier = ecosystemRef.current.params.tickRate;
        if (speedMultiplier >= 1) {
          for (let s = 0; s < speedMultiplier; s++) {
            ecosystemRef.current.step();
          }
        } else {
          const eco = ecosystemRef.current as any;
          if (!eco._tickAccumulator) {
            eco._tickAccumulator = 0;
          }
          eco._tickAccumulator += speedMultiplier;
          if (eco._tickAccumulator >= 1) {
            eco.step();
            eco._tickAccumulator -= 1;
          }
        }
      }

      // Smooth Orbit Controls
      controls.update();

      // Mirror state changes back to React inside controlled frequencies
      tickCounter++;
      if (tickCounter >= 6) { // ~10 updates per second, fast enough for display counters without React lag!
        tickCounter = 0;
        if (ecosystemRef.current) {
          onUpdateStats({ ...ecosystemRef.current.stats });
        }
      }

      // Render graphics
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    // 10. Handles frame size scaling safely
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    });
    resizeObserver.observe(container);

    // 11. Component Unmount Disposal
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Clean up meshes in scene
      if (ecosystemRef.current) {
        for (const a of ecosystemRef.current.agents) {
          if (a.mesh) {
            scene.remove(a.mesh);
          }
        }
      }
    };
  }, [onInit, isPaused]);

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden">
      {/* 3D WebGL Target Anchor */}
      <div ref={mountRef} className="w-full h-full outline-none" id="viewport-canvas-container" />

      {/* Loading HUD Loader overlay */}
      {isInitializing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/95 backdrop-blur-md">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <span className="w-12 h-12 rounded-full border border-teal-500 border-t-transparent animate-spin" />
            <span className="absolute w-6 h-6 rounded-full border border-amber-500 border-b-transparent animate-spin-reverse animate-duration-1000" />
          </div>
          <p className="mt-4 font-mono text-xs text-neutral-400 tracking-wider">INITIATING BIODOME MATRIX...</p>
        </div>
      )}

      {/* Canvas Hover Info Legend Badge */}
      {!isInitializing && (
        <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md border border-neutral-900 rounded-xl px-4 py-2 text-white">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sans font-medium text-xs text-neutral-200 uppercase tracking-widest leading-none">Biodome Simulator v2.4</span>
          </div>
          
          <div className="bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-xl px-3 py-2 text-[10px] text-neutral-400 font-mono flex flex-col gap-1">
            <span className="text-neutral-500">Left-Click + Drag: Rotate Camera</span>
            <span className="text-neutral-500">Right-Click + Drag: Pan</span>
            <span className="text-neutral-500">Scroll: Zoom In/Out</span>
          </div>
        </div>
      )}
    </div>
  );
}
