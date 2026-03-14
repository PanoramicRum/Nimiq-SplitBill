export const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-orange-500 to-orange-700',
  'from-purple-500 to-purple-700',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
  'from-indigo-500 to-indigo-700',
  'from-red-500 to-red-700',
  'from-teal-500 to-teal-700',
] as const;

export function getAvatarGradient(colorIndex: number): string {
  return AVATAR_GRADIENTS[colorIndex % AVATAR_GRADIENTS.length];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}
