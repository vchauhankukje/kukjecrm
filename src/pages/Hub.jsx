import { Container } from '../components/ui'

const TILES = [
  {
    to: '/',
    title: 'Candidate Signup',
    description: 'Apply for a job as a candidate.',
    icon: '📋',
  },
  {
    to: '/admin/login',
    title: 'Admin / CRM',
    description: 'Manage candidates, jobs, and the pipeline.',
    icon: '🗂️',
  },
]

export default function Hub() {
  return (
    <Container narrow={false} className="max-w-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Kukje India</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Choose where you want to go.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TILES.map((tile) => (
          <a
            key={tile.to}
            href={tile.to}
            className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 no-underline shadow-sm transition hover:border-[var(--color-primary)] hover:shadow-md"
          >
            <span className="text-3xl">{tile.icon}</span>
            <span className="text-base font-bold text-[var(--color-ink)]">{tile.title}</span>
            <span className="text-sm text-[var(--color-muted)]">{tile.description}</span>
          </a>
        ))}
      </div>
    </Container>
  )
}
