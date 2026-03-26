import { Metadata } from 'next'
import Page_portal_hub from 'app/features/portals/Page_portal_hub'

export const metadata: Metadata = {
    title: 'Portal Hub | VCT Platform',
    description: 'Central workspace management and unified dashboard for VCT Platform.',
}

export default function PortalPage() {
    return <Page_portal_hub />
}
