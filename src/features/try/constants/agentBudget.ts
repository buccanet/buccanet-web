/** What the visitor's agent may spend of their AI plan while the Try it page is open. */

/** Wakes this close together become one turn. */
export const MERGE_MS = 1_500;

/** The wait after every turn, whatever it ended with, before the room wakes the agent again. */
export const COOLDOWN_MS = 20_000;

/** The turns that reach the visitor's model in one hour, whatever each one ended with. */
export const TURNS_PER_HOUR = 30;

export const HOUR_MS = 3_600_000;

/** The model steps of one turn: one call to `list_members`, then the answer. */
export const MAX_STEPS = 2;
