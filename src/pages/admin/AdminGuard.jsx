import { useEffect, useState } from 'react'
import { Navigate, Outlet, NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import logo from '../../assets/kukje-logo.png'
import GlobalSearch from '../../components/GlobalSearch'

export default function AdminGuard() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [isRecruiter, setIsRecruiter] = useState(undefined) // undefined = loading

  useEffect(() => {
    async function checkRecruiter(sess) {
      if (!sess) {
        setIsRecruiter(false)
        return
      }
      const { data } = await supabase.from('recruiter').select('user_id').eq('user_id', sess.user.id).maybeSingle()
      setIsRecruiter(!!data)
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      checkRecruiter(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      checkRecruiter(sess)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined || isRecruiter === undefined) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
  if (!session) return <Navigate to="/admin/login" replace />
  if (!isRecruiter) {
    return (
      <p className="p-8 text-center text-sm text-[var(--color-muted)]">
        This login doesn't have admin access.{' '}
        <button onClick={() => supabase.auth.signOut()} className="font-semibold text-[var(--color-primary)] underline">Log out</button>
      </p>
    )
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
      isActive ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]' : 'text-[var(--color-body)] hover:bg-[var(--color-surface-muted)]'
    }`

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)]">
      <nav className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
        <img src={logo} alt="Kukje India" className="mr-3 h-7" />
        <NavLink to="/admin" end className={linkClass}>Candidates</NavLink>
        <NavLink to="/admin/pipeline" className={linkClass}>Pipeline</NavLink>
        <NavLink to="/admin/jobs" className={linkClass}>Jobs</NavLink>
        <NavLink to="/admin/partners" className={linkClass}>Partners/Agents</NavLink>
        <NavLink to="/admin/locations" className={linkClass}>Locations</NavLink>
        <div className="ml-4">
          <GlobalSearch />
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
        >
          Log out
        </button>
      </nav>
      <Outlet />
    </div>
  )
}
