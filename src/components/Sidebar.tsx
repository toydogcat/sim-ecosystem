/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  SlidersHorizontal,
  Brain,
  Timer,
  Hash,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Species, SimulationParams, SimulationStats } from '../types';
import PopulationChart from './PopulationChart';
import { Language } from '../translations';

export const SPEED_STEPS = [0.1, 0.25, 0.5, 1.0, 2.0, 3.0, 5.0];

interface SidebarProps {
  stats: SimulationStats;
  params: SimulationParams;
  onChangeParams: (p: Partial<SimulationParams>) => void;
  isPaused: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onDisaster: () => void;
  onSpawnSpecies: (species: Species, count: number) => void;
  history: any[];
  lang: Language;
  t: any;
}

export default function Sidebar({
  stats,
  params,
  onChangeParams,
  isPaused,
  onTogglePlay,
  onStep,
  onReset,
  onDisaster,
  onSpawnSpecies,
  history,
  lang,
  t
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'rates' | 'speeds' | 'vision'>('rates');

  // Human-friendly mapping of species colors for UI elements
  const speciesMeta = {
    [Species.Plant]: { name: t.floraGrass, label: t.plant, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' },
    [Species.Insect]: { name: t.insectBug, label: t.insect, color: 'text-orange-400 bg-orange-500/5 border-orange-500/20' },
    [Species.Herbivore]: { name: t.herbivoreFlock, label: t.herbivore, color: 'text-amber-400 bg-amber-500/5 border-amber-500/20' },
    [Species.Bird]: { name: t.birdFlight, label: t.bird, color: 'text-blue-400 bg-blue-500/5 border-blue-500/20' },
    [Species.Carnivore]: { name: t.carnivoreWolf, label: t.carnivore, color: 'text-red-400 bg-red-500/5 border-red-500/20' }
  };

  return (
    <div className="w-full lg:w-96 flex flex-col h-full bg-[#161920] border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto select-none font-sans scrollbar-thin">
      
      {/* 1. Header Branks */}
      <div className="p-5 border-b border-white/10 bg-[#0c0e12]/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Brain size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">{t.ecoChamberTitle}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{t.ecoChamberSubtitle}</p>
          </div>
        </div>
      </div>

      {/* 2. Simulation Stats Ticker Row */}
      <div className="p-5 flex flex-col gap-4 border-b border-white/10 bg-[#0c0e12]/10">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 border border-white/10 rounded p-2.5 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-mono flex items-center gap-1">
              <Timer size={11} /> {t.cycle}
            </span>
            <span className="text-sm font-semibold text-white mt-1">{stats.elapsedTime}t</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-2.5 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-mono">{t.demises}</span>
            <span className="text-sm font-semibold text-red-400/90 mt-1">{stats.deathCount}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-2.5 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-mono">{t.emergences}</span>
            <span className="text-sm font-semibold text-emerald-400/95 mt-1">{stats.birthCount}</span>
          </div>
        </div>

        {/* Dynamic Canvas Lotka-Volterra lines */}
        <PopulationChart history={history} lang={lang} />
      </div>

      {/* 3. Core Multi-Species Metrics and Quick Spawners */}
      <div className="p-5 border-b border-white/10 flex flex-col gap-2.5">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-3">
          <Hash size={13} className="text-slate-500" /> {t.censusTitle}
        </h2>

        {Object.values(Species).map((sp) => {
          const meta = speciesMeta[sp];
          let currentCount = 0;
          if (sp === Species.Plant) currentCount = stats.plantCount;
          else if (sp === Species.Insect) currentCount = stats.insectCount;
          else if (sp === Species.Herbivore) currentCount = stats.herbivoreCount;
          else if (sp === Species.Bird) currentCount = stats.birdCount;
          else if (sp === Species.Carnivore) currentCount = stats.carnivoreCount;

          return (
            <div
              key={sp}
              className={`flex items-center justify-between rounded border p-2.5 ${meta.color} transition-all duration-200 hover:bg-white/5`}
            >
              <div className="flex flex-col pl-1">
                <span className="text-xs font-semibold text-white leading-none">{meta.label}</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">{meta.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white pr-2">{currentCount}</span>
                
                {/* Spawning Triggers */}
                <button
                  onClick={() => onSpawnSpecies(sp, 1)}
                  className="flex items-center justify-center p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 active:scale-95 transition-all outline-none border border-white/10 cursor-pointer"
                  title="Spawn +1"
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => onSpawnSpecies(sp, 10)}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono font-medium text-slate-300 active:scale-95 transition-all outline-none border border-white/10 cursor-pointer"
                  title="Spawn +10"
                >
                  +10
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Playback and Reset Controls Panel */}
      <div className="p-5 border-b border-white/10 flex flex-col gap-3">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-3">
          <SlidersHorizontal size={13} className="text-slate-500" /> {t.controlsTitle}
        </h2>

        {/* Primary Simulation Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all active:scale-95 border ${
              isPaused
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? t.resume : t.freeze}
          </button>

          <button
            onClick={onStep}
            disabled={!isPaused}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider border ${
              isPaused
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 active:scale-95 cursor-pointer'
                : 'bg-neutral-900/40 border-white/5 text-slate-600 cursor-not-allowed'
            } transition-all`}
            title={lang === 'zh' ? '在凍結狀態下前進單個動作幀' : 'Update simulation single frame (must be frozen first)'}
          >
            <RefreshCw size={13} />
            {t.step}
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw size={13} />
            {t.reset}
          </button>
        </div>

        {/* Speed / Tick Rate Fast Forward Slider - Supporting Slow Motion */}
        <div className="flex flex-col gap-1.5 bg-white/5 border border-white/10 rounded p-3">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400 uppercase tracking-wider">{t.simulationVelocity}</span>
            <span className="text-emerald-400 font-bold">{params.tickRate}x {t.ticksFrame}</span>
          </div>
          <input
            type="range"
            min="0"
            max={SPEED_STEPS.length - 1}
            step="1"
            value={SPEED_STEPS.indexOf(params.tickRate) !== -1 ? SPEED_STEPS.indexOf(params.tickRate) : 3}
            onChange={(e) => {
              const newSpeed = SPEED_STEPS[parseInt(e.target.value)];
              onChangeParams({ tickRate: newSpeed });
            }}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Natural Catastrophe Disaster trigger */}
        <div className="flex flex-col gap-2 bg-red-950/10 border border-red-950/30 rounded p-3 mt-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-red-400/90 uppercase tracking-wider font-semibold">{t.cataclysmSeverity}</span>
            <span className="text-red-400 font-bold">{params.disasterSeverity}% {t.purged}</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={params.disasterSeverity}
            onChange={(e) => onChangeParams({ disasterSeverity: parseInt(e.target.value) })}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <button
            onClick={onDisaster}
            className="w-full flex items-center justify-center gap-2 py-2 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold text-xs tracking-wider transition-all active:scale-95 cursor-pointer mt-1 font-mono uppercase"
          >
            <Zap size={13} className="fill-current animate-pulse" /> {t.triggerDisasterBtn}
          </button>
        </div>
      </div>

      {/* 5. Custom Dynamic sliders panel widgets */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        
        {/* Sliders Tab Navigation */}
        <div className="flex bg-white/5 rounded border border-white/10 p-1">
          <button
            onClick={() => setActiveTab('rates')}
            className={`flex-1 text-center py-1.5 text-[10px] uppercase font-mono font-semibold rounded transition-all cursor-pointer ${
              activeTab === 'rates'
                ? 'bg-white/10 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.tabBreeding}
          </button>
          
          <button
            onClick={() => setActiveTab('speeds')}
            className={`flex-1 text-center py-1.5 text-[10px] uppercase font-mono font-semibold rounded transition-all cursor-pointer ${
              activeTab === 'speeds'
                ? 'bg-white/10 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.tabVelocities}
          </button>
          
          <button
            onClick={() => setActiveTab('vision')}
            className={`flex-1 text-center py-1.5 text-[10px] uppercase font-mono font-semibold rounded transition-all cursor-pointer ${
              activeTab === 'vision'
                ? 'bg-white/10 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.tabAttributes}
          </button>
        </div>

        {/* Tab 1 Content - Growth and Mate parameters */}
        {activeTab === 'rates' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">{t.floraSelfGrowth}</span>
                <span className="text-emerald-400 font-bold">{Math.round(params.plantGrowthRate * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.4"
                step="0.01"
                value={params.plantGrowthRate}
                onChange={(e) => onChangeParams({ plantGrowthRate: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">{t.floraPopCap}</span>
                <span className="text-slate-200 font-medium">{params.plantMaxPopulation} {t.cubesLabel}</span>
              </div>
              <input
                type="range"
                min="50"
                max="400"
                step="10"
                value={params.plantMaxPopulation}
                onChange={(e) => onChangeParams({ plantMaxPopulation: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">{t.reproUrge}</span>
                <span className="text-amber-400 font-bold">{params.reproductionRate}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={params.reproductionRate}
                onChange={(e) => onChangeParams({ reproductionRate: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">{t.reproThreshold}</span>
                <span className="text-slate-200 font-medium">{params.reproductionThreshold}{t.fullLabel}</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={params.reproductionThreshold}
                onChange={(e) => onChangeParams({ reproductionThreshold: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Tab 2 Content - Speed parameter sliders */}
        {activeTab === 'speeds' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-orange-400">{t.insectCrawlerSpeed}</span>
                <span className="text-white font-semibold">{params.insectMaxSpeed}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={params.insectMaxSpeed}
                onChange={(e) => onChangeParams({ insectMaxSpeed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-amber-400">{t.herbivoreRunnerSpeed}</span>
                <span className="text-white font-semibold">{params.herbivoreMaxSpeed}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.05"
                value={params.herbivoreMaxSpeed}
                onChange={(e) => onChangeParams({ herbivoreMaxSpeed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-blue-400">{t.birdFlyerSpeed}</span>
                <span className="text-white font-semibold">{params.birdMaxSpeed}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.8"
                step="0.05"
                value={params.birdMaxSpeed}
                onChange={(e) => onChangeParams({ birdMaxSpeed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-red-400">{t.carnivoreHunterSpeed}</span>
                <span className="text-white font-semibold">{params.carnivoreMaxSpeed}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.8"
                step="0.05"
                value={params.carnivoreMaxSpeed}
                onChange={(e) => onChangeParams({ carnivoreMaxSpeed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </div>
        )}

        {/* Tab 3 Content - Perception & Metabolism ratios */}
        {activeTab === 'vision' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-red-400">{t.carnivoreVision}</span>
                <span className="text-white font-medium">{params.carnivoreVision}m</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={params.carnivoreVision}
                onChange={(e) => onChangeParams({ carnivoreVision: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">{t.herbivoreMetabolism}</span>
                <span className="text-white font-bold">{params.herbivoreMetabolism}</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.25"
                step="0.01"
                value={params.herbivoreMetabolism}
                onChange={(e) => onChangeParams({ herbivoreMetabolism: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-red-400">{t.carnivoreMetabolism}</span>
                <span className="text-white font-bold">{params.carnivoreMetabolism}</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.4"
                step="0.01"
                value={params.carnivoreMetabolism}
                onChange={(e) => onChangeParams({ carnivoreMetabolism: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-amber-400">{t.boidsCohesion}</span>
                <span className="text-white font-bold">{params.boidsCohesion}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.1"
                value={params.boidsCohesion}
                onChange={(e) => onChangeParams({ boidsCohesion: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}

        {/* Informative Credit Disclaimer footer */}
        <div className="mt-auto pt-6 border-t border-white/5 border-dashed text-[10px] text-slate-600 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span>{t.simStable}</span>
            <span>{t.matrixActive} ●</span>
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 opacity-60 hover:opacity-100 transition-opacity">
            <span id="busuanzi_container_site_pv" className="hidden">
              {t.siteViews}: <b id="busuanzi_value_site_pv">-</b>
            </span>
            <span id="busuanzi_container_page_pv" className="hidden">
              {t.pageViews}: <b id="busuanzi_value_page_pv">-</b>
            </span>
            <span id="busuanzi_container_site_uv" className="hidden">
              {t.visitors}: <b id="busuanzi_value_site_uv">-</b>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
