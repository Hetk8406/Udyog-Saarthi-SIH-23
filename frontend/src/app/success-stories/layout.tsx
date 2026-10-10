import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Success Stories & Placements',
  description:
    'Inspiring testimonials and verified career journeys of Persons with Disabilities employed across government, public sector, and private enterprises.',
  alternates: {
    canonical: '/success-stories',
  },
};

export default function SuccessStoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
