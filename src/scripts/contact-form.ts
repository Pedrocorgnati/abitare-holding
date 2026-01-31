import { trackFormSubmit } from './analytics';

interface FormElements {
  form: HTMLFormElement;
  name: HTMLInputElement;
  email: HTMLInputElement;
  phone: HTMLInputElement;
  subject: HTMLSelectElement;
  message: HTMLTextAreaElement;
  honeypot: HTMLInputElement;
  submitBtn: HTMLButtonElement;
  submitText: HTMLElement;
  submitSpinner: HTMLElement;
  successMsg: HTMLElement;
  errorMsg: HTMLElement;
}

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORKER_URL = 'https://contact.abitarebene.it/send';

function getFormElements(): FormElements | null {
  const form = document.getElementById('contact-form') as HTMLFormElement;
  if (!form) return null;

  return {
    form,
    name: form.querySelector('#name') as HTMLInputElement,
    email: form.querySelector('#email') as HTMLInputElement,
    phone: form.querySelector('#phone') as HTMLInputElement,
    subject: form.querySelector('#subject') as HTMLSelectElement,
    message: form.querySelector('#message') as HTMLTextAreaElement,
    honeypot: form.querySelector('input[name="website"]') as HTMLInputElement,
    submitBtn: form.querySelector('#submit-btn') as HTMLButtonElement,
    submitText: form.querySelector('#submit-text') as HTMLElement,
    submitSpinner: form.querySelector('#submit-spinner') as HTMLElement,
    successMsg: document.getElementById('form-success') as HTMLElement,
    errorMsg: document.getElementById('form-error') as HTMLElement,
  };
}

function validateForm(elements: FormElements): ValidationResult {
  const errors: Record<string, string> = {};

  // Nome
  if (!elements.name.value.trim()) {
    errors.name = 'Il nome è obbligatorio';
  } else if (elements.name.value.length > 100) {
    errors.name = 'Il nome non può superare i 100 caratteri';
  }

  // Email
  if (!elements.email.value.trim()) {
    errors.email = "L'email è obbligatoria";
  } else if (!EMAIL_REGEX.test(elements.email.value)) {
    errors.email = 'Inserisci un indirizzo email valido';
  }

  // Telefono (opcional, mas se preenchido deve ser válido)
  if (elements.phone.value && elements.phone.value.length > 20) {
    errors.phone = 'Il numero di telefono non può superare i 20 caratteri';
  }

  // Oggetto
  if (!elements.subject.value) {
    errors.subject = 'Seleziona un argomento';
  }

  // Messaggio
  if (!elements.message.value.trim()) {
    errors.message = 'Il messaggio è obbligatorio';
  } else if (elements.message.value.length > 2000) {
    errors.message = 'Il messaggio non può superare i 2000 caratteri';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function showError(fieldId: string, message: string): void {
  const errorEl = document.getElementById(`${fieldId}-error`);
  const inputEl = document.getElementById(fieldId);

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  if (inputEl) {
    inputEl.classList.add('border-error');
    inputEl.classList.remove('border-border');
  }
}

function clearError(fieldId: string): void {
  const errorEl = document.getElementById(`${fieldId}-error`);
  const inputEl = document.getElementById(fieldId);

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  if (inputEl) {
    inputEl.classList.remove('border-error');
    inputEl.classList.add('border-border');
  }
}

function clearAllErrors(): void {
  ['name', 'email', 'phone', 'subject', 'message'].forEach(clearError);
}

function showErrors(errors: Record<string, string>): void {
  clearAllErrors();
  Object.entries(errors).forEach(([field, message]) => {
    showError(field, message);
  });
}

function prefillSubjectFromURL(elements: FormElements): void {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get('subject');

  if (subject) {
    const subjectMap: Record<string, string> = {
      investment: 'investment',
      partnership: 'partnership',
      general: 'general',
      other: 'other',
    };

    if (subjectMap[subject]) {
      elements.subject.value = subjectMap[subject];
    }
  }

  // Também verificar hash (ex: #contatti?subject=investment)
  const hash = window.location.hash;
  if (hash.includes('subject=')) {
    const match = hash.match(/subject=(\w+)/);
    if (match && match[1]) {
      const subjectValue = match[1];
      if (['investment', 'partnership', 'general', 'other'].includes(subjectValue)) {
        elements.subject.value = subjectValue;
      }
    }
  }
}

// === Form Submission ===

function setLoading(elements: FormElements, loading: boolean): void {
  elements.submitBtn.disabled = loading;

  if (loading) {
    elements.submitText.classList.add('hidden');
    elements.submitSpinner.classList.remove('hidden');
  } else {
    elements.submitText.classList.remove('hidden');
    elements.submitSpinner.classList.add('hidden');
  }
}

function hideMessages(elements: FormElements): void {
  elements.successMsg.classList.add('hidden');
  elements.errorMsg.classList.add('hidden');
}

function showSuccessMessage(elements: FormElements): void {
  elements.successMsg.classList.remove('hidden');
  elements.errorMsg.classList.add('hidden');
  elements.successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showErrorMessage(elements: FormElements, message: string): void {
  const errorText = elements.errorMsg.querySelector('p');
  if (errorText) {
    errorText.textContent = message;
  }

  elements.errorMsg.classList.remove('hidden');
  elements.successMsg.classList.add('hidden');
  elements.errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function submitForm(elements: FormElements): Promise<void> {
  // Prevent double submit
  if (elements.submitBtn.disabled) return;

  // Validate
  const validation = validateForm(elements);
  if (!validation.valid) {
    showErrors(validation.errors);
    return;
  }

  // Check honeypot
  if (elements.honeypot?.value) {
    // Pretend success but don't send
    showSuccessMessage(elements);
    return;
  }

  // Set loading state
  setLoading(elements, true);
  hideMessages(elements);
  clearAllErrors();

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: elements.name.value.trim(),
        email: elements.email.value.trim(),
        phone: elements.phone.value.trim() || undefined,
        subject: elements.subject.value,
        message: elements.message.value.trim(),
        website: elements.honeypot?.value || '', // honeypot
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccessMessage(elements);
      trackFormSubmit('contact', elements.subject.value);
      elements.form.reset();
    } else if (response.status === 429) {
      showErrorMessage(elements, 'Troppi tentativi. Riprova tra qualche minuto.');
    } else if (data.error === 'validation_error' && data.field) {
      showErrors({ [data.field]: data.message });
    } else {
      showErrorMessage(elements, data.message || 'Si è verificato un errore.');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    showErrorMessage(elements, 'Si è verificato un errore. Prova a contattarci via WhatsApp.');
  } finally {
    setLoading(elements, false);
  }
}

// === Initialization ===

export function initContactForm(): void {
  const elements = getFormElements();
  if (!elements) return;

  // Prefill subject from URL
  prefillSubjectFromURL(elements);

  // Real-time validation on blur
  elements.name.addEventListener('blur', () => {
    if (!elements.name.value.trim()) {
      showError('name', 'Il nome è obbligatorio');
    } else {
      clearError('name');
    }
  });

  elements.email.addEventListener('blur', () => {
    if (!elements.email.value.trim()) {
      showError('email', "L'email è obbligatoria");
    } else if (!EMAIL_REGEX.test(elements.email.value)) {
      showError('email', 'Inserisci un indirizzo email valido');
    } else {
      clearError('email');
    }
  });

  elements.subject.addEventListener('change', () => {
    if (elements.subject.value) {
      clearError('subject');
    }
  });

  elements.message.addEventListener('blur', () => {
    if (!elements.message.value.trim()) {
      showError('message', 'Il messaggio è obbligatorio');
    } else {
      clearError('message');
    }
  });

  // Form submission
  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitForm(elements);
  });
}

// Auto-initialize
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initContactForm);
  document.addEventListener('astro:page-load', initContactForm);
}
