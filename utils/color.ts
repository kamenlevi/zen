
import { closest, diff } from 'color-diff';

export function hexToRgb(hex: string): { R: number; G: number; B: number } {
  const sanitizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(sanitizedHex.substring(0, 2), 16);
  const g = parseInt(sanitizedHex.substring(2, 4), 16);
  const b = parseInt(sanitizedHex.substring(4, 6), 16);
  return { R: r, G: g, B: b };
}

export function getClosestColor(hex: string, colorPalette: { name: string; hex: string }[]): { name: string; hex: string } {
    const rgbColor = hexToRgb(hex);
    const palette = colorPalette.map(color => ({ ...hexToRgb(color.hex), name: color.name, hex: color.hex }));
    const closestColor = closest(rgbColor, palette);
    return { name: closestColor.name, hex: closestColor.hex };
}

export function getColorDifference(hex1: string, hex2: string): number {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    return diff(rgb1, rgb2);
}
