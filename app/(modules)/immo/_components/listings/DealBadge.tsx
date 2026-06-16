import { Badge } from '@/components/ui/badge'
import { getDealBgClass } from '@/lib/modules/immo/utils'

interface DealBadgeProps {
  good: boolean
}

export function DealBadge({ good }: DealBadgeProps) {
  return (
    <Badge variant="outline" className={getDealBgClass(good)}>
      {good ? 'Günstig' : 'Marktüblich'}
    </Badge>
  )
}
