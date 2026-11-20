'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  Copy,
  Check,
  FileCode,
  Layers,
  Sparkles,
  Sliders,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  Maximize2,
  Filter,
  Palette
} from 'lucide-react';

interface RawPathData {
  d: string;
  fillHex: string;
  hexRRGGBB: string;
  argbHex: string;
  opacity: number;
  originalIndex: number;
  transformMatrix: number[];
}

interface AlightPathShape {
  id: number;
  label: string;
  centerX: number;
  centerY: number;
  relativeD: string;
  hexRRGGBB: string;
  argbHex: string;
  opacity: number;
  area: number;
  originalIndex: number;
}

interface Point {
  x: number;
  y: number;
}

type CanvasRatio = '1:1' | '9:16' | '16:9';
type QualityPreset = 'ultra' | 'standard';

const CANVAS_PRESETS: Record<CanvasRatio, { width: number; height: number; label: string; desc: string }> = {
  '1:1': { width: 1080, height: 1080, label: '1:1', desc: '1080×1080 (Square)' },
  '9:16': { width: 1080, height: 1920, label: '9:16', desc: '1080×1920 (Vertikal / Story)' },
  '16:9': { width: 1920, height: 1080, label: '16:9', desc: '1920×1080 (Landscape / Video)' },
};

const QUALITY_CONFIGS: Record<QualityPreset, { maxLayers: number; colors: number; pathOmit: number; minRatio: number; label: string; desc: string }> = {
  ultra: {
    maxLayers: 380,
    colors: 24,
    pathOmit: 2,
    minRatio: 0.005,
    label: 'Ultra Tajam (VTracer Logo & Teks Detail)',
    desc: 'Mesin VTracer Rust tingkat profesional — kurva bulat sempurna, teks melingkar dan lambang Garuda tajam tanpa blur.',
  },
  standard: {
    maxLayers: 160,
    colors: 14,
    pathOmit: 4,
    minRatio: 0.02,
    label: 'Standar (Cepat & Ringan)',
    desc: 'Tracing lebih cepat, jumlah layer lebih ringkas untuk ilustrasi umum.',
  },
};

function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseColorToArgb(colorStr: string, defaultAlpha = 255): { hex: string; hexRRGGBB: string; argb: string; alpha: number } {
  const clean = colorStr.trim().toLowerCase();
  if (!clean || clean === 'none' || clean === 'transparent') {
    return { hex: '#000000', hexRRGGBB: '000000', argb: '#00000000', alpha: 0 };
  }

  // Handle rgb(r, g, b) / rgba(r, g, b, a)
  const rgbMatch = clean.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)));
    const a = rgbMatch[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgbMatch[4]))) : defaultAlpha / 255;
    const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    const hexRRGGBB = `${rHex}${gHex}${bHex}`.toLowerCase();
    return {
      hex: `#${hexRRGGBB}`,
      hexRRGGBB,
      argb: `#${aHex}${hexRRGGBB}`,
      alpha: a,
    };
  }

  // Handle #RGB or #RRGGBB
  if (clean.startsWith('#')) {
    let hex = clean.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 6) {
      const hexRRGGBB = hex.toLowerCase();
      return {
        hex: `#${hexRRGGBB}`,
        hexRRGGBB,
        argb: `#ff${hexRRGGBB}`,
        alpha: 1,
      };
    }
    if (hex.length === 8) {
      const a = parseInt(hex.slice(0, 2), 16) / 255;
      const hexRRGGBB = hex.slice(2).toLowerCase();
      return {
        hex: `#${hexRRGGBB}`,
        hexRRGGBB,
        argb: `#${hex.toLowerCase()}`,
        alpha: a,
      };
    }
  }

  const NAMED_COLORS: Record<string, string> = {
    black: '000000',
    white: 'ffffff',
    red: 'ff0000',
    green: '00ff00',
    blue: '0000ff',
    yellow: 'ffff00',
    cyan: '00ffff',
    magenta: 'ff00ff',
    gray: '808080',
    grey: '808080',
  };
  if (NAMED_COLORS[clean]) {
    const hexRRGGBB = NAMED_COLORS[clean];
    return { hex: `#${hexRRGGBB}`, hexRRGGBB, argb: `#ff${hexRRGGBB}`, alpha: 1 };
  }

  return { hex: '#000000', hexRRGGBB: '000000', argb: '#ff000000', alpha: 1 };
}

function distanceToSegment(p: Point, p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
  let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (p1.x + t * dx), p.y - (p1.y + t * dy));
}

function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const rec1 = douglasPeucker(points.slice(0, index + 1), epsilon);
    const rec2 = douglasPeucker(points.slice(index), epsilon);
    return rec1.slice(0, -1).concat(rec2);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function isNearWhite(hexRRGGBB: string): boolean {
  if (!hexRRGGBB || hexRRGGBB.length !== 6) return false;
  const r = parseInt(hexRRGGBB.slice(0, 2), 16);
  const g = parseInt(hexRRGGBB.slice(2, 4), 16);
  const b = parseInt(hexRRGGBB.slice(4, 6), 16);
  return r >= 245 && g >= 245 && b >= 245;
}

/**
 * Multiplies two 2D affine transformation matrices: [a, b, c, d, e, f]
 * representing 3x3 affine matrix:
 * [ a  c  e ]
 * [ b  d  f ]
 * [ 0  0  1 ]
 */
function multiplyMatrices(m1: number[], m2: number[]): number[] {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

/**
 * Parses an SVG transform attribute string into a 2D affine matrix [a, b, c, d, e, f].
 * Identity matrix: [1, 0, 0, 1, 0, 0]
 * Handles translate, scale, matrix, rotate, skewX, skewY with space or comma delimiters.
 */
function parseSvgTransform(transformStr: string): number[] {
  let matrix = [1, 0, 0, 1, 0, 0];
  if (!transformStr || !transformStr.trim()) return matrix;

  const fnRegex = /([a-zA-Z]+)\s*\(([^)]+)\)/g;
  const numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
  let match: RegExpExecArray | null;

  while ((match = fnRegex.exec(transformStr)) !== null) {
    const type = match[1].toLowerCase();
    const rawNums = match[2].match(numRegex) || [];
    const args = rawNums.map(parseFloat).filter(Number.isFinite);

    let m = [1, 0, 0, 1, 0, 0];
    if (type === 'translate') {
      const tx = args[0] || 0;
      const ty = args.length > 1 ? args[1] : 0;
      m = [1, 0, 0, 1, tx, ty];
    } else if (type === 'scale') {
      const sx = args[0] !== undefined ? args[0] : 1;
      const sy = args.length > 1 ? args[1] : sx;
      m = [sx, 0, 0, sy, 0, 0];
    } else if (type === 'matrix' && args.length >= 6) {
      m = [args[0], args[1], args[2], args[3], args[4], args[5]];
    } else if (type === 'rotate') {
      const deg = args[0] || 0;
      const rad = (deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      if (args.length >= 3) {
        const cx = args[1];
        const cy = args[2];
        const t1 = [1, 0, 0, 1, cx, cy];
        const r = [cos, sin, -sin, cos, 0, 0];
        const t2 = [1, 0, 0, 1, -cx, -cy];
        m = multiplyMatrices(t1, multiplyMatrices(r, t2));
      } else {
        m = [cos, sin, -sin, cos, 0, 0];
      }
    } else if (type === 'skewx') {
      const deg = args[0] || 0;
      const rad = (deg * Math.PI) / 180;
      m = [1, 0, Math.tan(rad), 1, 0, 0];
    } else if (type === 'skewy') {
      const deg = args[0] || 0;
      const rad = (deg * Math.PI) / 180;
      m = [1, Math.tan(rad), 0, 1, 0, 0];
    }

    matrix = multiplyMatrices(matrix, m);
  }

  return matrix;
}

/**
 * Traverses an SVG element upwards to rootSvg, accumulating all transform attributes
 * from ancestor <g> containers down to the element itself.
 */
function getCumulativeTransform(el: Element, rootSvg: Element): number[] {
  let curr: Element | null = el;
  const transforms: string[] = [];

  while (curr && curr !== rootSvg && curr.tagName.toLowerCase() !== 'svg') {
    const tAttr = curr.getAttribute('transform');
    const styleAttr = curr.getAttribute('style') || '';
    const styleMatch = styleAttr.match(/transform:\s*([^;]+)/i);
    const styleT = styleMatch ? styleMatch[1].trim() : '';

    const combined = [tAttr, styleT].filter(Boolean).join(' ');
    if (combined) {
      transforms.unshift(combined);
    }
    curr = curr.parentElement;
  }

  let finalMatrix = [1, 0, 0, 1, 0, 0];
  for (const t of transforms) {
    const m = parseSvgTransform(t);
    finalMatrix = multiplyMatrices(finalMatrix, m);
  }

  return finalMatrix;
}

/**
 * Transforms a 2D point (x, y) with an affine matrix [a, b, c, d, e, f].
 */
function transformPoint(pt: Point, m: number[]): Point {
  return {
    x: pt.x * m[0] + pt.y * m[2] + m[4],
    y: pt.x * m[1] + pt.y * m[3] + m[5],
  };
}

/**
 * Splits a compound SVG path string into individual sub-paths by 'M' / 'm' commands.
 * This guarantees getPointAtLength() is called per sub-path and NEVER draws stray connecting lines across holes.
 */
function splitIntoSubPaths(d: string): string[] {
  if (!d || !d.trim()) return [];
  const subPaths: string[] = [];
  const regex = /([Mm][^Mm]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(d)) !== null) {
    const sp = match[1].trim();
    if (sp) subPaths.push(sp);
  }
  return subPaths.length > 0 ? subPaths : [d.trim()];
}

/**
 * Normalizes any SVG path string (including compound paths with holes / multiple islands)
 * into high-precision Alight Motion polygon points format:
 * "M rx0 ry0L rx1 ry1...L rx0 ry0" (closing with initial point, strictly NO 'Z').
 * Samples sub-paths independently to eliminate stray connecting lines.
 * Applies element & ancestor SVG transformMatrix to guarantee 100% accurate world position.
 */
function normalizePathToAlightMotion(
  d: string,
  scale: number,
  offsetX: number,
  offsetY: number,
  transformMatrix: number[] = [1, 0, 0, 1, 0, 0]
): {
  normalizedPath: string;
  centerX: number;
  centerY: number;
  area: number;
} | null {
  if (!d || !d.trim() || typeof document === 'undefined') return null;

  try {
    const rawSubPaths = splitIntoSubPaths(d);
    if (rawSubPaths.length === 0) return null;

    // Attach temporarily to an offscreen helper to guarantee SVG measurement works in all browser engines
    let helperSvg = document.getElementById('__am_svg_measure_helper') as SVGSVGElement | null;
    if (!helperSvg) {
      helperSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      helperSvg.id = '__am_svg_measure_helper';
      helperSvg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0;');
      document.body.appendChild(helperSvg);
    }

    const processedSubPaths: Point[][] = [];
    let globalMinX = Infinity, globalMinY = Infinity, globalMaxX = -Infinity, globalMaxY = -Infinity;

    for (const subD of rawSubPaths) {
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', subD);
      helperSvg.appendChild(pathEl);

      let subPathLen = 0;
      try {
        subPathLen = pathEl.getTotalLength();
      } catch {
        subPathLen = 0;
      }

      const rawPoints: Point[] = [];

      if (Number.isFinite(subPathLen) && subPathLen > 0) {
        // High-density adaptive sampling for ultra-sharp curves: Math.max(20, Math.min(240, Math.ceil(subPathLen / 2.2)))
        const numSteps = Math.max(20, Math.min(240, Math.ceil(subPathLen / 2.2)));
        for (let i = 0; i <= numSteps; i++) {
          const len = (i / numSteps) * subPathLen;
          const pt = pathEl.getPointAtLength(len);
          if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
            // Apply cumulative SVG transform (e.g. translate from VTracer / <g>) to obtain true world coordinate
            const worldPt = transformPoint(pt, transformMatrix);
            rawPoints.push({
              x: worldPt.x * scale + offsetX,
              y: worldPt.y * scale + offsetY,
            });
          }
        }
      } else {
        const numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
        let match: RegExpExecArray | null;
        const coords: number[] = [];
        while ((match = numRegex.exec(subD)) !== null) {
          const val = parseFloat(match[0]);
          if (Number.isFinite(val)) coords.push(val);
        }
        for (let i = 0; i < coords.length; i += 2) {
          if (coords[i + 1] !== undefined) {
            const worldPt = transformPoint({ x: coords[i], y: coords[i + 1] }, transformMatrix);
            rawPoints.push({
              x: worldPt.x * scale + offsetX,
              y: worldPt.y * scale + offsetY,
            });
          }
        }
      }

      try {
        helperSvg.removeChild(pathEl);
      } catch {
        // ignore
      }

      if (rawPoints.length < 3) continue;

      // Douglas-Peucker point reduction with ultra-fine tolerance (epsilon = 0.35) for perfectly round circles and smooth curves
      const simplified = douglasPeucker(rawPoints, 0.35);
      const finalPoints = simplified.length >= 3 ? simplified : rawPoints;

      // Update global bounding box across all sub-paths
      for (const pt of finalPoints) {
        if (pt.x < globalMinX) globalMinX = pt.x;
        if (pt.x > globalMaxX) globalMaxX = pt.x;
        if (pt.y < globalMinY) globalMinY = pt.y;
        if (pt.y > globalMaxY) globalMaxY = pt.y;
      }

      processedSubPaths.push(finalPoints);
    }

    if (
      processedSubPaths.length === 0 ||
      !Number.isFinite(globalMinX) ||
      !Number.isFinite(globalMaxX) ||
      !Number.isFinite(globalMinY) ||
      !Number.isFinite(globalMaxY)
    ) {
      return null;
    }

    const centerX = (globalMinX + globalMaxX) / 2;
    const centerY = (globalMinY + globalMaxY) / 2;
    const area = Math.max(0, (globalMaxX - globalMinX) * (globalMaxY - globalMinY));
    if (area <= 0 || !Number.isFinite(area)) return null;

    // Construct pure "M x0 y0L x1 y1...L x0 y0" for each sub-path relative to (centerX, centerY)
    // and concatenate without 'Z', eliminating stray connecting lines
    const subPathStrings: string[] = [];

    for (const pts of processedSubPaths) {
      if (pts.length < 3) continue;
      let spStr = '';
      const firstRx = (pts[0].x - centerX).toFixed(3);
      const firstRy = (pts[0].y - centerY).toFixed(3);

      pts.forEach((pt, idx) => {
        const rx = (pt.x - centerX).toFixed(3);
        const ry = (pt.y - centerY).toFixed(3);
        if (idx === 0) {
          spStr += `M ${rx} ${ry}`;
        } else {
          spStr += `L ${rx} ${ry}`;
        }
      });

      // Close sub-path by repeating its own initial point with 'L', strictly NO 'Z'
      spStr += `L ${firstRx} ${firstRy}`;
      subPathStrings.push(spStr);
    }

    if (subPathStrings.length === 0) return null;

    return {
      normalizedPath: subPathStrings.join(''),
      centerX,
      centerY,
      area,
    };
  } catch {
    return null;
  }
}

export const AutoVectorXmlTool: React.FC = () => {
  const [svgRawString, setSvgRawString] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'svg' | 'raster' | null>(null);
  const [fileName, setFileName] = useState<string>('vector-project');
  const [canvasRatio, setCanvasRatio] = useState<CanvasRatio>('1:1');
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>('ultra');
  const [ignoreWhiteBackground, setIgnoreWhiteBackground] = useState<boolean>(true);

  const [shapes, setShapes] = useState<AlightPathShape[]>([]);
  const [xmlOutput, setXmlOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'xml'>('preview');
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const activeImageFileRef = useRef<File | null>(null);

  // Converts native SVG (or SVG string generated by ImageTracer) to Alight Motion Path Shapes
  const convertSvgToAlightShapes = useCallback(
    (svgText: string): AlightPathShape[] => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return [];

      const currentSize = CANVAS_PRESETS[canvasRatio];
      const canvasW = currentSize.width;
      const canvasH = currentSize.height;

      // 1. Determine SVG viewbox and target canvas scaling
      let vbMinX = 0, vbMinY = 0, vbW = 1080, vbH = 1080;
      const viewBoxAttr = svgEl.getAttribute('viewBox');
      if (viewBoxAttr) {
        const parts = viewBoxAttr.split(/[\s,]+/).map(parseFloat);
        if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
          vbMinX = parts[0];
          vbMinY = parts[1];
          vbW = parts[2];
          vbH = parts[3];
        }
      } else {
        const wAttr = parseFloat(svgEl.getAttribute('width') || '1080');
        const hAttr = parseFloat(svgEl.getAttribute('height') || '1080');
        if (wAttr > 0 && hAttr > 0) {
          vbW = wAttr;
          vbH = hAttr;
        }
      }

      // Proportional scale to occupy 82% of canvas, perfectly centered
      const scale = Math.min((canvasW * 0.82) / vbW, (canvasH * 0.82) / vbH);
      const offsetX = (canvasW - vbW * scale) / 2 - vbMinX * scale;
      const offsetY = (canvasH - vbH * scale) / 2 - vbMinY * scale;

      // 2. Extract vector elements (<path>, <polygon>, <polyline>, <rect>, <circle>, <ellipse>)
      const elements = doc.querySelectorAll('path, polygon, polyline, rect, circle, ellipse');
      const rawPaths: RawPathData[] = [];
      let elementIdx = 0;

      elements.forEach((el) => {
        let d = '';
        const tag = el.tagName.toLowerCase();

        if (tag === 'path') {
          d = el.getAttribute('d') || '';
        } else if (tag === 'polygon' || tag === 'polyline') {
          const points = el.getAttribute('points') || '';
          const pairs = points.trim().split(/[\s,]+/);
          if (pairs.length >= 4) {
            d = `M ${pairs[0]} ${pairs[1]}`;
            for (let i = 2; i < pairs.length; i += 2) {
              if (pairs[i] && pairs[i + 1]) {
                d += ` L ${pairs[i]} ${pairs[i + 1]}`;
              }
            }
            if (tag === 'polygon') d += ' Z';
          }
        } else if (tag === 'rect') {
          const x = parseFloat(el.getAttribute('x') || '0');
          const y = parseFloat(el.getAttribute('y') || '0');
          const w = parseFloat(el.getAttribute('width') || '0');
          const h = parseFloat(el.getAttribute('height') || '0');
          if (w > 0 && h > 0) {
            d = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
          }
        } else if (tag === 'circle') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const r = parseFloat(el.getAttribute('r') || '0');
          if (r > 0) {
            const k = 0.5522847498 * r;
            d = `M ${cx} ${cy - r} C ${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} C ${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C ${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C ${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} Z`;
          }
        } else if (tag === 'ellipse') {
          const cx = parseFloat(el.getAttribute('cx') || '0');
          const cy = parseFloat(el.getAttribute('cy') || '0');
          const rx = parseFloat(el.getAttribute('rx') || '0');
          const ry = parseFloat(el.getAttribute('ry') || '0');
          if (rx > 0 && ry > 0) {
            const kx = 0.5522847498 * rx;
            const ky = 0.5522847498 * ry;
            d = `M ${cx} ${cy - ry} C ${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy} C ${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry} C ${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy} C ${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry} Z`;
          }
        }

        if (!d.trim()) return;

        // Parse colors & opacity
        const style = el.getAttribute('style') || '';
        const fillAttr = el.getAttribute('fill') || '';

        let fillVal = fillAttr;
        const fillMatch = style.match(/fill:\s*([^;]+)/i);
        if (fillMatch) fillVal = fillMatch[1];
        if (!fillVal || fillVal === 'none') {
          const strokeAttr = el.getAttribute('stroke') || '';
          const strokeMatch = style.match(/stroke:\s*([^;]+)/i);
          const strokeVal = strokeMatch ? strokeMatch[1] : strokeAttr;
          if (strokeVal && strokeVal !== 'none') {
            fillVal = strokeVal;
          } else {
            fillVal = '#000000';
          }
        }

        const { hex: fillHex, hexRRGGBB, argb: argbHex, alpha } = parseColorToArgb(fillVal);

        if (alpha < 0.05) return;

        // Calculate cumulative transformation matrix from root <svg> down to this element
        const transformMatrix = getCumulativeTransform(el, svgEl);

        rawPaths.push({
          d,
          fillHex,
          hexRRGGBB,
          argbHex,
          opacity: alpha,
          originalIndex: elementIdx++,
          transformMatrix,
        });
      });

      if (rawPaths.length === 0) return [];

      // 3. Normalize each path to Alight Motion coordinates with true cumulative transform applied
      const candidateShapes: AlightPathShape[] = [];

      rawPaths.forEach((p, idx) => {
        const norm = normalizePathToAlightMotion(p.d, scale, offsetX, offsetY, p.transformMatrix);
        if (norm && norm.normalizedPath) {
          // Filter background putih/transparan jika toggle ON (layer > 85% area vektor atau > 60% kanvas)
          const isFullBackground =
            norm.area > vbW * vbH * scale * scale * 0.85 ||
            norm.area > canvasW * canvasH * 0.60;

          if (ignoreWhiteBackground && isNearWhite(p.hexRRGGBB) && isFullBackground) {
            return;
          }

          candidateShapes.push({
            id: 1000001 + idx,
            label: `Shape_${idx + 1}`,
            centerX: norm.centerX,
            centerY: norm.centerY,
            relativeD: norm.normalizedPath,
            hexRRGGBB: p.hexRRGGBB,
            argbHex: p.argbHex,
            opacity: p.opacity,
            area: norm.area,
            originalIndex: p.originalIndex,
          });
        }
      });

      // 4. Urutan Z-Index Presisi:
      // - Untuk file .SVG asli: pertahankan urutan render dokumen SVG asli (originalIndex)
      //   agar susunan layer desain tetap presisi tanpa tertukar.
      // - Untuk hasil trace foto PNG/JPG: urutkan berdasarkan luas bounding-box secara descending (b.area - a.area)
      //   agar background berada di bawah dan detail huruf/mata tetap tajam di atas.
      let finalSorted: AlightPathShape[] = [];
      if (sourceType === 'svg') {
        finalSorted = [...candidateShapes].sort((a, b) => a.originalIndex - b.originalIndex);
      } else {
        finalSorted = [...candidateShapes].sort((a, b) => b.area - a.area);
      }

      // Cap according to quality preset (max ~380 layers)
      const config = QUALITY_CONFIGS[qualityPreset];
      const capped = finalSorted.slice(0, config.maxLayers);

      // Re-index labels strictly as Shape_1, Shape_2, ..., Shape_N with id starting at 1
      return capped.map((s, i) => ({
        ...s,
        id: i + 1,
        label: `Shape_${i + 1}`,
      }));
    },
    [canvasRatio, qualityPreset, ignoreWhiteBackground, sourceType]
  );

  /**
   * Generates official Alight Motion XML 100% identical to Alight Motion 6.2.60 schema:
   * No 's' attribute in <shape>, no 'Z' in <path>, closed with repeating first point.
   */
  const generateAlightMotionXml = (shapeList: AlightPathShape[]): string => {
    const safeTitle = escapeXmlAttr(fileName || 'Vector_Alight_Project');
    const { width: w, height: h } = CANVAS_PRESETS[canvasRatio];
    const modTime = Date.now();

    const shapesXml = shapeList
      .map((s, i) => {
        const posX = Number.isFinite(s.centerX) ? s.centerX : w / 2;
        const posY = Number.isFinite(s.centerY) ? s.centerY : h / 2;
        const hexClean = (s.hexRRGGBB || '000000').replace(/[^0-9a-fA-F]/g, '').toUpperCase().padStart(6, '0').slice(-6);

        return `  <shape id="${i + 1}" label="Shape_${i + 1}" startTime="0" endTime="1999" fillType="color">
    <transform>
      <location value="${posX.toFixed(6)},${posY.toFixed(6)},0.000000"/>
    </transform>
    <fillColor value="#FF${hexClean}"/>
    <path d="${s.relativeD}"/>
  </shape>`;
      })
      .join('\n');

    return `<?xml version='1.0' encoding='UTF-8' ?>
<scene title="${safeTitle}" width="${w}" height="${h}" exportWidth="${w}" exportHeight="${h}" bgcolor="#FF000000" totalTime="1999" fps="60" modifiedTime="${modTime}" amver="869" ffver="107" am="com.alightcreative.motion/6.2.60" amplatform="ios" precompose="dynamicResolution" retime="freeze">
${shapesXml}
</scene>`;
  };

  // Re-generate XML whenever shapes or parameters change
  useEffect(() => {
    if (!svgRawString) return;
    const computedShapes = convertSvgToAlightShapes(svgRawString);
    setShapes(computedShapes);
    const xml = generateAlightMotionXml(computedShapes);
    setXmlOutput(xml);
  }, [svgRawString, convertSvgToAlightShapes, fileName, canvasRatio]);

  // Traces raster image to SVG: Prioritizes Ultra-Sharp VTracer Rust backend with high-res client fallback
  const traceImageToSvg = async (file: File, preset: QualityPreset) => {
    const config = QUALITY_CONFIGS[preset];

    // 1. Try VTracer Rust Backend for ultra-sharp vectorization (no downscaling below 1024px)
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/vectorize', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.svg && data.svg.includes('<svg')) {
          return data.svg;
        }
      }
    } catch (vtracerErr) {
      console.warn('VTracer backend fetch failed, using high-res client fallback:', vtracerErr);
    }

    // 2. High-Res Client-Side Fallback (ImageTracer with ultra-sharp pre-rendering)
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgUrl = e.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          try {
            // Preserve full resolution (never scale down below 1024px; clamp max to 1600px)
            let tw = img.naturalWidth || 1024;
            let th = img.naturalHeight || 1024;
            const maxDim = 1600;
            if (tw > maxDim || th > maxDim) {
              if (tw > th) {
                th = Math.round((th * maxDim) / tw);
                tw = maxDim;
              } else {
                tw = Math.round((tw * maxDim) / th);
                th = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = tw;
            canvas.height = th;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Gagal menyiapkan context tracing kanvas.');

            ctx.drawImage(img, 0, 0, tw, th);
            const imgData = ctx.getImageData(0, 0, tw, th);

            const itModule = await import('imagetracerjs');
            const ImageTracer = (itModule as any).default || itModule;

            const svgString = ImageTracer.imagedataToSVG(imgData, {
              corsenabled: false,
              ltres: 0.1,
              qtres: 0.1,
              pathomit: config.pathOmit,
              rightangleenhance: true,
              colorsampling: 2,
              numberofcolors: config.colors,
              mincolorratio: config.minRatio,
              colorquantcycles: 3,
              scale: 1,
              roundcoords: 3,
              desc: false,
              viewbox: true,
              blurradius: 0,
              blurdelta: 20,
              strokewidth: 0,
            });

            resolve(svgString);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar untuk proses tracing.'));
        img.src = imgUrl;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });
  };

  // Handles File Input: Supports Direct .SVG as well as Image-to-SVG Tracing for PNG/JPG
  const handleFile = async (file: File) => {
    setValidationError(null);
    setIsProcessing(true);
    activeImageFileRef.current = file;

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^\w-]/g, '_');
    setFileName(`${baseName}-am`);

    // CASE 1: DIRECT SVG FILE (Lossless Parser)
    if (file.name.endsWith('.svg') || file.type === 'image/svg+xml') {
      setSourceType('svg');
      setStatusText('Membaca elemen vektor SVG asli...');
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setSvgRawString(text);
        setIsProcessing(false);
      };
      reader.readAsText(file);
      return;
    }

    // CASE 2: RASTER PHOTO (PNG, JPG, WebP) -> Auto Image-to-SVG Tracing
    if (file.type.startsWith('image/')) {
      setSourceType('raster');
      setStatusText(`Melakukan auto-tracing foto ke layer vektor (${QUALITY_CONFIGS[qualityPreset].label})...`);

      try {
        const svgStr = await traceImageToSvg(file, qualityPreset);
        setSvgRawString(svgStr);
      } catch (err: any) {
        setValidationError(`Gagal memproses gambar: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setValidationError('Format file tidak didukung. Harap unggah file .SVG, .PNG, .JPG, atau .WEBP.');
      setIsProcessing(false);
    }
  };

  // Re-run tracing if user changes quality preset while a raster image is loaded
  const handleQualityChange = async (newPreset: QualityPreset) => {
    setQualityPreset(newPreset);
    if (sourceType === 'raster' && activeImageFileRef.current) {
      setIsProcessing(true);
      setStatusText(`Memperbarui tracing vektor (${QUALITY_CONFIGS[newPreset].label})...`);
      try {
        const svgStr = await traceImageToSvg(activeImageFileRef.current, newPreset);
        setSvgRawString(svgStr);
      } catch (err: any) {
        setValidationError(`Gagal memperbarui tracing: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCopyXml = () => {
    if (!xmlOutput) return;
    navigator.clipboard.writeText(xmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXml = () => {
    setValidationError(null);

    if (!xmlOutput) {
      setValidationError('Kode XML belum tersedia.');
      return;
    }
    if (!xmlOutput.startsWith("<?xml version='1.0' encoding='UTF-8' ?>") && !xmlOutput.startsWith("<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>")) {
      setValidationError('Format header XML tidak sesuai spesifikasi resmi Alight Motion.');
      return;
    }
    if (!xmlOutput.includes('</scene>')) {
      setValidationError('Tag penutup </scene> tidak ditemukan.');
      return;
    }
    if (shapes.length === 0) {
      setValidationError('Tidak ada layer vektor path yang dihasilkan.');
      return;
    }

    const cleanName = (fileName || 'project-alight').replace(/[^\w-]/g, '_');
    const blob = new Blob([xmlOutput], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanName.endsWith('.xml') ? cleanName : `${cleanName}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const xmlSizeKb = (new Blob([xmlOutput]).size / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Banner - 100% Free & No Tokens */}
      <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="neo-badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% GRATIS TANPA TOKEN
          </span>
          <span className="neo-badge bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Layer Shape_1 .. Shape_N
          </span>
          <span className="text-xs font-mono text-[var(--neo-text-muted)]">
            Alight Motion XML Generator
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-[var(--neo-text)]">
          Auto Vector SVG &amp; Foto to Alight Motion XML
        </h2>
        <p className="text-xs text-[var(--neo-text-muted)] max-w-2xl leading-relaxed">
          Konversi file <strong>.SVG asli</strong> atau gambar <strong>.PNG / .JPG</strong> menjadi file XML Alight Motion resmi. Setiap potongan kurva menjadi layer vektor mandiri (<code>Shape_1</code>, <code>Shape_2</code>, ..., <code>Shape_351</code>) yang langsung tampil utuh di kanvas dan bisa dipilih serta dianimasikan satu per satu.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Live Preview Stage (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Upload Drag & Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            className="neo-card p-6 rounded-2xl border-2 border-dashed border-[var(--neo-border)] hover:border-black dark:hover:border-white transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center bg-[var(--neo-bg)] group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".svg,image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-2 border-black flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-black text-[var(--neo-text)]">
                Klik atau Tarik File .SVG / Foto (.PNG, .JPG) ke Sini
              </p>
              <p className="text-[11px] text-[var(--neo-text-muted)]">
                Mendukung SVG murni (lossless) &amp; tracing foto otomatis bebas token
              </p>
            </div>
          </div>

          {/* Vector Stage / XML Code Tabs & Display */}
          {svgRawString && (
            <div className="neo-card p-4 rounded-2xl bg-[var(--neo-surface)] space-y-3">
              {/* Stage Top Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'preview'
                        ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-black shadow-xs font-black'
                        : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Vektor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('xml')}
                    className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'xml'
                        ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-black shadow-xs font-black'
                        : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)]'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Kode XML</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="neo-badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-[10px] font-bold">
                    {shapes.length} Layer Siap
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 uppercase">
                    {sourceType === 'svg' ? 'SVG Asli' : 'Auto-Traced'}
                  </span>
                </div>
              </div>

              {/* Display Box */}
              <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border-2 border-black bg-neutral-950 flex items-center justify-center">
                {activeTab === 'preview' ? (
                  <div
                    ref={stageRef}
                    className="w-full h-full p-4 flex items-center justify-center overflow-hidden bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px]"
                  >
                    <div
                      className="relative max-h-full max-w-full aspect-square rounded-xl shadow-2xl border border-white/10 bg-black/40 flex items-center justify-center p-2"
                      style={{ width: '100%', height: '100%' }}
                      dangerouslySetInnerHTML={{ __html: svgRawString }}
                    />
                  </div>
                ) : (
                  <pre className="w-full h-full p-4 overflow-auto text-[11px] font-mono text-emerald-400 bg-neutral-950 leading-relaxed select-all">
                    {xmlOutput}
                  </pre>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="text-xs font-bold font-mono">{statusText || 'Sedang memproses...'}</span>
                  </div>
                )}
              </div>

              {/* Validation Notice */}
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border-2 border-rose-500 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* File Name & Download Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-[var(--neo-bg)] border border-[var(--neo-border)]">
                    <FileText className="w-4 h-4 text-[var(--neo-text-muted)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--neo-text-muted)] shrink-0">Nama File:</span>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="flex-1 bg-transparent text-xs font-mono font-bold text-[var(--neo-text)] focus:outline-none"
                      placeholder="nama-file"
                    />
                    <span className="text-xs font-mono text-[var(--neo-text-muted)] shrink-0">.xml</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleCopyXml}
                    disabled={!xmlOutput || isProcessing}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-black bg-[var(--neo-bg)] hover:bg-[var(--neo-surface)] text-[var(--neo-text)] font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>📋 Salin Kode XML</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadXml}
                    disabled={!xmlOutput || isProcessing || shapes.length === 0}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-black bg-[var(--neo-accent)] text-[var(--neo-accent-text)] font-black text-xs flex items-center justify-center gap-2 shadow-xs hover:brightness-105 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>⬇️ Unduh File .XML Alight Motion</span>
                  </button>
                </div>

                {/* XML Stats Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--neo-text-muted)] px-1 pt-1">
                  <span>Ukuran File: <strong>{xmlSizeKb} KB</strong></span>
                  <span>Total Shape: <strong>{shapes.length} Layer</strong></span>
                  <span>Durasi: <strong>2.0 Detik (60 FPS)</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Configuration Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="neo-card p-5 rounded-2xl bg-[var(--neo-surface)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--neo-border)] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--neo-accent-text)]" />
                <h3 className="text-sm font-black text-[var(--neo-text)]">Pengaturan Konversi</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                100% Client-Side
              </span>
            </div>

            {/* Canvas Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold block text-[var(--neo-text)]">
                Rasio Kanvas Alight Motion
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1:1', '9:16', '16:9'] as CanvasRatio[]).map((ratio) => {
                  const item = CANVAS_PRESETS[ratio];
                  const active = canvasRatio === ratio;
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setCanvasRatio(ratio)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-black shadow-xs font-black'
                          : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] font-bold text-xs'
                      }`}
                    >
                      <div className="font-mono text-xs">{item.label}</div>
                      <div className="text-[9px] opacity-75 mt-0.5">{ratio === '1:1' ? 'Square' : ratio === '9:16' ? 'Story' : 'Video'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality Preset / Layer Count (For PNG/JPG) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold block text-[var(--neo-text)]">
                  Tingkat Detail Layer
                </label>
                <span className="text-[10px] text-[var(--neo-text-muted)] font-mono">
                  Maksimal ~350 Layer
                </span>
              </div>
              <div className="space-y-2">
                {(['light', 'standard', 'high'] as QualityPreset[]).map((preset) => {
                  const cfg = QUALITY_CONFIGS[preset];
                  const active = qualityPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQualityChange(preset)}
                      className={`w-full p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                        active
                          ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-black shadow-xs font-black'
                          : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] font-bold text-xs'
                      }`}
                    >
                      <div>
                        <div className="text-xs">{cfg.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5 font-normal">{cfg.desc}</div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 shrink-0 ml-2">
                        &le; {cfg.maxLayers}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ignore White / Transparent Background Toggle */}
            <div className="p-3.5 rounded-xl bg-[var(--neo-bg)] border border-[var(--neo-border)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--neo-text)]">
                  <Filter className="w-3.5 h-3.5 text-amber-500" />
                  <span>Abaikan Background Putih / Transparan</span>
                </div>
                <input
                  type="checkbox"
                  checked={ignoreWhiteBackground}
                  onChange={(e) => setIgnoreWhiteBackground(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-emerald-500"
                />
              </div>
              <p className="text-[10px] text-[var(--neo-text-muted)] leading-relaxed">
                Mencegah kanvas tertutup oleh layer kotak putih besar hasil tracing foto, sehingga bentuk objek utama langsung transparan dan rapi di Alight Motion.
              </p>
            </div>

            {/* Quick Guide / Help */}
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2 text-xs text-[var(--neo-text-muted)]">
              <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cara Pakai di Alight Motion:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                <li>Unduh file <strong>.XML</strong> dari tool ini.</li>
                <li>Buka aplikasi <strong>Alight Motion</strong> di HP.</li>
                <li>Pilih tab <strong>Projects</strong> &gt; <strong>Upload</strong> (ikon panah atas).</li>
                <li>Pilih file <code>.xml</code> yang baru diunduh.</li>
                <li>Seluruh layer (<code>Shape_1</code> .. <code>Shape_N</code>) langsung muncul utuh di timeline dan kanvas!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AutoVectorXmlTool;
