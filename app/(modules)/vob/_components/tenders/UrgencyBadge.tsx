import { Badge } from '@/components/ui/badge'
import { getUrgencyBgClass, getUrgencyLabel } from '@/lib/modules/vob/utils'
import type { Urgency } from '@/lib/modules/vob/types'

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
