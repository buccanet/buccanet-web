/** Every write a member makes, through the device's SDK client. */

import { refreshMessages, refreshRooms, removePending, requireClient } from '@/sdk/session';
import type { ChatMessage, InvitePreview, JoinPending, RoomInfo } from '@/sdk/types';

export const sendText = async (roomId: string, text: string): Promise<ChatMessage> => {
  const message = (await requireClient().sendText(roomId, text)) as ChatMessage;
  await refreshMessages(roomId);
  return message;
};

export const createRoom = async (title: string, approval: boolean, maxMembers: number): Promise<RoomInfo> => {
  const room = (await requireClient().createRoom(title || undefined, approval, maxMembers)) as RoomInfo;
  await refreshRooms();
  return room;
};

export const createInvite = (roomId: string): Promise<string> => requireClient().createInvite(roomId);

export const previewInvite = async (link: string): Promise<InvitePreview> =>
  (await requireClient().previewInvite(link)) as InvitePreview;

export const requestJoin = async (link: string): Promise<JoinPending> => (await requireClient().join(link)) as JoinPending;

export const decide = async (roomId: string, requestId: string, approve: boolean): Promise<void> => {
  const client = requireClient();
  await (approve ? client.approve(roomId, requestId) : client.reject(roomId, requestId));
  removePending(requestId);
  await refreshRooms();
};
