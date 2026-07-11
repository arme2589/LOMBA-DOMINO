/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface DominoTileProps {
  val1: number;
  val2: number;
  isVertical?: boolean;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  showSpindle?: boolean;
}

// 3x3 grid layout mapping for values 0-6
// Cells are 0-indexed:
// 0 1 2
// 3 4 5
// 6 7 8
const getPipIndices = (val: number, isVerticalHalf: boolean): number[] => {
  switch (val) {
    case 0:
      return [];
    case 1:
      return [4]; // Center
    case 2:
      return [0, 8]; // Diagonal top-left to bottom-right
    case 3:
      return [0, 4, 8]; // Diagonal + Center
    case 4:
      return [0, 2, 6, 8]; // 4 corners
    case 5:
      return [0, 2, 4, 6, 8]; // 4 corners + Center
    case 6:
      // If the half is vertical, 6 is oriented as horizontal rows (top row, bottom row)
      // If the half is horizontal, 6 is oriented as vertical columns (left col, right col)
      return isVerticalHalf
        ? [0, 1, 2, 6, 7, 8] // Horizontal rows (top and bottom)
        : [0, 3, 6, 2, 5, 8]; // Vertical columns (left and right)
    default:
      return [];
  }
};

export const DominoTile: React.FC<DominoTileProps> = ({
  val1,
  val2,
  isVertical = false,
  size = 'md',
  isActive = false,
  onClick,
  disabled = false,
  className = '',
  showSpindle = true,
}) => {
  // Dimensions based on size preset
  const dimensions = {
    xxs: isVertical ? 'w-5 h-10' : 'w-10 h-5',
    xs: isVertical ? 'w-6 h-12' : 'w-12 h-6',
    sm: isVertical ? 'w-10 h-20' : 'w-20 h-10',
    md: isVertical ? 'w-12 h-24' : 'w-24 h-12',
    lg: isVertical ? 'w-16 h-32' : 'w-32 h-16',
  };

  const pipSize = {
    xxs: 'w-0.5 h-0.5',
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const halfSize = isVertical ? 'w-full h-1/2' : 'w-1/2 h-full';
  const halfPadding = size === 'xxs' ? 'p-0.5 gap-0' : size === 'xs' ? 'p-0.5 gap-0' : 'p-1.5 gap-0.5';

  const renderHalf = (val: number, halfIndex: number) => {
    // A half is vertical if the entire tile is horizontal (so the divider is vertical, making each half stand vertically relative to the divider)
    // Actually, let's look at the half itself:
    // In a horizontal tile (w-24 h-12), each half is a square of 12x12 (or w-1/2 h-full, which is 12x12).
    // In a vertical tile (w-12 h-24), each half is a square of 12x12 (w-full h-1/2, which is 12x12).
    // So the half is always a square!
    // But for pip orientation of 6:
    // If the tile is vertical, we arrange the 6 pips in horizontal rows (top and bottom) so they run parallel to the horizontal divider.
    // If the tile is horizontal, we arrange the 6 pips in vertical columns (left and right) so they run parallel to the vertical divider.
    const pips = getPipIndices(val, isVertical);

    return (
      <div
        className={`${halfSize} relative grid grid-cols-3 grid-rows-3 ${halfPadding} justify-items-center items-center`}
      >
        {Array.from({ length: 9 }).map((_, index) => {
          const hasPip = pips.includes(index);
          return (
            <div key={index} className="w-full h-full flex items-center justify-center">
              {hasPip && (
                <div
                  className={`${pipSize[size]} rounded-full bg-neutral-900 shadow-inner`}
                  style={{
                    boxShadow: (size === 'xs' || size === 'xxs') ? 'none' : 'inset 0.5px 1px 1px rgba(0, 0, 0, 0.8), 0.5px 0.5px 0.5px rgba(255, 255, 255, 0.4)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        ${dimensions[size]}
        relative flex select-none transition-all duration-300
        ${size === 'xxs' ? 'rounded-xs border-[1px]' : size === 'xs' ? 'rounded-sm border-[1.5px]' : 'rounded-lg border-2'}
        ${isVertical ? 'flex-col' : 'flex-row'}
        ${
          disabled
            ? 'bg-neutral-200 border-neutral-300 opacity-40 cursor-not-allowed'
            : isActive
              ? 'bg-amber-50 border-[#4ade80] shadow-lg scale-102 ring-2 ring-[#4ade80] ring-offset-2 ring-offset-[#0a0a0a] cursor-pointer'
              : 'bg-gradient-to-br from-neutral-50 via-neutral-100 to-stone-200 border-neutral-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
        }
        ${className}
      `}
      id={`domino-${val1}-${val2}-${isVertical ? 'v' : 'h'}`}
    >
      {/* First half */}
      {renderHalf(val1, 1)}

      {/* Center Divider Line */}
      <div
        className={`
          absolute bg-neutral-800/80
          ${isVertical ? 'left-0.5 right-0.5 h-[1px] top-1/2 -translate-y-1/2' : 'top-0.5 bottom-0.5 w-[1px] left-1/2 -translate-x-1/2'}
        `}
      />

      {/* Brass Spindle (Pivot Pin) */}
      {showSpindle && !disabled && size !== 'xxs' && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-gradient-to-tr from-yellow-700 via-amber-400 to-yellow-500 border border-amber-900/40 shadow-xs"
          style={{ boxShadow: '0.5px 0.5px 1px rgba(0,0,0,0.5)' }}
        />
      )}

      {/* Second half */}
      {renderHalf(val2, 2)}
    </div>
  );
};
