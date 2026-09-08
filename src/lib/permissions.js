import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Loads the current logged-in recruiter's effective permissions: their
// Profile's permissions unioned with any additional Permission Sets.
// A recruiter row with no Profile assigned (e.g. the original admin account,
// backfilled before this feature existed, or any recruiter deliberately left
// unassigned) is treated as unrestricted, so nothing breaks for existing logins.
export function usePermissions() {
  const [loading, setLoading] = useState(true)
  const [unrestricted, setUnrestricted] = useState(false)
  const [permissions, setPermissions] = useState(new Set()) // "object:action"
  const [recruiter, setRecruiter] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const authUserId = userData?.user?.id
      if (!authUserId) {
        setLoading(false)
        return
      }

      const { data: recruiterRow } = await supabase.from('recruiter').select('*').eq('user_id', authUserId).maybeSingle()
      if (!recruiterRow || !recruiterRow.profile_id) {
        setUnrestricted(true)
        setRecruiter(recruiterRow || null)
        setLoading(false)
        return
      }
      setRecruiter(recruiterRow)

      const permSet = new Set()

      const { data: profilePerms } = await supabase
        .from('profile_permission')
        .select('permission(object, action)')
        .eq('profile_id', recruiterRow.profile_id)
      for (const row of profilePerms || []) {
        if (row.permission) permSet.add(`${row.permission.object}:${row.permission.action}`)
      }

      const { data: setLinks } = await supabase.from('recruiter_permission_set').select('permission_set_id').eq('recruiter_id', recruiterRow.id)
      for (const link of setLinks || []) {
        const { data: setPerms } = await supabase
          .from('permission_set_permission')
          .select('permission(object, action)')
          .eq('permission_set_id', link.permission_set_id)
        for (const row of setPerms || []) {
          if (row.permission) permSet.add(`${row.permission.object}:${row.permission.action}`)
        }
      }

      setPermissions(permSet)
      setLoading(false)
    }
    load()
  }, [])

  function can(object, action) {
    if (unrestricted) return true
    return permissions.has(`${object}:${action}`)
  }

  return { loading, can, unrestricted, recruiter }
}

export async function logAudit({ action, objectType, objectId, before = null, after = null }) {
  const { data: userData } = await supabase.auth.getUser()
  await supabase.from('audit_log').insert({
    actor_email: userData?.user?.email || null,
    action,
    object_type: objectType,
    object_id: objectId,
    before,
    after,
  })
}
