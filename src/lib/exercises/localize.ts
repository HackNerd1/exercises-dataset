import type { Locale } from '@/i18n/config';
import type { Exercise } from './types';
export function localizeInstructions(exercise: Exercise, locale: Locale): { steps: string[]; locale: Locale } {
  for (const lang of [...new Set([locale, 'en' as const])]) {
    const steps = exercise.instruction_steps[lang]?.filter(step => step.trim());
    if (steps?.length) return { steps, locale: lang };
    const prose = exercise.instructions[lang]?.trim();
    if (prose) return { steps: [prose], locale: lang };
  }
  return { steps: [], locale };
}

export function localizeName(exercise: Exercise, locale: Locale): { name: string; locale: Locale } {
  const translated = exercise.names?.[locale]?.trim();
  if (translated) return { name: translated, locale };
  return { name: exercise.names?.en?.trim() || exercise.name, locale: 'en' };
}
