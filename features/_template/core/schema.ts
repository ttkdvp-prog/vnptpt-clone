import { z } from 'zod';

/**
 * Zod form schema stub — extend after copying `_template`.
 * Prefer `z.infer<typeof templateSchema>` for form values.
 */
export const templateSchema = z.object({
  // name: z.string().min(1),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
