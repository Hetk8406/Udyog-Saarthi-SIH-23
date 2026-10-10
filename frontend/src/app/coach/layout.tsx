import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Coach Desk',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
