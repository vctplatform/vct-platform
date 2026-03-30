'use client'

import React from 'react'
import LandingPage from 'app/features/public/LandingPage'
import Page_portal_hub from 'app/features/portals/Page_portal_hub'

// Giả định logic Auth đơn giản cho việc Demo Phase 2 Audit
// Trong thực tế sẽ dùng useAuth() hook từ @vct/auth
const useIsLoggedIn = () => {
    // Tạm thời trả về false để hiển thị Landing Page cho Audit Phase 1
    return false 
}

export default function Page() {
  const isLoggedIn = useIsLoggedIn()

  if (isLoggedIn) {
    return <Page_portal_hub />
  }

  return <LandingPage />
}
