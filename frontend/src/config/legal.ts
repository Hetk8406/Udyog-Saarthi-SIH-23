/**
 * Centralized Legal & Compliance Configuration
 * ==============================================
 * Populated from environment variables with sensible production fallbacks.
 * Keeps legal documents and terms consistent across all pages.
 */

export const legalConfig = {
  organizationName:
    process.env.NEXT_PUBLIC_ORG_NAME || 'Udyog Saarthi Initiative',
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@udyogsaarthi.in',
  legalEmail:
    process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'legal@udyogsaarthi.in',
  helplinePhone:
    process.env.NEXT_PUBLIC_HELPLINE_PHONE || '+91 11 2345 6789',
  postalAddress:
    process.env.NEXT_PUBLIC_POSTAL_ADDRESS ||
    'Department of Empowerment of Persons with Disabilities, 5th Floor, Pt. Deendayal Antyodaya Bhawan, CGO Complex, Lodhi Road, New Delhi 110003, India',
  grievanceOfficerName:
    process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME || 'Smt. Priya Sharma',
  grievanceOfficerEmail:
    process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL || 'grievance@udyogsaarthi.in',
  lastUpdatedDate:
    process.env.NEXT_PUBLIC_LEGAL_LAST_UPDATED || 'October 9, 2026',
  isReviewed:
    (process.env.NEXT_PUBLIC_LEGAL_REVIEWED || '').toLowerCase() === 'true',
};
