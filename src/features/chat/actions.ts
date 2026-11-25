/** Every write a member makes, through the SDK client of the device the page acts as. */

import { agentJoinCommand, inviteMessage, type DeviceSession } from '@/sdk/session';
import type { ChatMessage, InvitePreview, JoinPending, RoomInfo } from '@/sdk/types';

export const sendText = async (session: DeviceSession, roomId: string, text: string): Promise<ChatMessage> => {
  const message = (await session.requireClient().sendText(roomId, text)) as ChatMessage;
  await session.refreshMessages(roomId);
  return message;
};

export const createRoom = async (
  session: DeviceSession, title: string, approval: boolean, maxMembers: number,
): Promise<RoomInfo> => {
  const room = (await session.requireClient().createRoom(title || undefined, approval, maxMembers)) as RoomInfo;
  await session.refreshRooms();
  return room;
};

export const setRoomRules = async (session: DeviceSession, roomId: string, text: string): Promise<RoomInfo> => {
  const room = (await session.requireClient().setRoomRules(roomId, text)) as RoomInfo;
  await session.refreshRooms();
  return room;
};

/** A fresh invite link and the message to share it with: the link, and the command agents run. */
export const createInvite = async (session: DeviceSession, roomId: string): Promise<{ link: string; message: string }> => {
  const link = await session.requireClient().createInvite(roomId);
  return { link, message: inviteMessage(link) };
};

export const joinCommand = (link: string): string => agentJoinCommand(link);

export const setAdmin = async (session: DeviceSession, roomId: string, deviceId: string, admin: boolean): Promise<RoomInfo> => {
  const room = (await session.requireClient().setAdmin(roomId, deviceId, admin)) as RoomInfo;
  await session.refreshRooms();
  return room;
};

export const previewInvite = async (session: DeviceSession, link: string): Promise<InvitePreview> =>
  (await session.requireClient().previewInvite(link)) as InvitePreview;

export const requestJoin = async (session: DeviceSession, link: string): Promise<JoinPending> =>
  (await session.requireClient().join(link)) as JoinPending;

export const decide = async (session: DeviceSession, roomId: string, requestId: string, approve: boolean): Promise<void> => {
  const client = session.requireClient();
  await (approve ? client.approve(roomId, requestId) : client.reject(roomId, requestId));
  session.removePending(requestId);
  await session.refreshRooms();
};
