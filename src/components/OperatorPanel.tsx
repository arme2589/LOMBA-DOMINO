/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, ALL_DOMINOES, PlacedDomino, Group } from '../types';
import { DominoTile } from './DominoTile';
import { 
  RotateCcw, 
  Trash2, 
  ArrowLeftRight, 
  Plus, 
  Minus, 
  EyeOff, 
  AlertTriangle 
} from 'lucide-react';

interface OperatorPanelProps {
  players: Player[];
  chain: PlacedDomino[];
  bypassValidation: boolean;
  selectedTile: [number, number] | null;
  selectedPlayerId: number;
  selectedSide: 'left' | 'right';
  selectedOrientation: 'vertical' | 'horizontal';
  setBypassValidation: (val: boolean) => void;
  setSelectedTile: (tile: [number, number] | null) => void;
  setSelectedPlayerId: (id: number) => void;
  setSelectedSide: (side: 'left' | 'right') => void;
  setSelectedOrientation: (orientation: 'vertical' | 'horizontal') => void;
  onPlayCard: () => void;
  onUndo: () => void;
  onReset: () => void;
  onUpdatePlayerName: (id: number, name: string) => void;
  onUpdatePlayerCards: (id: number, increment: boolean) => void;
  onHidePanel: () => void;
  validationError: string | null;
  setValidationError: (msg: string | null) => void;
  
  // Tournament Title props
  tournamentTitle: string;
  onUpdateTournamentTitle: (title: string) => void;
  
  // Group Scoreboard props
  groups: Group[];
  onUpdateGroupName: (id: number, name: string) => void;
  onUpdateGroupScore: (id: number, increment: boolean) => void;
  onPass: () => void;
  onNewRound: (winningGroupId: number, points: number) => void;
}

export const OperatorPanel: React.FC<OperatorPanelProps> = ({
  players,
  chain,
  bypassValidation,
  selectedTile,
  selectedPlayerId,
  selectedSide,
  selectedOrientation,
  setBypassValidation,
  setSelectedTile,
  setSelectedPlayerId,
  setSelectedSide,
  setSelectedOrientation,
  onPlayCard,
  onUndo,
  onReset,
  onUpdatePlayerName,
  onUpdatePlayerCards,
  onHidePanel,
  validationError,
  setValidationError,
  
  tournamentTitle,
  onUpdateTournamentTitle,
  
  groups,
  onUpdateGroupName,
  onUpdateGroupScore,
  onPass,
  onNewRound,
}) => {
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>('');

  const [winnerGroupId, setWinnerGroupId] = useState<number>(1);
  const [roundPoints, setRoundPoints] = useState<number>(1);

  // Find if a card has already been played in the chain
  const isTilePlayed = (val1: number, val2: number) => {
    return chain.some(
      (tile) =>
        (tile.rawVal1 === val1 && tile.rawVal2 === val2) ||
        (tile.rawVal1 === val2 && tile.rawVal2 === val1)
    );
  };

  // Get current ends of the chain
  const getEndValue = (side: 'left' | 'right'): number | null => {
    if (chain.length === 0) return null;
    
    // Search backward for last placed card on this side
    for (let i = chain.length - 1; i >= 0; i--) {
      if (chain[i].side === side) {
        return side === 'left' ? chain[i].val1 : chain[i].val2;
      }
    }
    
    const center = chain.find(c => c.side === 'center') || chain[0];
    return side === 'left' ? center.val1 : center.val2;
  };

  const leftEnd = chain.length > 0 ? getEndValue('left') : null;
  const rightEnd = chain.length > 0 ? getEndValue('right') : null;

  // Handle player name edit trigger
  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditName(player.name);
  };

  const savePlayerName = (id: number) => {
    if (editName.trim()) {
      onUpdatePlayerName(id, editName.trim());
    }
    setEditingPlayerId(null);
  };

  return (
    <div 
      className="w-full lg:w-[380px] xl:w-[420px] bg-[#121212] text-gray-100 flex flex-col border-r border-[#222] shadow-2xl h-full overflow-y-auto"
      id="operator-panel"
    >
      {/* Panel Header */}
      <div className="p-4 bg-[#0d0d0d] border-b border-[#222] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <h1 className="text-xs font-bold uppercase tracking-widest text-[#4ade80]">Control Panel</h1>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
        <button
          onClick={onHidePanel}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#222] text-xs text-gray-400 border border-[#333] hover:border-[#4ade80] hover:text-white transition-all cursor-pointer"
          id="btn-hide-operator"
        >
          <EyeOff size={13} />
          <span>Sembunyikan</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-4 flex-1">
        
        {/* SECTION 1: MATCH MANAGEMENT */}
        <div className="space-y-3 bg-[#181818] p-3 rounded-lg border border-[#2c2c2c]">
          <h3 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Kontrol Pertandingan</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onUndo}
              disabled={chain.length === 0}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded bg-[#2a2a2a] text-gray-200 hover:bg-[#333] active:scale-98 transition-all border border-[#333] text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              id="btn-undo"
            >
              <RotateCcw size={13} className="text-[#4ade80]" />
              <span className="font-semibold">Undo</span>
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded bg-[#2a2a2a] text-red-400 hover:bg-[#333] active:scale-98 transition-all border border-[#333] text-xs cursor-pointer"
              id="btn-reset"
            >
              <Trash2 size={13} />
              <span className="font-semibold">Reset All</span>
            </button>
          </div>

          {/* Bypass Validation */}
          <label className="flex items-center space-x-3 p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] cursor-pointer hover:bg-[#252525] transition-colors">
            <input
              type="checkbox"
              checked={bypassValidation}
              onChange={(e) => {
                setBypassValidation(e.target.checked);
                setValidationError(null);
              }}
              className="w-4 h-4 rounded text-[#4ade80] bg-[#0d0d0d] border-[#333] focus:ring-[#4ade80] focus:ring-offset-0"
              id="cb-bypass"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-200">Abaikan Validasi</span>
              <span className="text-[10px] text-gray-500">Pasang kartu bebas tanpa dicocokkan</span>
            </div>
          </label>

          {/* Tournament Title Option */}
          <div className="space-y-1.5 pt-1.5 border-t border-[#2a2a2a]">
            <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">Judul Pertandingan</label>
            <input
              type="text"
              value={tournamentTitle}
              onChange={(e) => onUpdateTournamentTitle(e.target.value)}
              placeholder="CONTOH: DOMINO CHAMPIONSHIP 2026"
              className="bg-black border border-[#2d2d2d] focus:border-amber-400 text-white text-[11px] px-2.5 py-1.5 rounded w-full focus:outline-hidden"
              id="input-tournament-title"
              maxLength={50}
            />
          </div>
        </div>

        {/* SECTION 2: PLAYERS MANAGEMENT */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Pilih Pemain Aktif & Manajemen</h3>
          
          <div className="grid grid-cols-2 gap-2">
            {players.map((player) => {
              const isSelected = selectedPlayerId === player.id;
              const isEditing = editingPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className={`flex flex-col p-2.5 rounded border transition-all ${
                    isSelected
                      ? 'bg-[#1e1e1e] border-amber-400 ring-1 ring-amber-400/20'
                      : 'bg-[#1e1e1e] border-[#333] opacity-60 hover:opacity-90'
                  }`}
                  id={`operator-player-${player.id}`}
                >
                  <div className="flex items-center justify-between space-x-1.5 mb-1.5">
                    {/* Status Dot / Selector */}
                    <button
                      onClick={() => setSelectedPlayerId(player.id)}
                      className="flex items-center space-x-2 text-left min-w-0 flex-1 cursor-pointer"
                      id={`btn-select-player-${player.id}`}
                    >
                      <span className={`w-2 h-2 shrink-0 rounded-full ${isSelected ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`} />
                      {isEditing ? (
                        <div className="flex items-center space-x-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && savePlayerName(player.id)}
                            onBlur={() => savePlayerName(player.id)}
                            className="bg-black border border-amber-400 text-white text-[11px] px-1 py-0.5 rounded w-full focus:outline-hidden"
                            autoFocus
                            maxLength={16}
                            id={`input-edit-player-${player.id}`}
                          />
                        </div>
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(player);
                          }}
                          className="text-[11px] font-bold truncate text-gray-200 hover:text-amber-400 hover:underline"
                          title="Klik untuk edit"
                        >
                          P{player.id}: {player.name}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Manual Card Count Adjuster */}
                  <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-1.5 mt-0.5">
                    <span className="text-[9px] text-gray-500">Kartu:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onUpdatePlayerCards(player.id, false)}
                        className="p-1 rounded bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-white transition-colors cursor-pointer"
                        id={`btn-dec-card-${player.id}`}
                      >
                        <Minus size={9} />
                      </button>
                      <span className="w-5 text-center font-mono text-[11px] font-bold text-[#4ade80]" id={`card-count-${player.id}`}>
                        {player.cardsLeft}
                      </span>
                      <button
                        onClick={() => onUpdatePlayerCards(player.id, true)}
                        className="p-1 rounded bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-white transition-colors cursor-pointer"
                        id={`btn-inc-card-${player.id}`}
                      >
                        <Plus size={9} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: DOMINO SKOR & KELOMPOK SECTION */}
        <div className="space-y-3 bg-[#181818] p-3 rounded-lg border border-[#2c2c2c]">
          <h3 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Papan Skor & Kelompok</h3>
          
          <div className="space-y-2">
            {groups.map(group => {
              const isEditing = editingGroupId === group.id;
              return (
                <div key={group.id} className="flex items-center justify-between p-2 bg-[#121212] rounded border border-[#222]">
                  {isEditing ? (
                    <div className="flex items-center space-x-1 flex-1">
                      <input
                        type="text"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        onBlur={() => {
                          if (editGroupName.trim()) {
                            onUpdateGroupName(group.id, editGroupName.trim());
                          }
                          setEditingGroupId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editGroupName.trim()) {
                              onUpdateGroupName(group.id, editGroupName.trim());
                            }
                            setEditingGroupId(null);
                          }
                        }}
                        className="bg-black text-[11px] text-white px-1.5 py-0.5 rounded border border-[#4ade80] focus:outline-hidden w-full"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <span 
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setEditGroupName(group.name);
                        }}
                        className="text-[11px] font-bold text-gray-200 truncate cursor-pointer hover:text-[#4ade80] hover:underline"
                        title="Klik untuk ubah nama kelompok"
                      >
                        {group.name}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">
                        Anggota: {group.id === 1 ? 'P1 & P3' : 'P2 & P4'}
                      </span>
                    </div>
                  )}

                  {/* Score adjustment */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onUpdateGroupScore(group.id, false)}
                      className="p-1 rounded bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-white cursor-pointer"
                    >
                      <Minus size={9} />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-black text-[#4ade80]">
                      {group.score}
                    </span>
                    <button
                      onClick={() => onUpdateGroupScore(group.id, true)}
                      className="p-1 rounded bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-white cursor-pointer"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selesaikan Ronde */}
          <div className="border-t border-[#2a2a2a] pt-2 mt-2">
            <span className="text-[9px] font-bold text-[#888] uppercase tracking-wider block mb-1.5">Selesaikan Ronde</span>
            <div className="flex items-center space-x-1.5">
              <select 
                value={winnerGroupId}
                onChange={(e) => setWinnerGroupId(Number(e.target.value))}
                className="bg-[#121212] text-[11px] text-gray-200 border border-[#333] px-2 py-1 rounded flex-1 focus:outline-hidden focus:border-[#4ade80]"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="flex items-center bg-[#121212] border border-[#333] rounded px-1.5 py-1">
                <span className="text-[9px] text-gray-500 mr-1 font-mono">Pts:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={roundPoints}
                  onChange={(e) => setRoundPoints(Math.max(1, Number(e.target.value)))}
                  className="bg-transparent text-[11px] font-bold text-[#4ade80] w-6 text-center focus:outline-hidden font-mono"
                />
              </div>
              <button
                onClick={() => {
                  onNewRound(winnerGroupId, roundPoints);
                  setRoundPoints(1); // reset
                }}
                className="bg-[#4ade80]/10 hover:bg-[#4ade80]/20 text-[#4ade80] text-[11px] font-bold px-2 py-1.5 rounded border border-[#4ade80]/30 transition-all cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: DOMINO CARDS SELECTION GRID */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Pilih Kartu Domino (Sisa: {28 - chain.length})</h3>
          </div>
          
          <div 
            className="grid grid-cols-7 gap-[3px] bg-[#111111] p-1.5 rounded-lg border border-[#222222]"
            id="domino-selection-grid"
          >
            {ALL_DOMINOES.map(([v1, v2], index) => {
              const played = isTilePlayed(v1, v2);
              const isSelected = selectedTile && selectedTile[0] === v1 && selectedTile[1] === v2;

              return (
                <div key={index} className="flex justify-center">
                  <DominoTile
                    val1={v1}
                    val2={v2}
                    size="xs"
                    isVertical={true}
                    isActive={!!isSelected}
                    disabled={played && !bypassValidation}
                    onClick={() => {
                      if (played && !bypassValidation) return;
                      setSelectedTile([v1, v2]);
                      setValidationError(null);
                    }}
                    showSpindle={false}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: ACTIONS AND PLACEMENT */}
        <div className="space-y-3 bg-[#181818] p-3 rounded-lg border border-[#2c2c2c]">
          <h3 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Sisi & Pasang Kartu</h3>

          {/* Current Ends Display */}
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono mb-2">
            <div className="bg-[#101010] p-2 rounded-lg border border-[#222]">
              <span className="text-[#888] block text-[9px] uppercase tracking-wider font-bold">Ujung Kiri</span>
              <span className="text-[#4ade80] font-black text-sm block mt-0.5">
                {leftEnd !== null ? leftEnd : 'KOSONG'}
              </span>
            </div>
            <div className="bg-[#101010] p-2 rounded-lg border border-[#222]">
              <span className="text-[#888] block text-[9px] uppercase tracking-wider font-bold">Ujung Kanan</span>
              <span className="text-[#4ade80] font-black text-sm block mt-0.5">
                {rightEnd !== null ? rightEnd : 'KOSONG'}
              </span>
            </div>
          </div>

          {/* Sisi Kartu Select */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-[#888] uppercase tracking-wider block">Sisi Tumpukan (Arah)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedSide('left');
                  setValidationError(null);
                }}
                className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedSide === 'left'
                    ? 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                    : 'bg-[#222] text-gray-300 border-[#333] hover:border-gray-500'
                }`}
                id="btn-side-left"
              >
                <span>← Kiri</span>
              </button>
              <button
                onClick={() => {
                  setSelectedSide('right');
                  setValidationError(null);
                }}
                className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedSide === 'right'
                    ? 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                    : 'bg-[#222] text-gray-300 border-[#333] hover:border-gray-500'
                }`}
                id="btn-side-right"
              >
                <span>Kanan →</span>
              </button>
            </div>
          </div>

          {/* Posisi Kartu Select */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-[#888] uppercase tracking-wider block">Posisi Kartu</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedOrientation('vertical');
                }}
                className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedOrientation === 'vertical'
                    ? 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                    : 'bg-[#222] text-gray-300 border-[#333] hover:border-gray-500'
                }`}
                id="btn-orient-vertical"
              >
                <span>Berdiri (Vertikal)</span>
              </button>
              <button
                onClick={() => {
                  setSelectedOrientation('horizontal');
                }}
                className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedOrientation === 'horizontal'
                    ? 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                    : 'bg-[#222] text-gray-300 border-[#333] hover:border-gray-500'
                }`}
                id="btn-orient-horizontal"
              >
                <span>Tidur (Horizontal)</span>
              </button>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div 
              className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-300 rounded flex items-start space-x-2 text-xs animate-shake"
              id="validation-error-banner"
            >
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Selected Tile Preview */}
          <div className="flex items-center justify-between py-1.5 border-t border-b border-[#2d2d2d] my-1">
            <span className="text-xs text-gray-400 font-medium">Terpilih:</span>
            {selectedTile ? (
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#4ade80]">[{selectedTile[0]} | {selectedTile[1]}]</span>
                <DominoTile val1={selectedTile[0]} val2={selectedTile[1]} size="xs" showSpindle={false} disabled={false} />
              </div>
            ) : (
              <span className="text-xs text-gray-500 italic">Belum ada</span>
            )}
          </div>

          {/* Play Card and Pass Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onPass}
              className="flex-1 py-3 bg-[#2a2a2a] hover:bg-[#333] text-amber-400 border border-[#3c3c3c] hover:border-amber-400 rounded font-bold text-center flex items-center justify-center space-x-1 transition-all text-xs cursor-pointer"
              id="btn-pass-turn"
              title="Lewati giliran pemain saat ini"
            >
              <span>PAS</span>
            </button>
            <button
              onClick={onPlayCard}
              disabled={!selectedTile}
              className={`
                flex-[2] py-3 rounded font-black text-center flex items-center justify-center space-x-2 transition-all shadow-lg text-xs
                ${
                  selectedTile
                    ? 'bg-[#4ade80] text-black hover:bg-[#22c55e] active:scale-[0.99] cursor-pointer shadow-[#4ade80]/10'
                    : 'bg-[#222] text-[#555] cursor-not-allowed border border-[#333]'
                }
              `}
              id="btn-play-card"
            >
              <ArrowLeftRight size={12} />
              <span className="tracking-wider">TURUNKAN KARTU</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-3 bg-[#0a0a0a] border-t border-[#222] text-center shrink-0">
        <p className="text-[10px] text-[#444] font-mono tracking-wider">
          v1.0.5 - Pro Score System
        </p>
      </div>
    </div>
  );
};
