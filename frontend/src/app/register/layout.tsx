import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account — Register as Candidate or Guardian',
  description:
    'Join Udyog Saarthi to access accessible jobs with reservation quotas, assistive examination accommodations, and job coach guidance.',
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
