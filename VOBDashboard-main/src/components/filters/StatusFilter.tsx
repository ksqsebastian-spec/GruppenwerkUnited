'use client'

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const options = [
    { value: 'all', label: 'Alle' },
    { value: 'active', label: 'Aktiv' },
    { value: 'expired', label: 'Abgelaufen' },
  ]

  return (
    <div className="flex gap-px bg-neutral-100 rounded-lg p-px">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
            value === opt.value
              ? 'bg-white text-neutral-900 shadow-sm font-medium'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
