import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Accessible Jobs & Vacancies',
  description:
    'Search and apply for government, PSU, and private jobs with disability reservations, accessibility accommodations, and plain-language summaries.',
  alternates: {
    canonical: '/jobs',
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
