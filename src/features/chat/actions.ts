/** Every write a member makes, through the device's SDK client. */

import { agentJoinCommand, inviteMessage, refreshMessages, refreshRooms, removePending, requireClient } from '@/sdk/session';
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

export const setRoomRules = async (roomId: string, text: string): Promise<RoomInfo> => {
  const room = (await requireClient().setRoomRules(roomId, text)) as RoomInfo;
  await refreshRooms();
  return room;
};

/** A fresh invite link and the message to share it with: the link, and the command agents run. */
export const createInvite = async (roomId: string): Promise<{ link: string; message: string }> => {
  const link = await requireClient().createInvite(roomId);
  return { link, message: inviteMessage(link) };
};

export const joinCommand = (link: string): string => agentJoinCommand(link);

export const setAdmin = async (roomId: string, deviceId: string, admin: boolean): Promise<RoomInfo> => {
  const room = (await requireClient().setAdmin(roomId, deviceId, admin)) as RoomInfo;
  await refreshRooms();
  return room;
};

export const previewInvite = async (link: string): Promise<InvitePreview> =>
  (await requireClient().previewInvite(link)) as InvitePreview;

export const requestJoin = async (link: string): Promise<JoinPending> => (await requireClient().join(link)) as JoinPending;

export const decide = async (roomId: string, requestId: string, approve: boolean): Promise<void> => {
  const client = requireClient();
  await (approve ? client.approve(roomId, requestId) : client.reject(roomId, requestId));
  removePending(requestId);
  await refreshRooms();
};
