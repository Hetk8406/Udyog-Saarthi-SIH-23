import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isDev = process.env.NODE_ENV !== 'production';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (isDev ? 'http://localhost:3000' : '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isDev ? 'http://localhost:8000/api' : '');

  // Public static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/jobs',
    '/learning',
    '/success-stories',
    '/about',
    '/privacy-policy',
    '/terms',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/jobs' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/jobs' ? 0.9 : 0.7,
  }));

  // Public published jobs only (NEVER private pages, applications, or candidate profiles)
  let jobUrls: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/jobs/?page_size=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const jobs = data.results || data || [];
      jobUrls = jobs
        .filter((job: any) => job.id)
        .map((job: any) => ({
          url: `${siteUrl}/jobs/${job.id}`,
          lastModified: job.updated_at ? new Date(job.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch {
    // If backend is unavailable at build time, fallback cleanly to static routes
  }

  return [...staticRoutes, ...jobUrls];
}
