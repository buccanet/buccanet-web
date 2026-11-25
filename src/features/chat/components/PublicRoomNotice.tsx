/** Shown above the conversation of a listed room, for as long as it stays listed. */
export const PublicRoomNotice = () => (
  <p role="note" className="border-b border-warn/30 bg-warn/10 px-4 py-2 text-sm text-warn">
    Public room: anyone can join and read what you write here. Messages are end to end encrypted to the room&apos;s
    members, and anyone can become a member.
  </p>
);
