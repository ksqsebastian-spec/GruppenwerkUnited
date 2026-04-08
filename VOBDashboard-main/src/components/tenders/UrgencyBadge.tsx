import { Badge } from '@/components/ui/badge'
import { getUrgencyBgClass, getUrgencyLabel } from '@/lib/utils'
import type { Urgency } from '@/lib/types'

interface UrgencyBadgeProps {
  urgency: Urgency
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  return (
    <Badge variant="outline" className={getUrgencyBgClass(urgency)}>
      {getUrgencyLabel(urgency)}
    </Badge>
  )
}
