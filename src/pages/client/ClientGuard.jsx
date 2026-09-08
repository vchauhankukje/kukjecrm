import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ClientGuard() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <p className="p-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
  if (!session) return <Navigate to="/client/login" replace />

  return <Outlet />
}
