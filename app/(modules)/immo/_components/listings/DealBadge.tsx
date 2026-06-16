import { Badge } from '@/components/ui/badge'
import { getDealBgClass, type DealTier } from '@/lib/modules/immo/utils'

interface DealBadgeProps {
  tier: DealTier
}

const LABELS: Record<DealTier, string> = {
  strong: 'Top-Deal',
  deal: 'Deal',
  neutral: 'Kein Deal',
}

export function DealBadge({ tier }: DealBadgeProps) {
  return (
    <Badge variant="outline" className={getDealBgClass(tier)}>
      {LABELS[tier]}
    </Badge>
  )
}
