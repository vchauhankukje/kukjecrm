import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import logo from './assets/kukje-logo.png'
import SignUp from './pages/SignUp'
import Hub from './pages/Hub'
import CheckStatus from './pages/CheckStatus'
import CategorySelect from './pages/CategorySelect'
import Experience from './pages/Experience'
import Availability from './pages/Availability'
import JobFeed from './pages/JobFeed'
import AdminLogin from './pages/admin/AdminLogin'
import AdminGuard from './pages/admin/AdminGuard'
import CandidateList from './pages/admin/CandidateList'
import CandidateDetail from './pages/admin/CandidateDetail'
import JobList from './pages/admin/JobList'
import JobForm from './pages/admin/JobForm'
import PartnerList from './pages/admin/PartnerList'
import PartnerInvite from './pages/admin/PartnerInvite'
import PartnerDetail from './pages/admin/PartnerDetail'
import Pipeline from './pages/admin/Pipeline'
import LocationManager from './pages/admin/LocationManager'
import PartnerOnboard from './pages/partner/PartnerOnboard'
import PartnerLogin from './pages/partner/PartnerLogin'
import PartnerGuard from './pages/partner/PartnerGuard'
import PartnerDashboard from './pages/partner/PartnerDashboard'

function BrandHeader() {
  const location = useLocation()
  if (location.pathname.startsWith('/admin')) return null
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-5 text-center">
      <img src={logo} alt="Kukje India" className="mx-auto w-full max-w-[220px]" />
    </header>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <BrandHeader />
        <Routes>
          {/* Candidate-facing */}
          <Route path="/" element={<SignUp />} />
          <Route path="/start" element={<Hub />} />
          <Route path="/status" element={<CheckStatus />} />
          <Route path="/categories" element={<CategorySelect />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/jobs" element={<JobFeed />} />

          {/* Partner-facing */}
          <Route path="/partner/onboard" element={<PartnerOnboard />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route element={<PartnerGuard />}>
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          </Route>

          {/* Admin/CRM */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<CandidateList />} />
            <Route path="/admin/pipeline" element={<Pipeline />} />
            <Route path="/admin/locations" element={<LocationManager />} />
            <Route path="/admin/candidates/:id" element={<CandidateDetail />} />
            <Route path="/admin/jobs" element={<JobList />} />
            <Route path="/admin/jobs/new" element={<JobForm />} />
            <Route path="/admin/jobs/:id/edit" element={<JobForm />} />
            <Route path="/admin/partners" element={<PartnerList />} />
            <Route path="/admin/partners/invite" element={<PartnerInvite />} />
            <Route path="/admin/partners/:id" element={<PartnerDetail />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
