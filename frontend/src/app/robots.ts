import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/jobs/',
          '/learning/',
          '/success-stories/',
          '/about/',
          '/privacy-policy/',
          '/terms/',
          '/login/',
          '/register/',
        ],
        disallow: [
          '/dashboard/',
          '/admin-panel/',
          '/coach/',
          '/support/',
          '/demo-portal/',
          '/feedback/',
          '/reset-password/',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
