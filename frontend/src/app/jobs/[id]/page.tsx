import React from 'react';
import { Metadata } from 'next';
import JobDetailClient from '@/components/jobs/JobDetailClient';
import { Job } from '@/types/job';

interface PageProps {
  params: {
    id: string;
  };
}

async function fetchJob(id: string): Promise<Job | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  try {
    const res = await fetch(`${apiUrl}/jobs/${id}/`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const job = await fetchJob(params.id);

  if (!job) {
    return {
      title: 'Job Vacancy Details',
      description: 'Explore verified employment vacancies and disability accommodations on Udyog Saarthi.',
      alternates: {
        canonical: `/jobs/${params.id}`,
      },
    };
  }

  const orgName = job.organization?.name || 'Recruiting Employer';
  const deadlineDate = job.application_deadline
    ? new Date(job.application_deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'scheduled closing date';

  const title = `${job.title} at ${orgName}`;
  const description = `${job.title} vacancy at ${orgName} in ${job.location_city}, ${job.location_state}. Review qualifications, accommodations, and apply before ${deadlineDate}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/jobs/${job.id}`,
    },
    openGraph: {
      title: `${title} | Udyog Saarthi`,
      description,
      url: `/jobs/${job.id}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Udyog Saarthi`,
      description,
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const job = await fetchJob(params.id);

  // Generate Schema.org JobPosting structured data
  // Strict rule: only include fields we actually have; no fake values; NO disability or candidate information.
  let jsonLd: Record<string, any> | null = null;

  if (job) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || job.responsibilities || job.title,
    };

    if (job.created_at) {
      jsonLd.datePosted = job.created_at;
    }

    if (job.application_deadline) {
      jsonLd.validThrough = job.application_deadline;
    }

    if (job.organization?.name) {
      const orgData: Record<string, any> = {
        '@type': 'Organization',
        name: job.organization.name,
      };
      if (job.organization.website) {
        orgData.sameAs = job.organization.website;
      }
      jsonLd.hiringOrganization = orgData;
    }

    if (job.location_city || job.location_state) {
      jsonLd.jobLocation = {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          ...(job.location_city ? { addressLocality: job.location_city } : {}),
          ...(job.location_state ? { addressRegion: job.location_state } : {}),
          addressCountry: 'IN',
        },
      };
    }

    if (job.work_mode === 'remote') {
      jsonLd.jobLocationType = 'TELECOMMUTE';
    }

    if (job.job_type === 'full_time') {
      jsonLd.employmentType = 'FULL_TIME';
    } else if (job.job_type === 'part_time') {
      jsonLd.employmentType = 'PART_TIME';
    } else if (job.job_type === 'contract') {
      jsonLd.employmentType = 'CONTRACTOR';
    } else if (job.job_type === 'internship') {
      jsonLd.employmentType = 'INTERN';
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <JobDetailClient initialJob={job} jobId={params.id} />
    </>
  );
}
