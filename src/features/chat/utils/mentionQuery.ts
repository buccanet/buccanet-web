import type { MemberInfo } from '@/sdk/types';

/** The `@word` being typed just before the caret, and where it starts. */
export interface MentionQuery {
  start: number;
  wanted: string;
}

export const mentionQuery = (text: string, caret: number): MentionQuery | null => {
  const before = text.slice(0, caret);
  const start = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\n')) + 1;
  return before[start] === '@' ? { start, wanted: before.slice(start + 1).toLowerCase() } : null;
};

/** The other members whose name starts with what follows the `@`. */
export const mentionCandidates = (query: MentionQuery, members: MemberInfo[], me: string): MemberInfo[] =>
  members.filter((member) => member.deviceId !== me && member.name.toLowerCase().startsWith(query.wanted));

/** The text with the `@word` replaced by `@Name `, and the caret just after it. */
export const insertMention = (text: string, caret: number, query: MentionQuery, member: MemberInfo): { text: string; caret: number } => {
  const mention = `@${member.name} `;
  return { text: text.slice(0, query.start) + mention + text.slice(caret), caret: query.start + mention.length };
};
