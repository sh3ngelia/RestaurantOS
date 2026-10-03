/**
 * The app's status palette. Every status in every module maps to one of these
 * tones, so "seated", "arrived" and "preparing" share a colour, as do "reserved",
 * "held" and "confirmed". The colours themselves are the --status-* tokens in index.css.
 */
export type StatusTone = 'neutral' | 'muted' | 'waiting' | 'active' | 'attention' | 'danger'

interface ToneClasses {
  /** Chip / badge: border, fill and text. */
  chip: string
  /** Small status dot. */
  dot: string
  /** Text in the tone, for inline notes. */
  text: string
  /** A card or row tinted for the tone. */
  surface: string
}

export const STATUS_TONE_CLASSES: Record<StatusTone, ToneClasses> = {
  neutral: {
    chip: 'border-border-strong text-foreground/85',
    dot: 'bg-muted-foreground',
    text: 'text-foreground',
    surface: 'border-border bg-card',
  },
  muted: {
    chip: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground/50',
    text: 'text-muted-foreground',
    surface: 'border-border bg-card',
  },
  waiting: {
    chip: 'border-status-waiting/40 bg-status-waiting/10 text-status-waiting',
    dot: 'bg-status-waiting',
    text: 'text-status-waiting',
    surface: 'border-status-waiting/45 bg-status-waiting/5',
  },
  active: {
    chip: 'border-status-active/40 bg-status-active/10 text-status-active',
    dot: 'bg-status-active',
    text: 'text-status-active',
    surface: 'border-status-active/45 bg-status-active/5',
  },
  // The loudest tone: solid accent, kept for things that need someone to act now.
  attention: {
    chip: 'border-status-attention bg-status-attention text-primary-foreground',
    dot: 'bg-status-attention',
    text: 'text-status-attention',
    surface: 'border-status-attention bg-status-attention/8',
  },
  danger: {
    chip: 'border-status-danger/40 bg-status-danger/10 text-status-danger',
    dot: 'bg-status-danger',
    text: 'text-status-danger',
    surface: 'border-status-danger/45 bg-status-danger/5',
  },
}
