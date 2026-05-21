/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Language } from '../translations';

interface ChartDataPoint {
  elapsedTime: number;
  Plant: number;
  Insect: number;
  Herbivore: number;
  Bird: number;
  Carnivore: number;
}

interface PopulationChartProps {
  history: ChartDataPoint[];
  lang: Language;
}

export default function PopulationChart({ history, lang }: PopulationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high density displays (retina screens) smoothly
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = '#0a0a0a'; // obsidian deep matches panel theme
    ctx.fillRect(0, 0, width, height);

    if (history.length === 0) {
      // Draw idle notice
      ctx.fillStyle = '#666666';
      ctx.font = '12px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        lang === 'zh' ? '等待模擬週期開始...' : 'Waiting for cycles to complete...',
        width / 2,
        height / 2
      );
      return;
    }

    // Grid coordinates calculations
    const paddingLeft = 32;
    const paddingRight = 12;
    const paddingTop = 12;
    const paddingBottom = 20;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Find maximum count among all points to scale Y axis dynamically
    let maxVal = 10; // minimum scale ceiling
    for (let i = 0; i < history.length; i++) {
      const p = history[i];
      maxVal = Math.max(maxVal, p.Plant, p.Insect, p.Herbivore, p.Bird, p.Carnivore);
    }
    // Round to next multiple of 10 for neat aesthetics
    maxVal = Math.ceil(maxVal / 10) * 10;

    // Draw horizontal grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridLinesCount = 4;
    for (let i = 0; i <= gridLinesCount; i++) {
      const val = (maxVal / gridLinesCount) * i;
      const y = paddingTop + graphHeight - (val / maxVal) * graphHeight;
      
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Axis labels (Y)
      ctx.fillStyle = '#555555';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.floor(val).toString(), paddingLeft - 6, y);
    }

    // Capture colors mapping for the 5 species
    const colors = {
      Plant: '#22c55e',      // Bright Emerald
      Insect: '#f97316',     // Scurrying Orange
      Herbivore: '#eab308',  // Yellow/Beige
      Bird: '#3b82f6',       // Flying Sky Blue
      Carnivore: '#ef4444'   // Crimson
    };

    const keys: (keyof typeof colors)[] = ['Plant', 'Insect', 'Herbivore', 'Bird', 'Carnivore'];

    // Draw lines for each species
    keys.forEach((key) => {
      ctx.beginPath();
      ctx.strokeStyle = colors[key];
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let i = 0; i < history.length; i++) {
        const point = history[i];
        const val = point[key] as number;
        
        // Calculate X coordinate as percentage of horizontal duration
        const xPercent = history.length > 1 ? i / (history.length - 1) : 0.5;
        const x = paddingLeft + xPercent * graphWidth;
        
        // Calculate Y coordinate
        const y = paddingTop + graphHeight - (val / maxVal) * graphHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Add a clean glowing shadow overlay beneath lines for luxury feel
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = colors[key];
      ctx.strokeStyle = colors[key];
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    });

    // Draw horizontal axis times (starting and current cycles ticks)
    ctx.fillStyle = '#555555';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${history[0].elapsedTime}T`, paddingLeft, height - paddingBottom + 4);

    ctx.textAlign = 'right';
    ctx.fillText(`${history[history.length - 1].elapsedTime}T`, width - paddingRight, height - paddingBottom + 4);

    ctx.textAlign = 'center';
    ctx.fillText(
      lang === 'zh' ? '生態種群 Lotka-Volterra 波動曲線' : 'Lotka-Volterra Trend Curves',
      width / 2,
      height - paddingBottom + 4
    );

  }, [history, lang]);

  return (
    <div ref={containerRef} className="w-full h-36 bg-neutral-950 rounded-xl border border-neutral-900 p-2 overflow-hidden shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
