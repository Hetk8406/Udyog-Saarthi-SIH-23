import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support & Help Desk',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
