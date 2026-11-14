/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const NASAQ_LOGO_SRC = '/assets/aistudio/_________________c57453a0.png';

interface NasaqLogoProps {
  variant?: 'icon' | 'horizontal' | 'full';
  className?: string;
  alt?: string;
}

/**
 * Displays the official NASAQ (نَسَق) platform logo using the local brand asset.
 * Supports cropped `icon` (top rounded-square emblem), `horizontal` (bottom lockup),
 * and `full` (complete brand sheet) variants.
 */
export const NasaqLogo: React.FC<NasaqLogoProps> = ({
  variant = 'icon',
  className = '',
  alt = 'شعار منصة نَسَق NASAQ للتأهيل والتربية الخاصة',
}) => {
  if (variant === 'full') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-white select-none ${className}`}
      >
        <img
          src={NASAQ_LOGO_SRC}
          alt={alt}
          className="w-full h-full object-contain mix-blend-multiply"
        />
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div
        className={`relative aspect-[3.1/1] overflow-hidden select-none ${className}`}
      >
        <img
          src={NASAQ_LOGO_SRC}
          alt={alt}
          className="absolute left-1/2 top-1/2 w-[158%] h-auto aspect-square max-w-none mix-blend-multiply pointer-events-none"
          style={{ transform: 'translate(-50%, -78.2%)' }}
        />
      </div>
    );
  }

  // Default: 'icon' variant (top rounded-square hexagonal emblem)
  return (
    <div
      className={`relative aspect-square overflow-hidden select-none ${className}`}
    >
      <img
        src={NASAQ_LOGO_SRC}
        alt={alt}
        className="absolute left-1/2 top-1/2 w-[205%] h-[205%] max-w-none mix-blend-multiply pointer-events-none"
        style={{ transform: 'translate(-50%, -35.2%)' }}
      />
    </div>
  );
};
