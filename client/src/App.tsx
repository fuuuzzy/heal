import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './components/auth/LoginPage'
import { RegisterPage } from './components/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ArchivedPlansPage } from './pages/ArchivedPlansPage'
import { CreatePlanPage } from './pages/CreatePlanPage'
import { PlanPage } from './pages/PlanPage'
import { PartnerPage } from './pages/PartnerPage'
import { ErrorBoundary } from './components/common/ErrorBoundary'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="text-2xl">🧸</span></div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/archive" element={<ArchivedPlansPage />} />
              <Route path="/plan/new" element={<CreatePlanPage />} />
              <Route path="/plan/:id" element={<PlanPage />} />
              <Route path="/partner" element={<PartnerPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
