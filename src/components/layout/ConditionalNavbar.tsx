'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Hide navbar on root page (login page)
  if (pathname === '/') {
    return null
  }
  
  return <Navbar />
}

