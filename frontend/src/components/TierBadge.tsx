import { Tier } from '../backend';

// All 22 tiers in order
export const TIERS = [
  'Dirt 1', 'Dirt 2', 'Dirt 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Emerald 1', 'Emerald 2', 'Emerald 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Anti-matter',
];

export type TierGroup = 'dirt' | 'bronze' | 'silver' | 'platinum' | 'gold' | 'emerald' | 'diamond' | 'antimatter';

export function getTierGroup(tierName: string): TierGroup {
  const lower = tierName.toLowerCase();
  if (lower.startsWith('dirt')) return 'dirt';
  if (lower.startsWith('bronze')) return 'bronze';
  if (lower.startsWith('silver')) return 'silver';
  if (lower.startsWith('platinum')) return 'platinum';
  if (lower.startsWith('gold')) return 'gold';
  if (lower.startsWith('emerald')) return 'emerald';
  if (lower.startsWith('diamond')) return 'diamond';
  return 'antimatter';
}

interface TierStyle {
  bg: string;
  border: string;
  text: string;
  glow: string;
  icon: string;
  label: string;
}

export function getTierStyle(tierName: string): TierStyle {
  const group = getTierGroup(tierName);
  switch (group) {
    case 'dirt':
      return {
        bg: 'bg-[#3d2b1f]',
        border: 'border-[#6b4c38]',
        text: 'text-[#c4956a]',
        glow: '',
        icon: '🪨',
        label: 'Dirt',
      };
    case 'bronze':
      return {
        bg: 'bg-[#3d2a1a]',
        border: 'border-[#cd7f32]',
        text: 'text-[#cd7f32]',
        glow: 'shadow-[0_0_8px_rgba(205,127,50,0.4)]',
        icon: '🥉',
        label: 'Bronze',
      };
    case 'silver':
      return {
        bg: 'bg-[#252535]',
        border: 'border-[#a8a9ad]',
        text: 'text-[#c0c0c0]',
        glow: 'shadow-[0_0_10px_rgba(192,192,192,0.35)]',
        icon: '🥈',
        label: 'Silver',
      };
    case 'platinum':
      return {
        bg: 'bg-[#1a2535]',
        border: 'border-[#7ec8e3]',
        text: 'text-[#7ec8e3]',
        glow: 'shadow-[0_0_12px_rgba(126,200,227,0.45)]',
        icon: '💠',
        label: 'Platinum',
      };
    case 'gold':
      return {
        bg: 'bg-[#2d2200]',
        border: 'border-[#ffd700]',
        text: 'text-[#ffd700]',
        glow: 'shadow-[0_0_16px_rgba(255,215,0,0.55)]',
        icon: '🥇',
        label: 'Gold',
      };
    case 'emerald':
      return {
        bg: 'bg-[#0d2b1a]',
        border: 'border-[#50c878]',
        text: 'text-[#50c878]',
        glow: 'shadow-[0_0_18px_rgba(80,200,120,0.6)]',
        icon: '💚',
        label: 'Emerald',
      };
    case 'diamond':
      return {
        bg: 'bg-[#0d1a2b]',
        border: 'border-[#b9f2ff]',
        text: 'text-[#b9f2ff]',
        glow: 'shadow-[0_0_22px_rgba(185,242,255,0.65)]',
        icon: '💎',
        label: 'Diamond',
      };
    case 'antimatter':
      return {
        bg: 'bg-[#1a0d2b]',
        border: 'border-[#bf5fff]',
        text: 'text-[#bf5fff]',
        glow: 'shadow-[0_0_28px_rgba(191,95,255,0.75)]',
        icon: '⚡',
        label: 'Anti-matter',
      };
  }
}

interface TierBadgeProps {
  tier: Tier | { name: string; index: bigint | number };
  variant?: 'compact' | 'full';
  className?: string;
}

export default function TierBadge({ tier, variant = 'full', className = '' }: TierBadgeProps) {
  const style = getTierStyle(tier.name);
  const index = typeof tier.index === 'bigint' ? Number(tier.index) : tier.index;

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${style.bg} ${style.border} ${style.text} ${style.glow} ${className}`}
      >
        <span>{style.icon}</span>
        <span>{tier.name}</span>
      </span>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 py-5 rounded-2xl border-2 ${style.bg} ${style.border} ${style.glow} ${className}`}
    >
      <span className="text-4xl">{style.icon}</span>
      <div className="text-center">
        <p className={`text-xl font-black tracking-tight ${style.text}`}>{tier.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Tier {index + 1} of {TIERS.length}</p>
      </div>
    </div>
  );
}
