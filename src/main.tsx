import "@/lib/gsap"
import 'lenis/dist/lenis.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import App from './App.tsx'
import './index.css'
import { Commissions, Discography, Error404, Home } from './pages'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="discography" element={<Discography />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path='/*' element={<Error404 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
