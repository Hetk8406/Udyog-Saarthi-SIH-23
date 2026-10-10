import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit Feedback & Accessibility Ratings',
  robots: {
    index: false,
    follow: false,
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
