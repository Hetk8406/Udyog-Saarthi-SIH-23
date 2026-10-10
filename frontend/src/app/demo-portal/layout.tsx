import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Govt Application Simulation',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
