import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Grid3X3, Layers } from 'lucide-react';
import { GridConfig } from '../types';
import { getSheetDimensions, PT_TO_MM } from '../services/pdfEngine';

interface GridVisualizerProps {
  config: GridConfig;
  totalOriginalPages?: number;
}

export const GridVisualizer: React.FC<GridVisualizerProps> = ({ config, totalOriginalPages = 6 }) => {
  const [currentSheet, setCurrentSheet] = useState(1);
  const [showRulers, setShowRulers] = useState(true);

  const { width: sheetPtW, height: sheetPtH } = getSheetDimensions(config);
  const sheetMmW = Math.round(sheetPtW * PT_TO_MM);
  const sheetMmH = Math.round(sheetPtH * PT_TO_MM);

  const cols = config.cols || (config.orientation === 'portrait' ? 2 : 3);
  const rows = config.rows || (config.orientation === 'portrait' ? 3 : 2);
  const pagesPerSheet = cols * rows; // 6

  const totalSheets = Math.max(1, Math.ceil(totalOriginalPages / pagesPerSheet));

  const viewBoxW = sheetMmW;
  const viewBoxH = sheetMmH;

  const top = config.marginTopMm;
  const bottom = config.marginBottomMm;
  const left = config.marginLeftMm;
  const right = config.marginRightMm;
  const gapX = config.gapXMm;
  const gapY = config.gapYMm;

  const availW = Math.max(10, sheetMmW - left - right - (cols - 1) * gapX);
  const availH = Math.max(10, sheetMmH - top - bottom - (rows - 1) * gapY);

  const cellW = availW / cols;
  const cellH = availH / rows;

  // Typical A4 aspect ratio is 210 / 297 = 0.707
  const srcAspect = 210 / 297;

  let pageDrawW = cellW;
  let pageDrawH = cellH;

  if (config.pictureScaling === 'fitWidth') {
    // Match page width to cell width
    pageDrawW = cellW;
    pageDrawH = cellW / srcAspect; // taller than cell
  } else if (config.pictureScaling === 'inside') {
    const cellAspect = cellW / cellH;
    if (srcAspect < cellAspect) {
      pageDrawH = cellH;
      pageDrawW = cellH * srcAspect;
    } else {
      pageDrawW = cellW;
      pageDrawH = cellW / srcAspect;
    }
  } else if (config.pictureScaling === 'stretch') {
    pageDrawW = cellW;
    pageDrawH = cellH;
  } else if (config.pictureScaling === 'cropBottomQuarter') {
    // 75% height
    const effAspect = 210 / (297 * 0.75);
    const cellAspect = cellW / cellH;
    if (effAspect < cellAspect) {
      pageDrawH = cellH;
      pageDrawW = cellH * effAspect;
    } else {
      pageDrawW = cellW;
      pageDrawH = cellW / effAspect;
    }
  }

  const cells = [];
  const startPageNum = (currentSheet - 1) * pagesPerSheet + 1;

  for (let slot = 0; slot < pagesPerSheet; slot++) {
    let col = 0;
    let row = 0;

    if (config.pageOrder === 'horizontal') {
      col = slot % cols;
      row = Math.floor(slot / cols);
    } else {
      row = slot % rows;
      col = Math.floor(slot / rows);
    }

    const pageNum = startPageNum + slot;
    const existsInDoc = pageNum <= totalOriginalPages;

    const cellX = left + col * (cellW + gapX);
    const cellY = top + row * (cellH + gapY);

    const pageX = cellX + (cellW - pageDrawW) / 2;
    let pageY = cellY;

    // In SVG coordinates, Y=0 is at top
    if (config.pictureAlign === 'top-middle') {
      pageY = cellY; // Anchored to top of cell!
    } else if (config.pictureAlign === 'center') {
      pageY = cellY + (cellH - pageDrawH) / 2;
    } else if (config.pictureAlign === 'bottom-middle') {
      pageY = cellY + cellH - pageDrawH;
    }

    cells.push({
      slot,
      col,
      row,
      cellX,
      cellY,
      pageX,
      pageY,
      pageNum,
      existsInDoc,
    });
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm">
      {/* Top Controls Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Live Print Preview (Grid 3×2)</h2>
            <p className="text-[11px] text-slate-400">
              {config.orientation.toUpperCase()} • {cols} Cols × {rows} Rows • {sheetMmW} × {sheetMmH} mm
            </p>
          </div>
        </div>

        {/* Guides & Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRulers(!showRulers)}
            type="button"
            className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
              showRulers
                ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showRulers ? 'Guides On' : 'Guides Off'}
          </button>

          {totalSheets > 1 && (
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 px-1 py-0.5 text-xs text-slate-300">
              <button
                onClick={() => setCurrentSheet((s) => Math.max(1, s - 1))}
                disabled={currentSheet <= 1}
                className="rounded p-1 hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px]">
                Sheet {currentSheet}/{totalSheets}
              </span>
              <button
                onClick={() => setCurrentSheet((s) => Math.min(totalSheets, s + 1))}
                disabled={currentSheet >= totalSheets}
                className="rounded p-1 hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-4 ring-1 ring-slate-800">
        <div className="w-full max-w-xl transition-all duration-300">
          <svg
            viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
            className="w-full h-auto drop-shadow-2xl rounded-sm"
            style={{ maxHeight: '380px' }}
          >
            <defs>
              {cells.map((c) => (
                <clipPath key={`clip-${c.slot}`} id={`cell-clip-${c.slot}`}>
                  <rect x={c.cellX} y={c.cellY} width={cellW} height={cellH} />
                </clipPath>
              ))}
            </defs>

            {/* Sheet Canvas background */}
            <rect
              x="0"
              y="0"
              width={sheetMmW}
              height={sheetMmH}
              fill="#ffffff"
              rx="1.5"
            />

            {/* Margins Boundary (dashed) */}
            {showRulers && (left > 0 || top > 0 || right > 0 || bottom > 0) && (
              <rect
                x={left}
                y={top}
                width={sheetMmW - left - right}
                height={sheetMmH - top - bottom}
                fill="none"
                stroke="#6366f1"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                opacity="0.6"
              />
            )}

            {/* Cut / Trim Guides */}
            {config.drawCutGuides && (
              <g stroke="#94a3b8" strokeWidth="0.4" strokeDasharray="1.5 1.5">
                {Array.from({ length: cols - 1 }).map((_, i) => {
                  const x = left + (i + 1) * cellW + (i + 0.5) * gapX;
                  return (
                    <line key={`v-${i}`} x1={x} y1="0" x2={x} y2={sheetMmH} />
                  );
                })}
                {Array.from({ length: rows - 1 }).map((_, i) => {
                  const y = top + (i + 1) * cellH + (i + 0.5) * gapY;
                  return (
                    <line key={`h-${i}`} x1="0" y1={y} x2={sheetMmW} y2={y} />
                  );
                })}
              </g>
            )}

            {/* 6 Cells & Label Content */}
            {cells.map((c) => (
              <g key={c.slot}>
                {/* Cell Background */}
                <rect
                  x={c.cellX}
                  y={c.cellY}
                  width={cellW}
                  height={cellH}
                  fill="#fafafa"
                />

                {/* Clipped content inside cell */}
                <g clipPath={`url(#cell-clip-${c.slot})`}>
                  {/* Page representation */}
                  <rect
                    x={c.pageX}
                    y={c.pageY}
                    width={pageDrawW}
                    height={pageDrawH}
                    fill={c.existsInDoc ? '#ffffff' : '#f1f5f9'}
                  />

                  {c.existsInDoc && (
                    <g>
                      {/* Shipping label header box */}
                      <rect
                        x={c.pageX + pageDrawW * 0.05}
                        y={c.pageY + pageDrawH * 0.04}
                        width={pageDrawW * 0.9}
                        height={pageDrawH * 0.16}
                        fill="#f8fafc"
                        stroke="#0f172a"
                        strokeWidth="0.3"
                      />
                      {/* Customer Address Title */}
                      <rect
                        x={c.pageX + pageDrawW * 0.08}
                        y={c.pageY + pageDrawH * 0.06}
                        width={pageDrawW * 0.35}
                        height={pageDrawH * 0.025}
                        fill="#0f172a"
                      />
                      <rect
                        x={c.pageX + pageDrawW * 0.08}
                        y={c.pageY + pageDrawH * 0.1}
                        width={pageDrawW * 0.3}
                        height={pageDrawH * 0.018}
                        fill="#64748b"
                      />

                      {/* Barcode area */}
                      <rect
                        x={c.pageX + pageDrawW * 0.05}
                        y={c.pageY + pageDrawH * 0.23}
                        width={pageDrawW * 0.9}
                        height={pageDrawH * 0.12}
                        fill="#000000"
                        opacity="0.9"
                      />

                      {/* SKU / Invoice block */}
                      <rect
                        x={c.pageX + pageDrawW * 0.05}
                        y={c.pageY + pageDrawH * 0.38}
                        width={pageDrawW * 0.9}
                        height={pageDrawH * 0.32}
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="0.3"
                      />
                      <rect
                        x={c.pageX + pageDrawW * 0.08}
                        y={c.pageY + pageDrawH * 0.41}
                        width={pageDrawW * 0.4}
                        height={pageDrawH * 0.025}
                        fill="#475569"
                      />
                      <rect
                        x={c.pageX + pageDrawW * 0.08}
                        y={c.pageY + pageDrawH * 0.45}
                        width={pageDrawW * 0.75}
                        height={pageDrawH * 0.015}
                        fill="#94a3b8"
                      />
                      <rect
                        x={c.pageX + pageDrawW * 0.08}
                        y={c.pageY + pageDrawH * 0.48}
                        width={pageDrawW * 0.65}
                        height={pageDrawH * 0.015}
                        fill="#94a3b8"
                      />

                      {/* Bottom 1/4 area notice (empty) */}
                      <rect
                        x={c.pageX + pageDrawW * 0.05}
                        y={c.pageY + pageDrawH * 0.75}
                        width={pageDrawW * 0.9}
                        height={pageDrawH * 0.22}
                        fill="#f1f5f9"
                        stroke="#cbd5e1"
                        strokeWidth="0.2"
                        strokeDasharray="1 1"
                      />
                    </g>
                  )}
                </g>

                {/* Cell Border */}
                {config.drawBorders && (
                  <rect
                    x={c.cellX}
                    y={c.cellY}
                    width={cellW}
                    height={cellH}
                    fill="none"
                    stroke={config.borderColorHex}
                    strokeWidth={config.borderWidthPt * 0.4}
                  />
                )}

                {/* Page Number Badge */}
                {config.drawPageNumbers && c.existsInDoc && (
                  <g>
                    <rect
                      x={c.cellX + cellW - 7}
                      y={c.cellY + cellH - 5.5}
                      width="6"
                      height="4.5"
                      fill="#1e1b4b"
                      rx="0.6"
                    />
                    <text
                      x={c.cellX + cellW - 4}
                      y={c.cellY + cellH - 2.2}
                      fontSize="2.8"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#ffffff"
                      textAnchor="middle"
                    >
                      {c.pageNum}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Metrics footer banner */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px] sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
          <div className="text-slate-400">Scaling Mode</div>
          <div className="font-mono font-semibold text-emerald-400">
            {config.pictureScaling === 'fitWidth'
              ? 'Match Width (Stretch)'
              : config.pictureScaling}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
          <div className="text-slate-400">Picture Align</div>
          <div className="font-mono font-semibold text-cyan-300">
            {config.pictureAlign === 'top-middle' ? 'Top Middle' : config.pictureAlign}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
          <div className="text-slate-400">Cell Dimensions</div>
          <div className="font-mono font-semibold text-indigo-300">
            {cellW.toFixed(1)} × {cellH.toFixed(1)} mm
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
          <div className="text-slate-400">Page Margins</div>
          <div className="font-mono font-semibold text-slate-300">
            {top === 0 && bottom === 0 && left === 0 && right === 0
              ? 'No (Minimum Allowable)'
              : `${top}/${bottom}/${left}/${right} mm`}
          </div>
        </div>
      </div>
    </div>
  );
};
