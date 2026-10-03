import type { Transition } from 'motion/react'

/*
 * The only motion in the app: short, functional transitions for things that
 * appear, disappear or change state. Nothing animates on page load or on hover.
 * MotionConfig reducedMotion="user" (main.tsx) drops transforms for people who ask.
 */

export const FAST: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] }

/** A list item being added or removed: a plain fade, with layout moving its neighbours. */
export const listItemMotion = {
  layout: true,
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: FAST },
  transition: FAST,
} as const

/** A block that opens or collapses in place (alerts, banners, ticket lines). */
export const collapseMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: FAST,
} as const
