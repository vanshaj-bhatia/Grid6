import React, { useState } from 'react';
import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignVerticalJustifyStart,
  Check,
  Crop,
  FileText,
  Grid,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Printer,
  RotateCw,
  Scissors,
  Sliders,
  Square,
  Unlock,
} from 'lucide-react';
import { GridConfig, PageOrientation, PageSize, PictureAlign, PictureScaling } from '../types';

interface MarginControlsProps {
  config: GridConfig;
  onChange: (updated: Partial<GridConfig>) => void;
}

export const MarginControls: React.FC<MarginControlsProps> = ({ config, onChange }) => {
  const [isLinked, setIsLinked] = useState(false);
  const [activeTab, setActiveTab] = useState<'printOptions' | 'margins' | 'marks'>('printOptions');

  const handleMarginChange = (key: 'marginTopMm' | 'marginBottomMm' | 'marginLeftMm' | 'marginRightMm', val: number) => {
    const clamped = Math.max(0, Math.min(50, val));
    if (isLinked) {
      onChange({
        marginTopMm: clamped,
        marginBottomMm: clamped,
        marginLeftMm: clamped,
        marginRightMm: clamped,
      });
    } else {
      onChange({ [key]: clamped });
    }
  };

  const applyPreset = (preset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    gapX: number;
    gapY: number;
  }) => {
    onChange({
      marginTopMm: preset.top,
      marginBottomMm: preset.bottom,
      marginLeftMm: preset.left,
      marginRightMm: preset.right,
      gapXMm: preset.gapX,
      gapYMm: preset.gapY,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('printOptions')}
          type="button"
          className={`flex flex-1 items-center justify-center gap-1.5 pb-1 text-xs font-semibold transition border-b-2 -mb-[13px] ${
            activeTab === 'printOptions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Options (Android)</span>
        </button>
        <button
          onClick={() => setActiveTab('margins')}
          type="button"
          className={`flex flex-1 items-center justify-center gap-1.5 pb-1 text-xs font-semibold transition border-b-2 -mb-[13px] ${
            activeTab === 'margins'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Margins & Gutters</span>
        </button>
        <button
          onClick={() => setActiveTab('marks')}
          type="button"
          className={`flex flex-1 items-center justify-center gap-1.5 pb-1 text-xs font-semibold transition border-b-2 -mb-[13px] ${
            activeTab === 'marks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="h-3.5 w-3.5" />
          <span>Borders & Marks</span>
        </button>
      </div>

      <div className="mt-4">
        {/* TAB 1: PRINT OPTIONS (Exact settings from Android Screenshot) */}
        {activeTab === 'printOptions' && (
          <div className="space-y-4">
            {/* Banner explaining Stretch Width & Top Middle */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 text-xs text-indigo-200">
              <span className="font-semibold text-white">Empty Bottom 1/4 Optimization Active:</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Input page width matches the full cell width. Aligning to <strong>Top Middle</strong> ensures barcodes and addresses at the top are never cropped while trimming the bottom blank whitespace.
              </p>
            </div>

            {/* Picture Scaling */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Picture Scaling
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onChange({ pictureScaling: 'fitWidth' })}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                    config.pictureScaling === 'fitWidth'
                      ? 'border-emerald-500 bg-emerald-950/30 text-white ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Maximize2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Match Width (Fit to Cell Width)
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] text-emerald-300">Default</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Stretches image to whole cell width. Trims bottom 1/4 empty whitespace cleanly.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ pictureScaling: 'inside' })}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                    config.pictureScaling === 'inside'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Minimize2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">Inside (Keep Whole Page)</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Fits entire page proportionally without trimming any whitespace.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ pictureScaling: 'stretch' })}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                    config.pictureScaling === 'stretch'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Square className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">Fill Cell (Stretch Both)</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Distorts to fill 100% of cell width and height.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ pictureScaling: 'cropBottomQuarter' })}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                    config.pictureScaling === 'cropBottomQuarter'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Crop className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">Crop Bottom 25% Explicitly</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Removes bottom 1/4 area before scaling to cell.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Picture Align */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Picture Align
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ pictureAlign: 'top-middle' })}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    config.pictureAlign === 'top-middle'
                      ? 'border-emerald-500 bg-emerald-950/30 text-white ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignVerticalJustifyStart className="h-4 w-4 text-emerald-400 mb-1" />
                  <span className="text-xs font-semibold">Top Middle</span>
                  <span className="text-[9px] text-slate-400">Zero top crop (Default)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ pictureAlign: 'center' })}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    config.pictureAlign === 'center'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignCenter className="h-4 w-4 text-indigo-400 mb-1" />
                  <span className="text-xs font-semibold">Center</span>
                  <span className="text-[9px] text-slate-400">Centered in cell</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ pictureAlign: 'bottom-middle' })}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    config.pictureAlign === 'bottom-middle'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignVerticalJustifyStart className="h-4 w-4 rotate-180 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold">Bottom Middle</span>
                  <span className="text-[9px] text-slate-400">Anchored to bottom</span>
                </button>
              </div>
            </div>

            {/* 1-Click Auto Pipeline on Share / Drop */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>⚡ One-Click Auto Processing on Share / Upload</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">Default: Active</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Automatically converts incoming PDFs, saves to Downloads/{config.appName}/, and opens the preview immediately.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoProcessAndSave}
                  onChange={(e) => onChange({ autoProcessAndSave: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>

              {config.autoProcessAndSave && (
                <div className="flex items-center justify-between pt-1 border-t border-emerald-900/40 text-[11px] text-slate-300">
                  <span>Open PDF preview modal immediately upon saving</span>
                  <input
                    type="checkbox"
                    checked={config.autoOpenSavedPdf}
                    onChange={(e) => onChange({ autoOpenSavedPdf: e.target.checked })}
                    className="h-3.5 w-3.5 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Page Orientation & Page Layout Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Orientation */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Page Orientation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        orientation: 'landscape',
                        cols: 3,
                        rows: 2,
                      })
                    }
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition ${
                      config.orientation === 'landscape'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="mb-1 h-4 w-6 rounded border border-current" />
                    <span>Landscape (Default)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        orientation: 'portrait',
                        cols: 2,
                        rows: 3,
                      })
                    }
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition ${
                      config.orientation === 'portrait'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="mb-1 h-6 w-4 rounded border border-current" />
                    <span>Portrait</span>
                  </button>
                </div>
              </div>

              {/* Page Layout */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Page Layout (6-Up Grid)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        cols: config.orientation === 'landscape' ? 3 : 2,
                        rows: config.orientation === 'landscape' ? 2 : 3,
                      })
                    }
                    className="flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-semibold transition border-emerald-500 bg-emerald-950/30 text-white"
                  >
                    <Grid className="h-4 w-4 text-emerald-400 mb-1" />
                    <span>Grid 3×2</span>
                    <span className="text-[10px] text-slate-400">
                      {config.orientation === 'landscape' ? '3 cols × 2 rows' : '2 cols × 3 rows'}
                    </span>
                  </button>

                  <div className="flex flex-col justify-center rounded-xl border border-slate-800 bg-slate-950 p-2 text-center text-xs">
                    <span className="text-[10px] text-slate-400">Paper Size</span>
                    <span className="font-semibold text-white">{config.pageSize}</span>
                    <span className="text-[9px] text-indigo-300">0mm Minimum Margins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MARGINS & GUTTERS */}
        {activeTab === 'margins' && (
          <div className="space-y-4">
            {/* Presets Bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>Page Margins Preset</span>
                <button
                  onClick={() => setIsLinked(!isLinked)}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {isLinked ? (
                    <>
                      <Lock className="h-3 w-3" /> Linked
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" /> Unlinked
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                <button
                  onClick={() => applyPreset({ top: 0, bottom: 0, left: 0, right: 0, gapX: 1, gapY: 1 })}
                  className={`rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold transition ${
                    config.marginTopMm === 0 && config.marginBottomMm === 0 && config.marginLeftMm === 0 && config.marginRightMm === 0
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  No (minimum allowable)
                </button>
                <button
                  onClick={() => applyPreset({ top: 5, bottom: 5, left: 5, right: 5, gapX: 2, gapY: 2 })}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-center text-[11px] font-medium text-slate-300 hover:border-slate-700"
                >
                  Tight (5mm)
                </button>
                <button
                  onClick={() => applyPreset({ top: 10, bottom: 10, left: 10, right: 10, gapX: 4, gapY: 4 })}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-center text-[11px] font-medium text-slate-300 hover:border-slate-700"
                >
                  Standard (10mm)
                </button>
                <button
                  onClick={() => applyPreset({ top: 8, bottom: 8, left: 20, right: 8, gapX: 3, gapY: 3 })}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-center text-[11px] font-medium text-slate-300 hover:border-slate-700"
                >
                  Binder Punch
                </button>
              </div>
            </div>

            {/* Individual Margin Sliders */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Top Margin</span>
                  <span className="font-mono font-semibold text-indigo-400">{config.marginTopMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={config.marginTopMm}
                  onChange={(e) => handleMarginChange('marginTopMm', parseFloat(e.target.value))}
                  className="mt-2 w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Bottom Margin</span>
                  <span className="font-mono font-semibold text-indigo-400">{config.marginBottomMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={config.marginBottomMm}
                  onChange={(e) => handleMarginChange('marginBottomMm', parseFloat(e.target.value))}
                  className="mt-2 w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Left Margin</span>
                  <span className="font-mono font-semibold text-indigo-400">{config.marginLeftMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={config.marginLeftMm}
                  onChange={(e) => handleMarginChange('marginLeftMm', parseFloat(e.target.value))}
                  className="mt-2 w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Right Margin</span>
                  <span className="font-mono font-semibold text-indigo-400">{config.marginRightMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={config.marginRightMm}
                  onChange={(e) => handleMarginChange('marginRightMm', parseFloat(e.target.value))}
                  className="mt-2 w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Gutters (Gap X and Gap Y) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Horizontal Gutter (X between columns)</span>
                  <span className="font-mono font-semibold text-cyan-400">{config.gapXMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={config.gapXMm}
                  onChange={(e) => onChange({ gapXMm: parseFloat(e.target.value) })}
                  className="mt-2 w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Vertical Gutter (Y between rows)</span>
                  <span className="font-mono font-semibold text-cyan-400">{config.gapYMm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={config.gapYMm}
                  onChange={(e) => onChange({ gapYMm: parseFloat(e.target.value) })}
                  className="mt-2 w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BORDERS & MARKS */}
        {activeTab === 'marks' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Cell Border Line</span>
                  <input
                    type="checkbox"
                    checked={config.drawBorders}
                    onChange={(e) => onChange({ drawBorders: e.target.checked })}
                    className="h-4 w-4 rounded accent-indigo-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Draws a hairline border around each 3×2 grid cell.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Cut / Trim Guides</span>
                  <input
                    type="checkbox"
                    checked={config.drawCutGuides}
                    onChange={(e) => onChange({ drawCutGuides: e.target.checked })}
                    className="h-4 w-4 rounded accent-indigo-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Prints subtle cut crosshairs at column and row intersections.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Page Number Badges</span>
                  <input
                    type="checkbox"
                    checked={config.drawPageNumbers}
                    onChange={(e) => onChange({ drawPageNumbers: e.target.checked })}
                    className="h-4 w-4 rounded accent-indigo-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Adds small sequential label numbering in the bottom corner.
                </p>
              </div>
            </div>

            {/* Target Folder Setting */}
            <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-indigo-300">App Storage Folder</span>
                  <p className="text-[11px] text-slate-400">
                    Files stored into Downloads/<strong className="text-indigo-300">{config.appName}</strong>/
                  </p>
                </div>
                <input
                  type="text"
                  value={config.appName}
                  onChange={(e) => onChange({ appName: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') || 'Grid6_PDF' })}
                  className="w-36 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="APP_NAME"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
