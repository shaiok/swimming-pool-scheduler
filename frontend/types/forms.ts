export interface RegistrationFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'swimmer' | 'instructor';
  swimmingStyles: string[];
}

export interface ValidationErrors {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
}