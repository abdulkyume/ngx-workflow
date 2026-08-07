import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node, Edge } from '../../models';

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

@Component({
  selector: 'ngx-workflow-properties-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./properties-sidebar.component.scss'],
})
export class PropertiesSidebarComponent {
  @Input() node: Node | null = null;
  @Input() edge: Edge | null = null;
  @Output() close = new EventEmitter<void>();
  /**
   * Node property updates. Named `nodeChange` (not `change`) so native DOM
   * `change` events from color/range inputs do not bubble into the parent handler.
   */
  @Output() nodeChange = new EventEmitter<Partial<Node>>();
  @Output() edgeChange = new EventEmitter<Partial<Edge>>();

  shapes = [
    'default',
    'rectangle',
    'circle',
    'diamond',
    'hexagon',
    'round-rectangle',
    'cylinder',
    'cylinder-simple',
    'arrow-rectangle',
    'plus',
    'triangle',
    'parallelogram',
  ];

  updateLabel(label: string) {
    if (!this.node) return;
    this.nodeChange.emit({ label });
  }

  updateWidth(width: number) {
    this.nodeChange.emit({ width });
  }

  updateHeight(height: number) {
    this.nodeChange.emit({ height });
  }

  updateX(x: number) {
    if (!this.node) return;
    this.nodeChange.emit({ position: { x, y: this.node.position.y } });
  }

  updateY(y: number) {
    if (!this.node) return;
    this.nodeChange.emit({ position: { x: this.node.position.x, y } });
  }

  updateBackgroundColor(color: string) {
    if (!this.node) return;
    const currentStyle = this.node.style || {};
    this.nodeChange.emit({ style: { ...currentStyle, backgroundColor: color } });
  }

  updateLabelColor(color: string) {
    if (!this.node) return;
    const currentStyle = this.node.style || {};
    this.nodeChange.emit({ style: { ...currentStyle, color } });
  }

  updateBorderColor(color: string) {
    if (!this.node) return;
    const currentStyle = this.node.style || {};
    this.nodeChange.emit({
      borderColor: color,
      style: { ...currentStyle, borderColor: color },
    });
  }

  updateShapeType(type: string) {
    if (!this.node) return;
    const currentData = this.node.data || {};

    if (type === 'default') {
      this.nodeChange.emit({
        type: 'default',
        data: { ...currentData },
      });
    } else {
      this.nodeChange.emit({
        type: 'shape',
        data: { ...currentData, type },
      });
    }
  }

  updatePorts(ports: number) {
    if (!this.node) return;
    this.nodeChange.emit({ ports: +ports });
  }

  /** Active port ids for the current node.ports setting */
  getActivePorts(): Array<'top' | 'right' | 'bottom' | 'left'> {
    const ports = this.node?.ports ?? 4;
    if (ports === 0) return [];
    if (ports === 1) return ['top'];
    if (ports === 2) return ['top', 'bottom'];
    if (ports === 3) return ['left', 'right'];
    return ['top', 'right', 'bottom', 'left'];
  }

  getPortMaxConnections(handleId: string): number | null {
    const value = this.node?.handleConfig?.[handleId]?.maxConnections;
    return value === undefined ? null : value;
  }

  updateMaxConnectionsPerPort(value: number | string | null): void {
    if (!this.node) return;
    if (value === '' || value === null || value === undefined) {
      this.nodeChange.emit({ maxConnectionsPerPort: undefined });
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) return;
    this.nodeChange.emit({ maxConnectionsPerPort: Math.floor(n) });
  }

  updatePortMaxConnections(handleId: string, value: number | string | null): void {
    if (!this.node) return;
    const current = { ...(this.node.handleConfig || {}) };
    const existing = { ...(current[handleId] || {}) };

    if (value === '' || value === null || value === undefined) {
      delete existing.maxConnections;
      if (Object.keys(existing).length === 0) {
        delete current[handleId];
      } else {
        current[handleId] = existing;
      }
    } else {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 1) return;
      current[handleId] = { ...existing, maxConnections: Math.floor(n) };
    }

    this.nodeChange.emit({ handleConfig: current });
  }

  // --- RGBA color helpers ---

  getNodeColorValue(
    key: 'backgroundColor' | 'color' | 'borderColor',
    fallback: string
  ): string {
    if (!this.node) return fallback;
    if (key === 'borderColor') {
      return this.node.borderColor || this.node.style?.['borderColor'] || fallback;
    }
    return this.node.style?.[key] || fallback;
  }

  toHex(color: string | undefined | null, fallback = '#ffffff'): string {
    const parsed = this.parseColor(color, fallback);
    return (
      '#' +
      [parsed.r, parsed.g, parsed.b]
        .map((c) => Math.round(c).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  toOpacityPercent(color: string | undefined | null, fallback = '#ffffff'): number {
    return Math.round(this.parseColor(color, fallback).a * 100);
  }

  toRgbaString(color: string | undefined | null, fallback = '#ffffff'): string {
    const c = this.parseColor(color, fallback);
    const a = Number(c.a.toFixed(2));
    return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`;
  }

  onColorHexChange(
    key: 'backgroundColor' | 'color' | 'borderColor',
    hex: string,
    current: string | undefined | null,
    fallback: string
  ): void {
    const alpha = this.parseColor(current, fallback).a;
    const next = this.composeRgba(hex, alpha, fallback);
    this.emitNodeColor(key, next);
  }

  onColorOpacityChange(
    key: 'backgroundColor' | 'color' | 'borderColor',
    percent: number | string,
    current: string | undefined | null,
    fallback: string
  ): void {
    const alpha = Math.min(100, Math.max(0, Number(percent))) / 100;
    const base = this.toHex(current, fallback);
    const next = this.composeRgba(base, alpha, fallback);
    this.emitNodeColor(key, next);
  }

  onColorTextChange(
    key: 'backgroundColor' | 'color' | 'borderColor',
    value: string,
    fallback: string
  ): void {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    // Accept any parseable color; normalize to rgba for opacity support
    const parsed = this.parseColor(trimmed, fallback);
    if (!this.isParsableColor(trimmed) && trimmed !== fallback) {
      // Still allow CSS vars / keywords by passing through when parse falls back
      if (/^(var\(|transparent|currentColor|inherit)/i.test(trimmed)) {
        this.emitNodeColor(key, trimmed);
        return;
      }
    }
    this.emitNodeColor(key, this.formatRgba(parsed));
  }

  private emitNodeColor(
    key: 'backgroundColor' | 'color' | 'borderColor',
    color: string
  ): void {
    if (key === 'backgroundColor') this.updateBackgroundColor(color);
    else if (key === 'color') this.updateLabelColor(color);
    else this.updateBorderColor(color);
  }

  private composeRgba(hexOrColor: string, alpha: number, fallback: string): string {
    const rgb = this.parseColor(hexOrColor, fallback);
    return this.formatRgba({ ...rgb, a: alpha });
  }

  private formatRgba(c: RgbaColor): string {
    const a = Number(Math.min(1, Math.max(0, c.a)).toFixed(2));
    return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`;
  }

  private isParsableColor(value: string): boolean {
    const v = value.trim();
    return (
      /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ||
      /^rgba?\(/i.test(v) ||
      /^hsla?\(/i.test(v)
    );
  }

  parseColor(value: string | undefined | null, fallback = '#ffffff'): RgbaColor {
    const fallbackParsed = this.parseColorStrict(fallback) ?? {
      r: 255,
      g: 255,
      b: 255,
      a: 1,
    };
    if (!value || !value.trim()) return fallbackParsed;
    return this.parseColorStrict(value.trim()) ?? fallbackParsed;
  }

  private parseColorStrict(value: string): RgbaColor | null {
    const v = value.trim();

    // #rgb, #rgba, #rrggbb, #rrggbbaa
    const hex = v.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
      let h = hex[1];
      if (h.length === 3 || h.length === 4) {
        h = h
          .split('')
          .map((c) => c + c)
          .join('');
      }
      if (h.length === 6 || h.length === 8) {
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
        return { r, g, b, a };
      }
    }

    // rgb() / rgba()
    const rgb = v.match(
      /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i
    );
    if (rgb) {
      return {
        r: clampByte(+rgb[1]),
        g: clampByte(+rgb[2]),
        b: clampByte(+rgb[3]),
        a: rgb[4] !== undefined ? clamp01(+rgb[4]) : 1,
      };
    }

    // hsl() / hsla() — basic conversion for text input convenience
    const hsl = v.match(
      /^hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%(?:\s*,\s*([0-9.]+))?\s*\)$/i
    );
    if (hsl) {
      const rgbVal = hslToRgb(+hsl[1], +hsl[2] / 100, +hsl[3] / 100);
      return {
        ...rgbVal,
        a: hsl[4] !== undefined ? clamp01(+hsl[4]) : 1,
      };
    }

    return null;
  }

  // Edge Updates
  updateEdgeLabel(label: string) {
    if (!this.edge) return;
    this.edgeChange.emit({ label });
  }

  updateEdgeType(type: any) {
    if (!this.edge) return;
    this.edgeChange.emit({ type });
  }

  updateEdgeAnimated(animated: boolean) {
    if (!this.edge) return;
    // Sidebar shows Flow when animationType is unset — persist that default.
    const payload: Partial<Edge> = { animated };
    if (animated && !this.edge.animationType) {
      payload.animationType = 'flow';
    }
    if (animated && !this.edge.animationDuration) {
      payload.animationDuration = '2s';
    }
    this.edgeChange.emit(payload);
  }

  updateEdgeColor(color: string) {
    if (!this.edge) return;
    const currentStyle = this.edge.style || {};
    this.edgeChange.emit({ style: { ...currentStyle, stroke: color } });
  }

  updateEdgeWidth(width: number) {
    if (!this.edge) return;
    const currentStyle = this.edge.style || {};
    this.edgeChange.emit({ style: { ...currentStyle, strokeWidth: width.toString() } });
  }

  updateEdgeLabelColor(color: string) {
    if (!this.edge) return;
    const currentLabelStyle = this.edge.labelStyle || {};
    this.edgeChange.emit({
      labelStyle: { ...currentLabelStyle, fill: color, color: color },
    });
  }

  updateEdgeAnimationDuration(duration: string) {
    if (!this.edge) return;
    this.edgeChange.emit({ animationDuration: duration });
  }

  updateEdgeAnimationColor(color: string) {
    if (!this.edge) return;
    const currentAnimStyle = this.edge.animationStyle || {};
    this.edgeChange.emit({
      animationStyle: { ...currentAnimStyle, fill: color },
    });
  }

  getEdgeColorValue(
    key: 'stroke' | 'labelFill' | 'animationFill',
    fallback: string
  ): string {
    if (!this.edge) return fallback;
    if (key === 'stroke') return this.edge.style?.['stroke'] || fallback;
    if (key === 'labelFill') {
      return this.edge.labelStyle?.['fill'] || this.edge.labelStyle?.['color'] || fallback;
    }
    return this.edge.animationStyle?.['fill'] || fallback;
  }

  onEdgeColorHexChange(
    key: 'stroke' | 'labelFill' | 'animationFill',
    hex: string,
    current: string | undefined | null,
    fallback: string
  ): void {
    const alpha = this.parseColor(current, fallback).a;
    this.emitEdgeColor(key, this.composeRgba(hex, alpha, fallback));
  }

  onEdgeColorOpacityChange(
    key: 'stroke' | 'labelFill' | 'animationFill',
    percent: number | string,
    current: string | undefined | null,
    fallback: string
  ): void {
    const alpha = Math.min(100, Math.max(0, Number(percent))) / 100;
    const base = this.toHex(current, fallback);
    this.emitEdgeColor(key, this.composeRgba(base, alpha, fallback));
  }

  onEdgeColorTextChange(
    key: 'stroke' | 'labelFill' | 'animationFill',
    value: string,
    fallback: string
  ): void {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    if (/^(var\(|transparent|currentColor|inherit)/i.test(trimmed)) {
      this.emitEdgeColor(key, trimmed);
      return;
    }
    this.emitEdgeColor(key, this.formatRgba(this.parseColor(trimmed, fallback)));
  }

  private emitEdgeColor(
    key: 'stroke' | 'labelFill' | 'animationFill',
    color: string
  ): void {
    if (key === 'stroke') this.updateEdgeColor(color);
    else if (key === 'labelFill') this.updateEdgeLabelColor(color);
    else this.updateEdgeAnimationColor(color);
  }

  updateEdgeAnimationType(type: any) {
    if (!this.edge) return;
    this.edgeChange.emit({ animationType: type });
  }

  updateEdgeStrokeStyle(style: string) {
    if (!this.edge) return;
    const currentStyle = this.edge.style || {};
    this.edgeChange.emit({
      style: { ...currentStyle, strokeDasharray: style },
    });
  }

  updateEdgeMarkerStart(marker: string) {
    if (!this.edge) return;
    this.edgeChange.emit({ markerStart: marker || undefined });
  }

  updateEdgeMarkerEnd(marker: string) {
    if (!this.edge) return;
    this.edgeChange.emit({ markerEnd: marker || undefined });
  }
}

function clampByte(n: number): number {
  return Math.min(255, Math.max(0, n));
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
