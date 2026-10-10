import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning Library & Practice Mock Tests',
  description:
    'Free accessible study materials, video resources, and practice examinations with screen-reader compatibility, adjustable timers, and subject performance analysis.',
  alternates: {
    canonical: '/learning',
  },
};

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
