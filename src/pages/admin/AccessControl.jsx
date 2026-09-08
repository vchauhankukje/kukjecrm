import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Container, Card, Input, Button, ErrorText, Select } from '../../components/ui'

const TABS = ['Profiles', 'Permission Sets', 'Recruiters']

function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export default function AccessControl() {
  const [tab, setTab] = useState('Profiles')

  return (
    <Container narrow={false}>
      <h2 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Access Control</h2>
      <p className="mb-5 text-sm text-[var(--color-muted)]">Profiles define baseline access per object; Permission Sets add extra grants on top; Recruiters get one Profile + any number of Permission Sets.</p>

      <div className="mb-4 flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold ${tab === t ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profiles' && <PermissionGrantEditor kind="profile" table="profile" joinTable="profile_permission" joinKey="profile_id" />}
      {tab === 'Permission Sets' && <PermissionGrantEditor kind="permission set" table="permission_set" joinTable="permission_set_permission" joinKey="permission_set_id" />}
      {tab === 'Recruiters' && <RecruitersTab />}
    </Container>
  )
}

function PermissionGrantEditor({ kind, table, joinTable, joinKey }) {
  const [items, setItems] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [grants, setGrants] = useState(new Set())
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from(table).select('*').order('name')
    setItems(data || [])
    const { data: perms } = await supabase.from('permission').select('*').order('object').order('action')
    setPermissions(perms || [])
    if (data && data.length && !selectedId) setSelectedId(data[0].id)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    async function loadGrants() {
      if (!selectedId) return
      const { data } = await supabase.from(joinTable).select('permission_id').eq(joinKey, selectedId)
      setGrants(new Set((data || []).map((r) => r.permission_id)))
    }
    loadGrants()
  }, [selectedId])

  async function addItem() {
    if (!newName.trim()) return
    const { error: dbError } = await supabase.from(table).insert({ name: newName.trim() })
    if (dbError) { setError(dbError.message); return }
    setNewName('')
    load()
  }

  async function toggleGrant(permissionId) {
    const hasIt = grants.has(permissionId)
    if (hasIt) {
      await supabase.from(joinTable).delete().eq(joinKey, selectedId).eq('permission_id', permissionId)
    } else {
      await supabase.from(joinTable).insert({ [joinKey]: selectedId, permission_id: permissionId })
    }
    const next = new Set(grants)
    hasIt ? next.delete(permissionId) : next.add(permissionId)
    setGrants(next)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">All {kind}s</p>
        <div className="mb-3 space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selectedId === item.id ? 'bg-[var(--color-primary-tint)] font-semibold text-[var(--color-primary)]' : 'text-[var(--color-body)] hover:bg-[var(--color-surface-muted)]'}`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 border-t border-[var(--color-border)] pt-3">
          <Input placeholder={`New ${kind} name`} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={addItem}>Add</Button>
        </div>
        <ErrorText>{error}</ErrorText>
      </Card>

      <Card className="md:col-span-2">
        <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Permissions for {items.find((i) => i.id === selectedId)?.name || '—'}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {permissions.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
              <input type="checkbox" checked={grants.has(p.id)} onChange={() => toggleGrant(p.id)} />
              <span className="capitalize">{p.object}.{p.action}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}

function RecruitersTab() {
  const [recruiters, setRecruiters] = useState([])
  const [profiles, setProfiles] = useState([])
  const [permissionSets, setPermissionSets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [assignedSets, setAssignedSets] = useState(new Set())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [inviteLink, setInviteLink] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('recruiter').select('*, profile(name)').order('created_at', { ascending: false })
    setRecruiters(data || [])
    const { data: p } = await supabase.from('profile').select('*').order('name')
    setProfiles(p || [])
    const { data: ps } = await supabase.from('permission_set').select('*').order('name')
    setPermissionSets(ps || [])
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    async function loadSets() {
      if (!selectedId) return
      const { data } = await supabase.from('recruiter_permission_set').select('permission_set_id').eq('recruiter_id', selectedId)
      setAssignedSets(new Set((data || []).map((r) => r.permission_set_id)))
    }
    loadSets()
  }, [selectedId])

  async function invite() {
    if (!name || !email) { setError('Enter name and email.'); return }
    setError('')
    const inviteToken = generateToken()
    const { error: dbError } = await supabase.from('recruiter').insert({ name, email, invite_token: inviteToken })
    if (dbError) { setError(dbError.message); return }
    setInviteLink(`${window.location.origin}/admin/onboard?token=${inviteToken}`)
    setName('')
    setEmail('')
    load()
  }

  async function setProfile(recruiterId, profileId) {
    await supabase.from('recruiter').update({ profile_id: profileId || null }).eq('id', recruiterId)
    load()
  }

  async function toggleSet(permissionSetId) {
    const hasIt = assignedSets.has(permissionSetId)
    if (hasIt) {
      await supabase.from('recruiter_permission_set').delete().eq('recruiter_id', selectedId).eq('permission_set_id', permissionSetId)
    } else {
      await supabase.from('recruiter_permission_set').insert({ recruiter_id: selectedId, permission_set_id: permissionSetId })
    }
    const next = new Set(assignedSets)
    hasIt ? next.delete(permissionSetId) : next.add(permissionSetId)
    setAssignedSets(next)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Invite a recruiter</p>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="mb-2" />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-2" />
        <ErrorText>{error}</ErrorText>
        <Button onClick={invite} className="w-full">Create invite</Button>
        {inviteLink && (
          <p className="mt-3 break-all rounded-lg bg-[var(--color-surface-muted)] p-2 font-mono text-xs text-[var(--color-primary)]">{inviteLink}</p>
        )}

        <div className="mt-4 space-y-1 border-t border-[var(--color-border)] pt-3">
          {recruiters.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selectedId === r.id ? 'bg-[var(--color-primary-tint)] font-semibold text-[var(--color-primary)]' : 'text-[var(--color-body)] hover:bg-[var(--color-surface-muted)]'}`}
            >
              {r.name} <span className="text-xs text-[var(--color-muted)]">— {r.profile?.name || 'No profile'} {r.user_id ? '' : '(Invited)'}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="md:col-span-2">
        {!selectedId && <p className="text-sm text-[var(--color-muted)]">Select a recruiter to configure their access.</p>}
        {selectedId && (
          <>
            <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Profile</p>
            <Select
              value={recruiters.find((r) => r.id === selectedId)?.profile_id || ''}
              onChange={(e) => setProfile(selectedId, e.target.value)}
              className="mb-4"
            >
              <option value="">No profile (unrestricted fallback)</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>

            <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Additional permission sets</p>
            <div className="grid grid-cols-2 gap-2">
              {permissionSets.map((ps) => (
                <label key={ps.id} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
                  <input type="checkbox" checked={assignedSets.has(ps.id)} onChange={() => toggleSet(ps.id)} />
                  {ps.name}
                </label>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
