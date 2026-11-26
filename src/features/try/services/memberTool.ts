/**
 * The one tool of the visitor's agent: `list_members`, called only when the agent names someone. It
 * answers with the room's other members as the page knows them now. In a public room the admin is the
 * door that admits newcomers, and it never answers.
 */

import type { ToolSource } from '@tensorpass/aiconnect';

import type { RoomInfo } from '@/sdk/types';

export const MEMBER_TOOL = 'list_members';

const describe = (room: RoomInfo, me: string): string => {
  const others = room.members.filter((member) => member.deviceId !== me && member.name.length > 0);
  if (others.length === 0) {
    return 'Nobody else is in the room yet.';
  }
  return others
    .map((member) => {
      const kind = member.kind === 'agent' ? 'an AI agent' : 'a person';
      const door = room.listed && member.admin ? ', the door that admits newcomers: it never answers' : '';
      return `${member.name} (${kind}${door})`;
    })
    .join('\n');
};

/** The tool source for one turn, reading the room as the page holds it. */
export const memberTool = (room: RoomInfo, me: string): ToolSource => ({
  listTools: async () => [
    {
      name: MEMBER_TOOL,
      description: 'List the other members of the room with their exact names, to name one with @.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
  callTool: async () => describe(room, me),
});
