/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Play, ShieldAlert, Cpu } from 'lucide-react';
import { Species, SimulationParams, DEFAULT_PARAMS, SimulationStats } from './types';
import { Ecosystem } from './simulation/Ecosystem';
import Viewport from './components/Viewport';
import Sidebar from './components/Sidebar';
import { Language, TRANSLATIONS } from './translations';

export default function App() {
  const [ecosystem, setEcosystem] = useState<Ecosystem | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [params, setParams] = useState<SimulationParams>({ ...DEFAULT_PARAMS });
  const [stats, setStats] = useState<SimulationStats>({
    plantCount: 0,
    insectCount: 0,
    herbivoreCount: 0,
    birdCount: 0,
    carnivoreCount: 0,
    birthCount: 0,
    deathCount: 0,
    elapsedTime: 0
  });

  // Timeline history logs state for charting
  const [history, setHistory] = useState<any[]>([]);

  // Disaster screen action triggers
  const [disasterActive, setDisasterActive] = useState<boolean>(false);
  const disasterTimer = useRef<NodeJS.Timeout | null>(null);

  // i18n Language support - default to ZH (Traditional Chinese as requested)
  const [lang, setLang] = useState<Language>('zh');
  const t = TRANSLATIONS[lang];

  /**
   * Vercount / Busuanzi stats integration
   */
  useEffect(() => {
    // Only inject if not already present
    if (document.querySelector('script[data-vercount="true"]')) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.vercount.one/js';
    script.crossOrigin = 'anonymous';
    script.dataset.vercount = 'true';
    document.body.appendChild(script);
  }, []);

  /**
   * Captures references to the loaded ecosystem engine
   */
  const handleInit = useCallback((eco: Ecosystem) => {
    setEcosystem(eco);
    setParams({ ...eco.params });
    setStats({ ...eco.stats });
    setHistory([]);
  }, []);

  /**
   * Monitor and regularly refresh timeline historical points from simulation core
   */
  useEffect(() => {
    if (!ecosystem) return;

    const interval = setInterval(() => {
      // Pull history from ecosystem class
      setHistory([...ecosystem.history]);
    }, 400); // 400ms tick matches simulation history tick rates smoothly

    return () => clearInterval(interval);
  }, [ecosystem]);

  /**
   * Modifies behavioral weights dynamically
   */
  const handleChangeParams = useCallback((newParams: Partial<SimulationParams>) => {
    setParams((prev) => {
      const updated = { ...prev, ...newParams };
      if (ecosystem) {
        ecosystem.updateParams(updated);
      }
      return updated;
    });
  }, [ecosystem]);

  /**
   * Freezes or resumes the ticks
   */
  const handleTogglePlay = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  /**
   * Frame Step (only allowed when frozen)
   */
  const handleStep = useCallback(() => {
    if (ecosystem && isPaused) {
      ecosystem.step();
      setStats({ ...ecosystem.stats });
    }
  }, [ecosystem, isPaused]);

  /**
   * Biosphere regenerator
   */
  const handleReset = useCallback(() => {
    if (ecosystem) {
      ecosystem.reset();
      setStats({ ...ecosystem.stats });
      setHistory([]);
    }
  }, [ecosystem]);

  /**
   * Sudden environmental natural disaster shockwave
   */
  const handleDisaster = useCallback(() => {
    if (ecosystem) {
      ecosystem.triggerNaturalDisaster();
      setStats({ ...ecosystem.stats });

      // Trigger temporary blinking visuals in UI
      setDisasterActive(true);
      if (disasterTimer.current) clearTimeout(disasterTimer.current);
      disasterTimer.current = setTimeout(() => {
        setDisasterActive(false);
      }, 1800);
    }
  }, [ecosystem]);

  /**
   * Spawns species dynamically
   */
  const handleSpawnSpecies = useCallback((species: Species, count: number) => {
    if (ecosystem) {
      if (count === 1) {
        // Spawn one at random location
        const halfSize = params.mapSize / 2 - 6;
        const rx = (Math.random() - 0.5) * halfSize * 2;
        const rz = (Math.random() - 0.5) * halfSize * 2;
        ecosystem.spawnAgent(species, rx, rz);
      } else {
        // Spawn a packet
        ecosystem.spawnRandomGroup(species, count);
      }
      setStats({ ...ecosystem.stats });
    }
  }, [ecosystem, params.mapSize]);

  return (
    <div id="app-root-container" className="flex flex-col h-screen w-screen bg-[#0c0e12] text-slate-300 font-sans overflow-hidden select-none">
      
      {/* Sleek Interface Header Bar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#161920] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-white">
            {lang === 'zh' ? 'EcoSim 3D 生態模擬' : 'EcoSim 3D'} <span className="text-slate-500 font-normal">v1.1.0 - 3D Engine</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 text-xs">
          {/* Elegant Language Switcher UI Panel */}
          <div className="flex bg-white/5 p-0.5 rounded border border-white/10 h-8 items-center">
            <button
              onClick={() => setLang('zh')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all h-full flex items-center ${
                lang === 'zh'
                  ? 'bg-emerald-500 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-slate-200 cursor-pointer'
              }`}
            >
              繁中
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all h-full flex items-center ${
                lang === 'en'
                  ? 'bg-emerald-500 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-slate-200 cursor-pointer'
              }`}
            >
              EN
            </button>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-slate-500 uppercase tracking-widest text-[9px] font-mono">{t.simulationStatus}</span>
            <span className={`font-mono font-bold text-xs ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isPaused ? t.statusPaused : t.statusRunning}
            </span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-slate-500 uppercase tracking-widest text-[9px] font-mono">{t.activeAgents}</span>
            <span className="text-white font-mono font-bold text-xs">
              {stats.plantCount + stats.insectCount + stats.herbivoreCount + stats.birdCount + stats.carnivoreCount} {t.entities}
            </span>
          </div>

          <button 
            onClick={handleDisaster}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs transition-colors cursor-pointer uppercase tracking-wider font-mono"
          >
            {t.triggerCataclysm}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* Viewport Render Side */}
        <div className="flex-1 relative h-3/5 lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-[#0f1115] to-[#1a1c23]">
          
          <Viewport
            ecosystem={ecosystem}
            onInit={handleInit}
            onUpdateStats={setStats}
            isPaused={isPaused}
            params={params}
          />

          {/* Dynamic Blinking Disaster Alarm Alert */}
          {disasterActive && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600/90 text-white font-mono text-xs uppercase tracking-wider px-6 py-3 rounded-full border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-bounce select-none">
              <ShieldAlert size={16} className="animate-pulse" />
              <span>{t.bioDisasterEvent}</span>
            </div>
          )}

          {/* Overlay Screen Flash for intense cataclysm sensation */}
          {disasterActive && (
            <div className="absolute inset-0 z-40 bg-red-600/15 pointer-events-none animate-ping" />
          )}

          {/* Simulation Freeze Overlay Text */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none z-30 flex items-center justify-center">
              <div className="bg-neutral-950/90 border border-amber-500/30 text-amber-500/90 rounded-2xl px-5 py-3 flex items-center gap-3 animate-pulse">
                <Play className="fill-current w-3.5 h-3.5 rotate-90" />
                <span className="font-mono text-[10px] tracking-widest uppercase font-semibold leading-none">{t.biosphereFrozen}</span>
              </div>
            </div>
          )}

          {/* Quick HUD bar for general overview */}
          <div className="absolute bottom-4 left-4 z-40 pointer-events-none flex items-center gap-4 bg-neutral-950/85 backdrop-blur-md border border-neutral-900 rounded-2xl px-4 py-2.5">
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">{t.biodiversity}</span>
              <span className="text-xs font-semibold text-neutral-200 mt-0.5">
                {[
                  stats.plantCount > 0,
                  stats.insectCount > 0,
                  stats.herbivoreCount > 0,
                  stats.birdCount > 0,
                  stats.carnivoreCount > 0
                ].filter(Boolean).length} / 5 {t.speciesLiving}
              </span>
            </div>
            <div className="h-6 w-px bg-neutral-800" />
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">{t.totalPopulation}</span>
              <span className="text-xs font-semibold text-neutral-200 mt-0.5">
                {stats.plantCount + stats.insectCount + stats.herbivoreCount + stats.birdCount + stats.carnivoreCount} {t.organisms}
              </span>
            </div>
          </div>

        </div>

        {/* Control Panel Sidebar Side */}
        <Sidebar
          stats={stats}
          params={params}
          onChangeParams={handleChangeParams}
          isPaused={isPaused}
          onTogglePlay={handleTogglePlay}
          onStep={handleStep}
          onReset={handleReset}
          onDisaster={handleDisaster}
          onSpawnSpecies={handleSpawnSpecies}
          history={history}
          lang={lang}
          t={t}
        />

      </main>

      {/* Sleek Interface Bottom Footer */}
      <footer className="h-12 bg-[#0c0e12] border-t border-white/10 flex items-center px-6 shrink-0 select-none">
        <div className="flex gap-8 text-[10px] text-slate-500 uppercase tracking-widest font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 3D Visualization: ACTIVE
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Logic Target: TS Autonomous State Machine
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Spatial Mesh: Spatial Hash Grid (O(N))
          </div>
        </div>
        <div className="ml-auto text-[10px] font-mono text-slate-600 uppercase tracking-wider">
          Continuous Biodome Chamber Matrix
        </div>
      </footer>

    </div>
  );
}
