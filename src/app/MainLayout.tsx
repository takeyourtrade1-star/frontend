/**
 * MainLayout
 * Layout principale con Header, Footer e Background Video
 */

import { Outlet } from 'react-router-dom'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import BackgroundVideo from '@/components/layout/BackgroundVideo'
import ActivityStatusBanner from '@/components/ui/ActivityStatusBanner'

export default function MainLayout() {
  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Background Video - Posizionato sotto tutto il contenuto */}
      <BackgroundVideo />
      
      {/* Header e contenuto principale */}
      <Header />
      
      {/* Activity Status Banner */}
      <ActivityStatusBanner />
      
      <main className="relative flex-1 z-10 pb-20 md:pb-0">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  )
}

