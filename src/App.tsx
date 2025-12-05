import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Devices from './pages/Devices'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import { auth } from './services/auth'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // закрывать сайдбар при смене маршрута (полезно на мобильных)
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className={`app layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Кнопка-бургер для мобильных */}
      <button
        className="menu-button"
        aria-label="Меню"
        onClick={() => setSidebarOpen((v) => !v)}
      >
        ≡
      </button>
      <Sidebar />
      {/* Оверлей для клика вне меню на мобильных */}
      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/devices" element={<Devices />} />
        </Routes>
      </main>
    </div>
  )
}


export default function App() {
  function ProtectedApp() {
    const token = auth.getToken()
    if (!token) return <Navigate to="/login" replace />
    return <Layout />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  )
}

