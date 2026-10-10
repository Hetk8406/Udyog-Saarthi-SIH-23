import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In to Account',
  description:
    'Sign in to Udyog Saarthi to access your applications, personalized job recommendations, mock test scorecards, or coach desk.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
