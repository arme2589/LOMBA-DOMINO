/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Player, PlacedDomino, Group } from '../types';
import { DominoTile } from './DominoTile';
import { 
  Maximize2, 
  Minimize2, 
  Eye, 
  Clock, 
  Trophy, 
  Tv,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface AudienceViewProps {
  players: Player[];
  chain: PlacedDomino[];
  lastPlayedPlayerId: number | null;
  onShowPanel: () => void;
  showOperatorPanel: boolean;
  onReset: () => void;
  groups: Group[];
  selectedPlayerId: number;
  selectedSide?: 'left' | 'right';
  tournamentTitle: string;
}

export const AudienceView: React.FC<AudienceViewProps> = ({
  players,
  chain,
  lastPlayedPlayerId,
  onShowPanel,
  showOperatorPanel,
  onReset,
  groups,
  selectedPlayerId,
  selectedSide = 'right',
  tournamentTitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState<number>(0.9);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Game Timer State
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Track match timer
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Reset timer if chain reset
  useEffect(() => {
    if (chain.length === 0) {
      setSecondsElapsed(0);
    }
  }, [chain]);

  // Format timer string
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find newest tile to highlight it
  const newestTile = chain.reduce((newest: PlacedDomino | null, curr: PlacedDomino) => {
    if (!newest) return curr;
    return curr.timestamp > newest.timestamp ? curr : newest;
  }, null as PlacedDomino | null);

  // Parse branches for the linear horizontal layout
  const centerTile = chain.find(t => t.side === 'center') || (chain.length > 0 ? chain[0] : null);
  const leftBranch = chain.filter(t => t.side === 'left');
  const rightBranch = chain.filter(t => t.side === 'right');

  // Calculate 2D coordinates for all tiles dynamically
  const gap = 4;
  const positions: Record<string, { x: number; y: number }> = {};
  
  let minX = -48;
  let maxX = 48;
  let minY = -24;
  let maxY = 24;

  if (centerTile) {
    positions[centerTile.id] = { x: 0, y: 0 };

    // Left branch calculation
    leftBranch.forEach((tile, index) => {
      const prevTile = index === 0 ? centerTile : leftBranch[index - 1];
      if (!prevTile) return;

      const prevPos = positions[prevTile.id];
      if (!prevPos) return;

      const prevX = prevPos.x;
      const prevY = prevPos.y;

      let prevOuterX = 0;
      let prevOuterY = 0;

      if (prevTile.side === 'center') {
        prevOuterX = prevX - 24;
        prevOuterY = prevY;
      } else {
        if (prevTile.orientation === 'horizontal') {
          prevOuterX = prevX - 24;
          prevOuterY = prevY;
        } else {
          prevOuterX = prevX;
          prevOuterY = prevY - 24;
        }
      }

      let x = 0;
      let y = 0;

      if (tile.orientation === 'horizontal') {
        x = prevOuterX - 72 - gap;
        y = prevOuterY;
      } else {
        if (prevTile.orientation === 'horizontal' || prevTile.side === 'center') {
          x = prevOuterX - 48 - gap;
          y = prevOuterY - 24;
        } else {
          x = prevOuterX;
          y = prevOuterY - 72 - gap;
        }
      }

      positions[tile.id] = { x, y };
    });

    // Right branch calculation
    rightBranch.forEach((tile, index) => {
      const prevTile = index === 0 ? centerTile : rightBranch[index - 1];
      if (!prevTile) return;

      const prevPos = positions[prevTile.id];
      if (!prevPos) return;

      const prevX = prevPos.x;
      const prevY = prevPos.y;

      let prevOuterX = 0;
      let prevOuterY = 0;

      if (prevTile.side === 'center') {
        prevOuterX = prevX + 24;
        prevOuterY = prevY;
      } else {
        if (prevTile.orientation === 'horizontal') {
          prevOuterX = prevX + 24;
          prevOuterY = prevY;
        } else {
          prevOuterX = prevX;
          prevOuterY = prevY + 24;
        }
      }

      let x = 0;
      let y = 0;

      if (tile.orientation === 'horizontal') {
        x = prevOuterX + 72 + gap;
        y = prevOuterY;
      } else {
        if (prevTile.orientation === 'horizontal' || prevTile.side === 'center') {
          x = prevOuterX + 48 + gap;
          y = prevOuterY + 24;
        } else {
          x = prevOuterX;
          y = prevOuterY + 72 + gap;
        }
      }

      positions[tile.id] = { x, y };
    });

    // Calculate bounding box of the layout
    chain.forEach((tile) => {
      const pos = positions[tile.id];
      if (pos) {
        const isV = tile.orientation === 'vertical';
        const halfW = isV ? 24 : 48;
        const halfH = isV ? 48 : 24;

        minX = Math.min(minX, pos.x - halfW);
        maxX = Math.max(maxX, pos.x + halfW);
        minY = Math.min(minY, pos.y - halfH);
        maxY = Math.max(maxY, pos.y + halfH);
      }
    });
  }

  const containerWidth = (maxX - minX) + 60;
  const containerHeight = (maxY - minY) + 60;

  // Monitor container width and calculate the best fit zoom scale
  useEffect(() => {
    if (!isAutoFit || !containerRef.current || chain.length === 0) {
      if (chain.length === 0) setZoom(0.9);
      return;
    }

    const handleResize = () => {
      const containerWidthVal = containerRef.current?.clientWidth || 800;
      const containerHeightVal = containerRef.current?.clientHeight || 600;
      
      const horizontalSpan = (maxX - minX) + 80;
      const verticalSpan = (maxY - minY) + 80;
      
      // Dynamic padding based on screen width to prevent overlap with floating player badges
      const isDesktop = containerWidthVal >= 1024;
      const usableWidth = isDesktop
        ? containerWidthVal - 520 // Subtract 260px from each side to clear Left and Right player cards
        : containerWidthVal - 120; // Subtract 60px from each side for smaller screens
        
      const usableHeight = isDesktop
        ? containerHeightVal - 280 // Subtract 140px from top and bottom to clear Top and Bottom player cards
        : containerHeightVal - 180; // smaller screens
      
      const widthScale = usableWidth / Math.max(300, horizontalSpan);
      const heightScale = usableHeight / Math.max(120, verticalSpan);
      
      const scale = Math.min(widthScale, heightScale);
      const finalScale = Math.max(0.1, Math.min(1.5, scale));
      setZoom(finalScale);
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [chain, isAutoFit, minX, maxX, minY, maxY]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Keep track of fullscreen state if user exits via ESC
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Player helper by seat ID (1: Top, 2: Left, 3: Bottom, 4: Right)
  const getPlayerBySeat = (seatId: number) => {
    return players.find(p => p.id === seatId);
  };

  const renderPlayerBadge = (seatId: number, positionClass: string) => {
    const player = getPlayerBySeat(seatId);
    if (!player) return null;

    const isActive = lastPlayedPlayerId === player.id;
    const isMyTurn = selectedPlayerId === player.id;
    const isHorizontal = seatId === 1 || seatId === 3;
    
    // Seat 1 = Top, Seat 2 = Left, Seat 3 = Bottom, Seat 4 = Right
    const borderClass = 
      seatId === 1 ? 'border-t-2' :
      seatId === 2 ? 'border-l-2' :
      seatId === 3 ? 'border-b-2' :
      'border-r-2'; // seatId === 4
      
    const roundedClass = 
      seatId === 1 ? 'rounded-b-xl' :
      seatId === 2 ? 'rounded-r-xl' :
      seatId === 3 ? 'rounded-t-xl' :
      'rounded-l-xl'; // seatId === 4

    return (
      <div 
        className={`
          absolute z-10 transition-all duration-300
          ${positionClass}
          ${isMyTurn ? 'scale-105' : ''}
        `}
        id={`audience-player-${seatId}`}
      >
        {/* Yellow wave ripple animation (riak kuning bergelombang) around the card */}
        {isMyTurn && (
          <div className={`absolute -inset-1 ${roundedClass} border-2 border-amber-400 animate-ping pointer-events-none opacity-50 z-0`} />
        )}
        <div 
          className={`
            relative z-10 p-3 transition-all duration-300 backdrop-blur-md shadow-2xl
            ${roundedClass} ${borderClass}
            ${isHorizontal ? 'w-60 sm:w-64' : 'w-44 sm:w-48'}
            ${
              isMyTurn
                ? 'bg-amber-950/85 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.65)] ring-2 ring-amber-400/30 animate-pulse-subtle'
                : isActive
                  ? 'bg-emerald-950/70 border-[#4ade80]/40 shadow-lg'
                  : 'bg-black/55 border-gray-600 shadow-md opacity-85'
            }
          `}
        >
          <div className="relative">
            {/* Active status pulsing glow icon */}
            {isMyTurn && (
              <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            )}

            {isHorizontal ? (
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className={`text-[9px] uppercase tracking-wider font-semibold ${isMyTurn ? 'text-amber-400' : 'text-gray-400'}`}>
                    Peserta {seatId} {isMyTurn && '• GILIRAN'}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white truncate max-w-[120px] sm:max-w-[150px]" id={`lbl-player-name-${seatId}`}>
                    {player.name}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider">KARTU</span>
                  <span className={`text-lg sm:text-xl font-black font-mono tracking-tight ${isMyTurn ? 'text-amber-400' : 'text-gray-200'}`} id={`lbl-card-count-${seatId}`}>
                    🂠 {String(player.cardsLeft).padStart(2, '0')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className={`text-[9px] uppercase tracking-wider font-semibold ${isMyTurn ? 'text-amber-400' : 'text-gray-400'}`}>
                  Peserta {seatId} {isMyTurn && '• GILIRAN'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white truncate mb-1" id={`lbl-player-name-${seatId}`}>
                  {player.name}
                </span>
                <div className="flex items-center justify-between border-t border-[#222] pt-1 mt-0.5">
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider">SISA</span>
                  <span className={`text-sm sm:text-base font-bold font-mono ${isMyTurn ? 'text-amber-400' : 'text-gray-200'}`} id={`lbl-card-count-${seatId}`}>
                    🂠 {String(player.cardsLeft).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="flex-1 bg-[radial-gradient(circle_at_center,_#0a3d1b_0%,_#072412_100%)] flex flex-col justify-between relative overflow-hidden select-none"
      id="audience-view"
    >
      {/* BACKGROUND TEXTURE FOR MEJA CASINO */}
      <div className="absolute inset-0 bg-repeat opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z'/%3E%3C/g%3E%3C/svg%3E")` }}
      />

      {/* TOP-LEFT HEADER HUD */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none max-w-md">
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#4ade80] font-bold mb-1 opacity-80 drop-shadow-xs break-all" id="lbl-tournament-title">
            {tournamentTitle || 'DOMINO CHAMPIONSHIP 2026'}
          </span>
          <div className="flex items-center space-x-4 px-4 py-1.5 bg-black/55 backdrop-blur-md rounded-lg border border-white/10 shadow-lg pointer-events-auto">
            <div className="flex items-center space-x-1">
              <span className="text-[8px] uppercase text-gray-400 tracking-wider font-mono">Langkah</span>
              <span className="text-sm font-bold font-mono text-[#4ade80]">
                {String(chain.length).padStart(3, '0')}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center space-x-1.5">
              <Clock size={11} className="text-[#4ade80]" />
              <span className="text-sm font-bold font-mono text-white" id="match-timer">
                {formatTime(secondsElapsed)}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center space-x-1">
              <span className="text-[8px] uppercase text-gray-400 tracking-wider font-mono font-black">Deck</span>
              <span className="text-sm font-bold font-mono text-[#4ade80]">
                {String(Math.max(0, 28 - chain.length - players.reduce((acc, p) => acc + p.cardsLeft, 0))).padStart(2, '0')}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center space-x-1" title="Arah Putaran Giliran: Berlawanan Jarum Jam">
              <span className="text-[8px] uppercase text-gray-400 tracking-wider font-mono">Arah</span>
              <span className="text-xs font-black font-mono text-amber-400 flex items-center">
                ↺ CCW
              </span>
            </div>
          </div>
        </div>

        {!showOperatorPanel && (
          <button
            onClick={onShowPanel}
            className="pointer-events-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/85 text-[#4ade80] hover:text-[#22c55e] font-semibold text-[10px] border border-[#4ade80]/30 transition-all shadow-md active:scale-95 cursor-pointer self-start"
            id="btn-show-operator"
          >
            <Eye size={12} />
            <span>Buka Panel Operator</span>
          </button>
        )}
      </div>

      {/* TOP-RIGHT CONTROLS GROUP */}
      <div className="absolute top-6 right-6 z-20 flex items-center space-x-2 pointer-events-auto">
        {/* Zoom controls */}
        <div className="flex items-center bg-black/50 rounded-lg border border-white/10 p-0.5 text-xs text-neutral-300">
          <button 
            onClick={() => { setIsAutoFit(false); setZoom(prev => Math.max(0.3, prev - 0.1)); }}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Perkecil Domino"
            id="btn-zoom-out"
          >
            <ZoomOut size={13} />
          </button>
          <button 
            onClick={() => { setIsAutoFit(true); }}
            className={`px-2 py-1 rounded font-mono text-[10px] transition-all cursor-pointer ${
              isAutoFit ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30 font-bold' : 'hover:bg-neutral-800 text-gray-300'
            }`}
            title="Pas otomatis ke layar"
            id="btn-zoom-auto"
          >
            Auto Fit: {isAutoFit ? 'ON' : `${Math.round(zoom * 100)}%`}
          </button>
          <button 
            onClick={() => { setIsAutoFit(false); setZoom(prev => Math.min(1.5, prev + 0.1)); }}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Perbesar Domino"
            id="btn-zoom-in"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center p-2 rounded-lg bg-black/50 text-[#4ade80] border border-white/10 hover:bg-neutral-850 transition-colors shadow-md cursor-pointer"
          title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen Layar"}
          id="btn-toggle-fs"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* FLOATING GROUP SCOREBOARD */}
      <div className="absolute top-20 right-6 bg-black/75 backdrop-blur-md rounded-xl border border-white/10 p-2.5 shadow-2xl z-20 w-44 sm:w-48 pointer-events-auto">
        <span className="text-[8px] uppercase tracking-widest text-[#4ade80] font-black block mb-1.5 text-center flex items-center justify-center space-x-1">
          <Trophy size={10} />
          <span>Papan Skor Kelompok</span>
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-center">
          {groups.map(g => (
            <div key={g.id} className="bg-neutral-900/60 p-1.5 rounded border border-white/5 flex flex-col justify-between">
              <span className="text-[9px] text-gray-400 font-bold truncate block" title={g.name}>{g.name}</span>
              <span className="text-lg font-black font-mono text-white mt-0.5">{g.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PLAYER POSITIONS IN A TABLE LAYOUT - CCW TURN SEQUENCE */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Player 1 (Top Center) */}
        {renderPlayerBadge(1, "top-20 left-1/2 -translate-x-1/2")}

        {/* Player 2 (Left Center) */}
        {renderPlayerBadge(2, "left-6 sm:left-8 top-1/2 -translate-y-1/2")}

        {/* Player 3 (Bottom Center - Elevated to prevent blocking by stats HUD) */}
        {renderPlayerBadge(3, "bottom-20 left-1/2 -translate-x-1/2")}

        {/* Player 4 (Right Center) */}
        {renderPlayerBadge(4, "right-6 sm:right-8 top-1/2 -translate-y-1/2")}
      </div>

      {/* CENTER DOMINO TRAIN AREA - LINEAR HORIZONTAL FLOW */}
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center p-8 mt-16 mb-16 relative"
        id="domino-train-container"
      >
        {chain.length > 0 ? (
          <div 
            ref={scrollContainerRef}
            className={`w-full max-w-full p-12 flex items-center justify-center custom-scrollbar ${isAutoFit ? 'overflow-hidden' : 'overflow-auto'}`}
            id="domino-train-scrollable"
          >
            <div 
              className="relative flex items-center justify-center overflow-visible"
              style={{ 
                width: `${containerWidth * zoom}px`,
                height: `${containerHeight * zoom}px`,
              }}
            >
              <div 
                className="absolute origin-center transition-transform duration-300"
                style={{ 
                  transform: `scale(${zoom})`,
                  width: `${containerWidth}px`,
                  height: `${containerHeight}px`,
                  left: '50%',
                  top: '50%',
                  marginLeft: `-${containerWidth / 2}px`,
                  marginTop: `-${containerHeight / 2}px`,
                }}
                id="domino-linear-layout"
              >
                {chain.map((tile) => {
                  const pos = positions[tile.id];
                  if (!pos) return null;

                  const isNewest = newestTile?.id === tile.id;
                  const isVerticalLayout = tile.orientation === 'vertical';
                  const isLeftEnd = leftBranch.length > 0 && leftBranch[leftBranch.length - 1].id === tile.id;
                  const isRightEnd = rightBranch.length > 0 && rightBranch[rightBranch.length - 1].id === tile.id;
                  const isCenter = tile.side === 'center';

                  // Determine which end card gets highlighted by the selected side (yellow wave animation)
                  const isHighlightedSide = selectedSide === 'left'
                    ? (isLeftEnd || (isCenter && leftBranch.length === 0))
                    : (isRightEnd || (isCenter && rightBranch.length === 0));

                  // absolute offsets inside the bounding box plus 30px margin
                  const leftOffset = pos.x - minX - (isVerticalLayout ? 24 : 48) + 30;
                  const topOffset = pos.y - minY - (isVerticalLayout ? 48 : 24) + 30;

                  // Animation class for the newest tile based on its side
                  let animationClass = "";
                  if (isNewest) {
                    if (tile.side === 'left') {
                      animationClass = "animate-slide-from-left";
                    } else if (tile.side === 'right') {
                      animationClass = "animate-slide-from-right";
                    } else {
                      animationClass = "animate-domino-drop";
                    }
                  }

                  return (
                    <div 
                      key={tile.id} 
                      className="absolute flex items-center justify-center transition-all duration-300"
                      style={{
                        left: `${leftOffset}px`,
                        top: `${topOffset}px`,
                        width: isVerticalLayout ? '48px' : '96px',
                        height: isVerticalLayout ? '96px' : '48px',
                      }}
                    >
                      <div className={`w-full h-full relative flex items-center justify-center ${animationClass}`}>
                        <DominoTile
                          val1={tile.val1}
                          val2={tile.val2}
                          isVertical={isVerticalLayout}
                          size="md"
                        />
                        {isHighlightedSide && (
                          <div className="absolute -inset-1 rounded-lg border-2 border-[#4ade80]/80 shadow-[0_0_15px_rgba(74,222,128,0.7)] pointer-events-none z-10 bg-[#4ade80]/5" />
                        )}
                      </div>
                      
                      {/* Removed Left & Right text labels per user request */}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md bg-neutral-950/40 backdrop-blur-xs p-8 rounded-3xl border border-emerald-500/10 shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
              <Tv size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-neutral-100 font-bold text-lg tracking-wide">Meja Pertandingan Kosong</h2>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Menunggu operator menurunkan kartu domino pertama untuk memulai preview pertandingan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* COMPACT BOTTOM RIGHT STATUS HUD (Extremely compact and positioned beautifully, no blocking Peserta 3!) */}
      <div 
        className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/80 border border-emerald-500/20 backdrop-blur-md flex items-center space-x-3 z-20 shadow-xl text-[10px] text-gray-300 font-mono pointer-events-auto"
        id="stats-panel-compact"
      >
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-gray-400">Total:</span>
          <span className="font-bold text-[#4ade80]">{chain.length}/28</span>
        </div>
        <div className="w-px h-3 bg-neutral-800" />
        <div>
          <span className="text-gray-400">Terakhir:</span>{' '}
          <span className="font-bold text-white">
            {lastPlayedPlayerId ? players.find(p => p.id === lastPlayedPlayerId)?.name : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
