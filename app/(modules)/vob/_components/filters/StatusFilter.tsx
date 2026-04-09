'use client'

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps): React.JSX.Element {
  const options = [
    { value: 'all', label: 'Alle' },
    { value: 'active', label: 'Aktiv' },
    { value: 'expired', label: 'Abgelaufen' },
  ]

  return (
    <div className="flex gap-px bg-muted rounded-lg p-px">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
            value === opt.value
              ? 'bg-card text-foreground shadow-sm font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
