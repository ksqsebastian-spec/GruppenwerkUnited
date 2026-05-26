export const CATEGORY_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#10B981',
  '#EF4444',
  '#06B6D4',
  '#A855F7',
  '#84CC16',
  '#F59E0B',
] as const;

export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
