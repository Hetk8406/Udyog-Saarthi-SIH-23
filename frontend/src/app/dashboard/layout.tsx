import { Metadata } from 'next';
import DashboardGuard from './DashboardGuard';

export const metadata: Metadata = {
  title: 'Candidate Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardGuard>{children}</DashboardGuard>;
}
