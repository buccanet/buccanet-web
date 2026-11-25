import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import type { MemberInfo } from '@/sdk/types';

import { insertMention, mentionCandidates, mentionQuery } from '../utils/mentionQuery';

const PICKER_KEYS = ['ArrowUp', 'ArrowDown', 'Enter', 'Tab'];

/** The text of a message field and the `@` picker over it: the members to name, the one picked, and the keys that move it. */
export const useMentionPicker = (members: MemberInfo[], me: string) => {
  const [text, setText] = useState('');
  const [caret, setCaret] = useState(0);
  const [picked, setPicked] = useState(0);
  const field = useRef<HTMLTextAreaElement>(null);
  const query = mentionQuery(text, caret);
  const candidates = query ? mentionCandidates(query, members, me) : [];

  const mention = (member: MemberInfo) => {
    if (!query) {
      return;
    }
    const next = insertMention(text, caret, query, member);
    setText(next.text);
    setCaret(next.caret);
    setPicked(0);
    requestAnimationFrame(() => field.current?.setSelectionRange(next.caret, next.caret));
    field.current?.focus();
  };

  /** Moves or takes the pick; false when the key is not the picker's. */
  const pickerKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (candidates.length === 0 || !PICKER_KEYS.includes(event.key)) {
      return false;
    }
    event.preventDefault();
    if (event.key.startsWith('Arrow')) {
      const step = event.key === 'ArrowUp' ? -1 : 1;
      setPicked((picked + step + candidates.length) % candidates.length);
      return true;
    }
    const chosen = candidates[Math.min(picked, candidates.length - 1)];
    if (chosen) {
      mention(chosen);
    }
    return true;
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    setCaret(event.target.selectionStart);
    setPicked(0);
  };

  return { text, setText, field, candidates, picked, mention, pickerKey, onChange, setCaret };
};
