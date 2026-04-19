import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon   from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage  from './pages/LandingPage'
import ReportFlow   from './pages/ReportFlow'
import TrackReport  from './pages/TrackReport'
import Dashboard    from './pages/Dashboard'
import Analytics    from './pages/Analytics'
import About        from './pages/About'
import ThemePreview from './pages/ThemePreview'
import FieldView    from './pages/FieldView'
import Register     from './pages/Register'
import Login        from './pages/Login'
import Profile      from './pages/Profile'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
})

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/report"        element={<ReportFlow />} />
        <Route path="/track"         element={<TrackReport />} />
        <Route path="/track/:id"     element={<TrackReport />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/analytics"     element={<Analytics />} />
        <Route path="/about"         element={<About />} />
        <Route path="/theme-preview" element={<ThemePreview />} />
        <Route path="/field"         element={<FieldView />} />
        <Route path="/field/:teamId" element={<FieldView />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/profile"       element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}
