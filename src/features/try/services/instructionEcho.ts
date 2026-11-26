/**
 * Whether an answer repeats a long stretch of the visitor's instructions, which the agent must not
 * post in the room. The comparison ignores case and whitespace.
 */

/** The shortest run of characters of the instructions that counts as a repeat. */
const ECHO_LENGTH = 80;

const folded = (text: string): string => text.toLowerCase().replace(/\s+/gu, '');

export const repeatsInstructions = (answer: string, instructions: string): boolean => {
  const source = folded(instructions);
  const target = folded(answer);
  for (let start = 0; start + ECHO_LENGTH <= source.length; start += 1) {
    if (target.includes(source.slice(start, start + ECHO_LENGTH))) {
      return true;
    }
  }
  return false;
};
