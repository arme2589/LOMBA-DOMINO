/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Player {
  id: number; // 1, 2, 3, or 4
  name: string;
  cardsLeft: number;
}

export interface Group {
  id: number; // 1 or 2
  name: string;
  score: number;
  playerIds: number[]; // [1, 3] or [2, 4]
}

export interface PlacedDomino {
  id: string; // Unique ID for key rendering and history
  val1: number; // Outer/Left/Top value
  val2: number; // Outer/Right/Bottom value
  isDouble: boolean;
  playerWhoPlayed: number; // Player ID (1-4)
  side: 'left' | 'right' | 'center'; // Which end of the chain it was added to
  orientation: 'vertical' | 'horizontal'; // Berdiri or Tidur orientation
  timestamp: number; // To track step sequence
  rawVal1: number; // Original card face 1
  rawVal2: number; // Original card face 2
}

export interface MatchHistoryEntry {
  chain: PlacedDomino[];
  players: Player[];
  lastPlayedPlayerId: number | null;
  moveCount: number;
  groups: Group[];
}

export const ALL_DOMINOES: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
  [3, 3], [3, 4], [3, 5], [3, 6],
  [4, 4], [4, 5], [4, 6],
  [5, 5], [5, 6],
  [6, 6]
];
