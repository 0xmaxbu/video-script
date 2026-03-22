/**
 * Grid Utilities - Phase 2 Layout System
 *
 * Provides constants and helper functions for the 12-column grid system.
 * All layout components use these helpers for consistent positioning.
 */

export const GRID_CONSTANTS = {
  columns: 12,
  safeZone: { top: 80, right: 120, bottom: 80, left: 120 },
  gutter: 24,
  width: 1920,
  height: 1080,
} as const;

export const TYPOGRAPHY = {
  title: {
    hero: 80,
    section: 60,
    card: 36,
  },
  body: {
    primary: 24,
    secondary: 20,
    caption: 16,
  },
} as const;

// Precomputed values for helper functions
const usableWidthPx =
  GRID_CONSTANTS.width -
  GRID_CONSTANTS.safeZone.left -
  GRID_CONSTANTS.safeZone.right;
const gutterTotalPx = GRID_CONSTANTS.gutter * (GRID_CONSTANTS.columns - 1);
const totalColWidthPx = usableWidthPx - gutterTotalPx;
const colWidthPx = totalColWidthPx / GRID_CONSTANTS.columns;

/**
 * Convert 1-based column index to left pixel position
 * @param col - 1-based column index (1-12)
 */
export const getGridColumnPx = (col: number): number => {
  const col0Based = col - 1;
  return (
    GRID_CONSTANTS.safeZone.left +
    col0Based * (colWidthPx + GRID_CONSTANTS.gutter)
  );
};

/**
 * Get width in pixels for a column span
 * @param cols - Number of columns to span
 */
export const getGridSpanPx = (cols: number): number => {
  return cols * colWidthPx + (cols - 1) * GRID_CONSTANTS.gutter;
};

/**
 * Convert column to percentage of total width (for responsive positioning)
 * @param col - 1-based column index (1-12)
 */
export const getGridColumnPct = (col: number): number => {
  return (getGridColumnPx(col) / GRID_CONSTANTS.width) * 100;
};

/**
 * Get span as percentage of total width
 * @param cols - Number of columns to span
 */
export const getGridSpanPct = (cols: number): number => {
  return (getGridSpanPx(cols) / GRID_CONSTANTS.width) * 100;
};
