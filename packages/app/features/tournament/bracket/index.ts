// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET MODULE BARREL EXPORT
// ════════════════════════════════════════════════════════════════

// Types & Constants
export * from './BracketTypes';

// SVG Definitions
export { BracketSVGDefs, BRACKET_FONT_IMPORT } from './BracketSVGDefs';

// SVG Card Components
export { SVG_Card, BracketMatchNode, BracketChampionBox } from './BracketCard';

// Connector Lines
export { BracketBranch, BracketStraight } from './BracketConnectors';

// Hooks
export { useBracketLayout } from './useBracketLayout';
export { useBracketData, generateMockSlots, generateSlotsFromStore, generateMockMatches } from './useBracketData';

// Engine
export { BracketEngine } from './BracketEngine';

// UI Components
export { BracketToolbar } from './BracketToolbar';
export { BracketMatchDetail } from './BracketMatchDetail';
