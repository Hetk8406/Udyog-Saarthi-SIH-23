import { z } from 'zod';

export type FormErrors<T> = Partial<Record<keyof T | 'root', string>>;

/**
 * Transforms Zod error issues into a field -> plain-language actionable error message map
 * explaining what is wrong, which field, and how to fix it.
 */
export function formatZodErrors<T>(error: z.ZodError): FormErrors<T> {
  const errors: FormErrors<T> = {};
  for (const issue of error.issues) {
    const field = (issue.path[0] || 'root') as keyof T | 'root';
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

// 1. REGISTRATION FORM SCHEMA
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full Name is required. Please enter at least 2 characters of your given name.')
      .max(100, 'Full Name is too long. Please shorten it to under 100 characters.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required. Please enter your email (e.g. rahul@example.com).')
      .email('Invalid email address format. Please enter a valid address with an @ and domain name.'),
    phone: z
      .string()
      .trim()
      .refine(
        (val) => !val || /^[6-9]\d{9}$/.test(val.replace(/[\s-]/g, '')),
        'Invalid mobile number. Please enter a valid 10-digit Indian mobile number beginning with 6, 7, 8, or 9.'
      )
      .optional()
      .or(z.literal('')),
    role: z.enum(['candidate', 'guardian', 'coach']),
    password: z
      .string()
      .min(8, 'Password is too short. It must contain at least 8 characters for security.')
      .max(128, 'Password is too long. Please keep it under 128 characters.'),
    passwordConfirm: z
      .string()
      .min(1, 'Please confirm your password by typing it again identically.'),
    termsAccepted: z.boolean().refine(
      (val) => val === true,
      'Consent required. You must check the box agreeing to the Terms of Service and Privacy Policy to register.'
    ),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match. Please re-enter both passwords so they are identical.',
    path: ['passwordConfirm'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// 2. LOGIN FORM SCHEMA
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required. Please type the email associated with your account.')
    .email('Please enter a valid email address structure (e.g. candidate@demo.com).'),
  password: z
    .string()
    .min(1, 'Password is required. Please type your account password to sign in.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// 3. PASSWORD RESET REQUEST SCHEMA
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required. Please enter the email address you registered with.')
    .email('Invalid email format. Please provide a valid address like user@example.com.'),
});

export type ResetPasswordRequestFormData = z.infer<typeof resetPasswordRequestSchema>;

// 4. PASSWORD RESET CONFIRM SCHEMA
export const resetPasswordConfirmSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password is too short. Your new password must contain at least 8 characters.'),
    passwordConfirm: z
      .string()
      .min(1, 'Please re-enter your new password to confirm.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match. Please type the exact same password in both fields.',
    path: ['passwordConfirm'],
  });

export type ResetPasswordConfirmFormData = z.infer<typeof resetPasswordConfirmSchema>;

// 5. SUPPORT TICKET SCHEMA
export const supportTicketSchema = z.object({
  category: z.string().min(1, 'Category is required. Please select the category that best matches your query.'),
  subject: z
    .string()
    .trim()
    .min(4, 'Subject is too short. Please provide a short summary of at least 4 characters explaining your request.')
    .max(120, 'Subject is too long. Please shorten your summary to under 120 characters.'),
  description: z
    .string()
    .trim()
    .min(10, 'Description is too brief. Please provide at least 10 characters detailing what help you need.')
    .max(3000, 'Description is too long. Please keep your request under 3,000 characters.'),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

// 6. FEEDBACK FORM SCHEMA
export const feedbackSchema = z.object({
  category: z.string().min(1, 'Category is required. Please select a feedback topic.'),
  rating: z
    .number()
    .min(1, 'Please select a rating between 1 and 5 stars.')
    .max(5, 'Rating cannot exceed 5 stars.'),
  comments: z
    .string()
    .trim()
    .min(5, 'Feedback text is too brief. Please enter at least 5 characters detailing your feedback or experience.')
    .max(2000, 'Feedback text cannot exceed 2,000 characters.'),
  suggestions: z
    .string()
    .trim()
    .max(1000, 'Suggestions cannot exceed 1,000 characters.')
    .optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

// 7. APPLICATION FORM SCHEMA
export const applicationSchema = z.object({
  candidate_notes: z
    .string()
    .trim()
    .max(1000, 'Notes cannot exceed 1,000 characters. Please shorten your note.')
    .optional(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

// 8. PROFILE WIZARD STEP 1: PERSONAL
export const profilePersonalSchema = z.object({
  alternate_phone: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[6-9]\d{9}$/.test(val.replace(/[\s-]/g, '')),
      'Invalid alternate phone. Please provide a 10-digit Indian mobile number starting with 6-9.'
    )
    .optional()
    .or(z.literal('')),
  pincode: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^\d{6}$/.test(val.replace(/[\s-]/g, '')),
      'Invalid PIN code. Please enter a valid 6-digit Indian postal PIN code.'
    )
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .trim()
    .max(1000, 'Professional summary cannot exceed 1,000 characters.')
    .optional(),
});

// 9. PROFILE EDUCATION MODAL
export const educationSchema = z.object({
  qualification: z
    .string()
    .trim()
    .min(2, 'Qualification is required. Enter degree or certificate name (e.g. B.Tech Computer Science).')
    .max(120, 'Qualification name cannot exceed 120 characters.'),
  institution: z
    .string()
    .trim()
    .min(2, 'Institution is required. Enter your university, college, or school name.')
    .max(200, 'Institution name cannot exceed 200 characters.'),
  passing_year: z
    .string()
    .trim()
    .refine(
      (val) => !val || (/^\d{4}$/.test(val) && Number(val) >= 1960 && Number(val) <= 2035),
      'Please enter a valid 4-digit passing year between 1960 and 2035.'
    )
    .optional()
    .or(z.literal('')),
  percentage: z
    .string()
    .trim()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
      'Percentage or GPA must be a number between 0 and 100.'
    )
    .optional()
    .or(z.literal('')),
});

// 10. PROFILE SKILL MODAL
export const skillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Skill name is required. Enter at least 2 characters (e.g. Python, Typing, Accounting).')
    .max(80, 'Skill name cannot exceed 80 characters.'),
});
