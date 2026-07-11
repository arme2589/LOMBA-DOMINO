/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Player, PlacedDomino, MatchHistoryEntry, Group } from './types';
import { OperatorPanel } from './components/OperatorPanel';
import { AudienceView } from './components/AudienceView';
import { AlertTriangle } from 'lucide-react';

const DEFAULT_PLAYERS: Player[] = [
  { id: 1, name: 'Peserta 1', cardsLeft: 7 },
  { id: 2, name: 'Peserta 2', cardsLeft: 7 },
  { id: 3, name: 'Peserta 3', cardsLeft: 7 },
  { id: 4, name: 'Peserta 4', cardsLeft: 7 },
];

const DEFAULT_GROUPS: Group[] = [
  { id: 1, name: 'Kelompok 1', score: 0, playerIds: [1, 3] },
  { id: 2, name: 'Kelompok 2', score: 0, playerIds: [2, 4] },
];

export default function App() {
  // Game state
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [chain, setChain] = useState<PlacedDomino[]>([]);
  const [lastPlayedPlayerId, setLastPlayedPlayerId] = useState<number | null>(null);
  const [groups, setGroups] = useState<Group[]>(DEFAULT_GROUPS);
  
  // History stack for Undo
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);

  // Selection states
  const [bypassValidation, setBypassValidation] = useState<boolean>(false);
  const [selectedTile, setSelectedTile] = useState<[number, number] | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(1);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>('right');
  const [selectedOrientation, setSelectedOrientation] = useState<'vertical' | 'horizontal'>('horizontal');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Layout state
  const [showOperatorPanel, setShowOperatorPanel] = useState<boolean>(true);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [tournamentTitle, setTournamentTitle] = useState<string>('DOMINO CHAMPIONSHIP 2026');

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const storedPlayers = localStorage.getItem('domino_players');
      const storedChain = localStorage.getItem('domino_chain');
      const storedLastPlayer = localStorage.getItem('domino_last_player');
      const storedBypass = localStorage.getItem('domino_bypass');
      const storedHistory = localStorage.getItem('domino_history');
      const storedGroups = localStorage.getItem('domino_groups');
      const storedTitle = localStorage.getItem('domino_title');

      if (storedPlayers) setPlayers(JSON.parse(storedPlayers));
      if (storedChain) setChain(JSON.parse(storedChain));
      if (storedLastPlayer) setLastPlayedPlayerId(JSON.parse(storedLastPlayer));
      if (storedBypass) setBypassValidation(JSON.parse(storedBypass));
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      if (storedGroups) setGroups(JSON.parse(storedGroups));
      if (storedTitle) setTournamentTitle(storedTitle);
    } catch (e) {
      console.error("Gagal memuat data pertandingan dari LocalStorage:", e);
    }
  }, []);

  // Save state to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('domino_players', JSON.stringify(players));
    localStorage.setItem('domino_chain', JSON.stringify(chain));
    localStorage.setItem('domino_last_player', JSON.stringify(lastPlayedPlayerId));
    localStorage.setItem('domino_bypass', JSON.stringify(bypassValidation));
    localStorage.setItem('domino_history', JSON.stringify(history));
    localStorage.setItem('domino_groups', JSON.stringify(groups));
    localStorage.setItem('domino_title', tournamentTitle);
  }, [players, chain, lastPlayedPlayerId, bypassValidation, history, groups, tournamentTitle]);

  // Player name updates
  const handleUpdatePlayerName = (id: number, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  // Player manual cards adjustment
  const handleUpdatePlayerCards = (id: number, increment: boolean) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const count = increment ? p.cardsLeft + 1 : Math.max(0, p.cardsLeft - 1);
          return { ...p, cardsLeft: count };
        }
        return p;
      })
    );
  };

  const getEndValue = (side: 'left' | 'right'): number | null => {
    if (chain.length === 0) return null;
    
    // Find last card placed on this specific side
    for (let i = chain.length - 1; i >= 0; i--) {
      if (chain[i].side === side) {
        return side === 'left' ? chain[i].val1 : chain[i].val2;
      }
    }
    
    // If none, use the center card (index 0)
    const center = chain.find(c => c.side === 'center') || chain[0];
    return side === 'left' ? center.val1 : center.val2;
  };

  // Play domino tile trigger
  const handlePlayCard = () => {
    if (!selectedTile) return;

    const [A, B] = selectedTile;
    let val1 = A;
    let val2 = B;
    let isValid = true;

    if (chain.length > 0) {
      const endVal = getEndValue(selectedSide);
      if (endVal !== null) {
        if (selectedSide === 'left') {
          if (B === endVal) {
            val1 = A;
            val2 = B;
          } else if (A === endVal) {
            val1 = B;
            val2 = A;
          } else {
            isValid = false;
          }
        } else {
          // selectedSide === 'right'
          if (A === endVal) {
            val1 = A;
            val2 = B;
          } else if (B === endVal) {
            val1 = B;
            val2 = A;
          } else {
            isValid = false;
          }
        }
      }
    }

    // Validation check
    if (!isValid && !bypassValidation) {
      const endVal = getEndValue(selectedSide);
      setValidationError(`Kartu tidak sesuai. Angka ujung kartu harus cocok dengan ujung tumpukan (${endVal}).`);
      return;
    }

    // Save current state to Undo history before playing
    const historyEntry: MatchHistoryEntry = {
      chain: [...chain],
      players: players.map(p => ({ ...p })),
      lastPlayedPlayerId,
      moveCount: chain.length,
      groups: groups.map(g => ({ ...g }))
    };
    setHistory(prev => [...prev, historyEntry]);

    const isFirstCard = chain.length === 0;
    const finalSide = isFirstCard ? 'center' : selectedSide;

    // Create the new placed card
    const newPlaced: PlacedDomino = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      val1,
      val2,
      isDouble: A === B,
      playerWhoPlayed: selectedPlayerId,
      side: finalSide,
      orientation: isFirstCard ? 'horizontal' : selectedOrientation,
      timestamp: Date.now(),
      rawVal1: A,
      rawVal2: B
    };

    // Update chain
    const newChain = [...chain, newPlaced];
    
    // Auto decrease player cards count
    const newPlayers = players.map(p => {
      if (p.id === selectedPlayerId) {
        return { ...p, cardsLeft: Math.max(0, p.cardsLeft - 1) };
      }
      return p;
    });

    setChain(newChain);
    setPlayers(newPlayers);
    setLastPlayedPlayerId(selectedPlayerId);
    
    // Clear selections and validation errors
    setSelectedTile(null);
    setValidationError(null);

    // Auto cycle turn to the next player
    const nextPlayerId = selectedPlayerId === 4 ? 1 : selectedPlayerId + 1;
    setSelectedPlayerId(nextPlayerId);
  };

  // Skip / Pass current player turn
  const handlePass = () => {
    // Save current state to Undo history
    const historyEntry: MatchHistoryEntry = {
      chain: [...chain],
      players: players.map(p => ({ ...p })),
      lastPlayedPlayerId,
      moveCount: chain.length,
      groups: groups.map(g => ({ ...g }))
    };
    setHistory(prev => [...prev, historyEntry]);

    // Auto cycle turn to the next player
    const nextPlayerId = selectedPlayerId === 4 ? 1 : selectedPlayerId + 1;
    setSelectedPlayerId(nextPlayerId);
    setValidationError(null);
  };

  // Complete round and declare a winner
  const handleNewRound = (winningGroupId: number, points: number) => {
    const historyEntry: MatchHistoryEntry = {
      chain: [...chain],
      players: players.map(p => ({ ...p })),
      lastPlayedPlayerId,
      moveCount: chain.length,
      groups: groups.map(g => ({ ...g }))
    };
    setHistory(prev => [...prev, historyEntry]);

    setGroups(prev => prev.map(g => g.id === winningGroupId ? { ...g, score: g.score + points } : g));

    // Reset dominoes on the table, reset card counts to 7
    setChain([]);
    setPlayers(DEFAULT_PLAYERS.map(p => ({ ...p, cardsLeft: 7 })));
    setLastPlayedPlayerId(null);
    setSelectedTile(null);
    setValidationError(null);
    setSelectedPlayerId(1);
  };

  const handleUpdateGroupName = (id: number, name: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  };

  const handleUpdateGroupScore = (id: number, increment: boolean) => {
    setGroups(prev => prev.map(g => {
      if (g.id === id) {
        const score = increment ? g.score + 1 : Math.max(0, g.score - 1);
        return { ...g, score };
      }
      return g;
    }));
  };

  // Undo last step
  const handleUndo = () => {
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    
    setChain(previousState.chain);
    setPlayers(previousState.players);
    setLastPlayedPlayerId(previousState.lastPlayedPlayerId);
    if (previousState.groups) {
      setGroups(previousState.groups);
    }
    
    // Remove last entry from history stack
    setHistory(prev => prev.slice(0, prev.length - 1));
    setValidationError(null);
  };

  // Reset complete match
  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const performReset = () => {
    setChain([]);
    setPlayers((prev) => prev.map(p => ({ ...p, cardsLeft: 7 })));
    setLastPlayedPlayerId(null);
    setHistory([]);
    setSelectedTile(null);
    setValidationError(null);
    setSelectedPlayerId(1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 font-sans" id="app-root">
      {/* 1. OPERATOR CONTROL PANEL */}
      {showOperatorPanel && (
        <OperatorPanel
          players={players}
          chain={chain}
          bypassValidation={bypassValidation}
          selectedTile={selectedTile}
          selectedPlayerId={selectedPlayerId}
          selectedSide={selectedSide}
          selectedOrientation={selectedOrientation}
          setBypassValidation={setBypassValidation}
          setSelectedTile={setSelectedTile}
          setSelectedPlayerId={setSelectedPlayerId}
          setSelectedSide={setSelectedSide}
          setSelectedOrientation={setSelectedOrientation}
          onPlayCard={handlePlayCard}
          onUndo={handleUndo}
          onReset={handleReset}
          onUpdatePlayerName={handleUpdatePlayerName}
          onUpdatePlayerCards={handleUpdatePlayerCards}
          onHidePanel={() => setShowOperatorPanel(false)}
          validationError={validationError}
          setValidationError={setValidationError}
          
          tournamentTitle={tournamentTitle}
          onUpdateTournamentTitle={setTournamentTitle}
          
          groups={groups}
          onUpdateGroupName={handleUpdateGroupName}
          onUpdateGroupScore={handleUpdateGroupScore}
          onPass={handlePass}
          onNewRound={handleNewRound}
        />
      )}

      {/* 2. AUDIENCE LAYOUT VIEW */}
      <AudienceView
        players={players}
        chain={chain}
        lastPlayedPlayerId={lastPlayedPlayerId}
        onShowPanel={() => setShowOperatorPanel(true)}
        showOperatorPanel={showOperatorPanel}
        onReset={handleReset}
        groups={groups}
        selectedPlayerId={selectedPlayerId}
        selectedSide={selectedSide}
        tournamentTitle={tournamentTitle}
      />

      {/* CUSTOM CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[100] animate-fade-in pointer-events-auto">
          <div className="bg-[#121212] border border-red-500/30 p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-bold text-base">Atur Ulang Pertandingan?</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Tindakan ini akan mengosongkan meja dari kartu dan mengembalikan jumlah kartu setiap peserta menjadi 7. Nama peserta, nama kelompok, dan papan skor tidak akan diubah.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded bg-[#2a2a2a] text-gray-300 hover:bg-[#333] transition-colors text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  performReset();
                }}
                className="flex-1 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-semibold shadow-lg shadow-red-600/20 cursor-pointer"
              >
                Ya, Atur Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
