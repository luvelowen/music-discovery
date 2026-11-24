'use client';

import { ArrowLeft, Flag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ReportButton } from '@/components/people/report-button';
import { ReportDialog } from '@/components/people/report-dialog';
import { Avatar } from '@/components/profile/avatar';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageTitle } from '@/components/ui/page-title';
import { useChat } from '@/lib/chat/provider';
import type { ChatProblem, Message, Thread } from '@/lib/chat/types';
import { usePeople } from '@/lib/people/provider';
import type { Seen } from '@/lib/people/types';
import { formatDateTime } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n/provider';
import { Composer } from './composer';

const CHECK_EVERY = 2500;
const NEAR_BOTTOM = 80;

export function ChatThread({ id }: { id: string }) {
  const { t } = useI18n();
  const { overview } = usePeople();
  const [reported, setReported] = useState(false);

  if (!overview) return <p role="status" className="gutter py-12 text-muted">{t.chat.loading}</p>;
  const person = overview.connected.find((item) => item.id === id);
  if (person) return <OpenThread person={person} reported={reported} onReported={() => setReported(true)} />;
  const blocked = overview.blocked.find((item) => item.id === id);
  const closed = blocked ?? overview.pastChats.find((item) => item.id === id);

  return (
    <div className="gutter py-12">
      <PageTitle focus title={t.chat.unavailableTitle} body={t.chat.unavailableBody} />
      {reported && <p role="status" className="mt-4 max-w-xl rounded-panel bg-surface p-4 text-sm leading-relaxed">{t.community.report.done}</p>}
      <div className="mt-6 flex flex-wrap gap-2.5">
        <ButtonLink href="/chats">{t.chat.back}</ButtonLink>
        {closed && <ReportButton id={id} name={blocked?.username ?? ''} canAttach={closed.chatted} onDone={() => setReported(true)} />}
      </div>
    </div>
  );
}

type Props = { person: Seen; reported: boolean; onReported: () => void };

function OpenThread({ person, reported, onReported }: Props) {
  const seen = person.profile;
  const { t } = useI18n();
  const words = t.chat;
  const id = person.id;
  const { act, getThread } = useChat();

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [more, setMore] = useState(false);
  const [theyOn, setTheyOn] = useState(true);
  const [problem, setProblem] = useState<ChatProblem | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const heightBefore = useRef<number | null>(null);
  const turn = useRef(0);
  const current = useRef<Message[] | null>(null);
  const readUpTo = useRef(0);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const reportDialog = useRef<HTMLDialogElement>(null);

  const show = useCallback((next: Message[], hasMore?: boolean) => {
    current.current = next;
    setMessages(next);
    if (hasMore !== undefined) setMore(hasMore);
  }, []);

  /** Joins the newest page onto what's on screen, dropping whatever was deleted. */
  const merge = useCallback((page: Thread) => {
    const { first } = page;
    const oldest = page.messages[0];
    if (first === null || !oldest) return show([], false);

    const had = current.current ?? [];
    const kept = had.filter((message) => message.seq >= first && message.seq < oldest.seq);
    const newestHad = had[had.length - 1]?.seq ?? 0;
    // So many arrived that they don't join up: start again from the newest page.
    if (page.more && newestHad < oldest.seq) return show(page.messages, true);

    const next = [...kept, ...page.messages];
    if (next.length === had.length && next.every((message, index) => message.seq === had[index]?.seq)) return;
    show(next, next[0]!.seq > first);
  }, [show]);

  const refresh = useCallback(async () => {
    const mine = ++turn.current;
    const result = await getThread(id);
    if (mine !== turn.current) return;
    setProblem(result.ok ? null : result.error);
    if (result.ok) {
      setTheyOn(result.value.theyOn);
      merge(result.value);
    }
  }, [id, getThread, merge]);

  const markRead = useCallback(() => {
    if (!atBottom.current || document.visibilityState !== 'visible') return;
    const newest = current.current?.findLast((message) => !message.mine)?.seq ?? 0;
    if (newest <= readUpTo.current) return;
    const before = readUpTo.current;
    readUpTo.current = newest;
    void act({ kind: 'read', personId: id, seq: newest }).then((result) => {
      if (!result.ok) readUpTo.current = before;
    });
  }, [id, act]);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      void refresh();
      markRead();
    };
    void refresh();
    const timer = setInterval(check, CHECK_EVERY);
    document.addEventListener('visibilitychange', check);
    return () => {
      turn.current += 1;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [refresh, markRead]);

  useLayoutEffect(() => {
    const box = scroller.current;
    if (!box || !messages) return;
    if (heightBefore.current !== null) {
      // Older messages were added above: keep the reader where they were.
      box.scrollTop += box.scrollHeight - heightBefore.current;
      heightBefore.current = null;
    } else if (atBottom.current) {
      box.scrollTop = box.scrollHeight;
    }
    markRead();
  }, [messages, markRead]);

  // A phone keyboard makes the list shorter. The newest message should stay in view.
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) box.scrollTop = box.scrollHeight;
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  async function earlier() {
    const oldest = current.current?.[0];
    if (!oldest) return;
    const result = await getThread(id, oldest.seq);
    if (!result.ok) return setProblem(result.error);
    const added = result.value.messages.filter((message) => message.seq < (current.current?.[0]?.seq ?? 0));
    if (added.length) heightBefore.current = scroller.current?.scrollHeight ?? null;
    show([...added, ...(current.current ?? [])], result.value.more);
  }

  async function send(requestId: string, text: string): Promise<ChatProblem | null> {
    const result = await act({ kind: 'send', personId: id, id: requestId, text });
    if (!result.ok) return result.error;
    atBottom.current = true;
    await refresh();
    return null;
  }

  async function deleteChat() {
    const result = await act({ kind: 'delete', personId: id });
    if (!result.ok) return setProblem(result.error);
    readUpTo.current = 0;
    show([], false);
    await refresh();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-line px-2 py-2 sm:px-4">
        <Link href="/chats" aria-label={words.back} className="grid size-11 shrink-0 place-items-center text-accent xl:hidden">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Link href={`/people/${id}`} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-control px-1">
          <Avatar profile={seen} className="size-10 text-lg" />
          <div className="min-w-0">
            <h1 className="truncate font-bold">{seen.username}</h1>
          </div>
        </Link>
        <Button variant="quiet" className="w-11 shrink-0 px-0!" aria-label={t.community.person.report} onClick={() => reportDialog.current?.showModal()}>
          <Flag className="size-5" aria-hidden />
        </Button>
        <Button variant="quiet" className="w-11 shrink-0 px-0!" aria-label={words.deleteChat} onClick={() => deleteDialog.current?.showModal()}>
          <Trash2 className="size-5" aria-hidden />
        </Button>
      </div>

      <div
        ref={scroller}
        role="log"
        aria-label={words.log}
        tabIndex={0}
        onScroll={(event) => {
          const box = event.currentTarget;
          atBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < NEAR_BOTTOM;
          markRead();
        }}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 -outline-offset-2 sm:px-6"
      >
        <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-muted">{words.safety}</p>
        {reported && <p role="status" className="mx-auto mt-3 max-w-sm rounded-panel bg-surface p-3 text-center text-sm leading-relaxed">{t.community.report.done}</p>}
        {more && (
          <div className="mt-2 text-center">
            <Button variant="quiet" className="text-sm" onClick={earlier}>{words.earlier}</Button>
          </div>
        )}
        {messages === null && <p className="mt-10 text-center text-muted">{words.loading}</p>}
        {messages?.length === 0 && <p className="mt-10 text-center text-muted">{words.noMessages}</p>}
        {messages && messages.length > 0 && <Bubbles messages={messages} name={seen.username} />}
      </div>

      {problem && <p role="alert" className="border-t border-line px-4 py-2 text-sm text-danger">{words.errors[problem]}</p>}
      {theyOn ? <Composer onSend={send} /> : <p role="status" className="border-t border-line px-4 py-4 text-sm text-muted">{words.errors.theyOff}</p>}

      <ReportDialog ref={reportDialog} id={id} name={seen.username} canAttach onDone={onReported} />
      <ConfirmDialog
        ref={deleteDialog}
        title={words.deleteTitle(seen.username)}
        body={words.deleteBody}
        confirm={words.deleteChat}
        cancel={t.community.person.keep}
        onConfirm={deleteChat}
      />
    </div>
  );
}

function Bubbles({ messages, name }: { messages: Message[]; name: string }) {
  const { t } = useI18n();
  const times = messages.map((message) => formatDateTime(message.at));

  return (
    <ol className="mt-3">
      {messages.map((message, index) => {
        const time = times[index]!;
        const next = messages[index + 1];
        const newDay = times[index - 1]?.slice(0, 10) !== time.slice(0, 10);
        const lastOfGroup = next?.mine !== message.mine || times[index + 1] !== time;
        return (
          <li key={message.seq} data-message className={lastOfGroup ? 'mb-3' : 'mb-1'}>
            {newDay && <p className="py-3 text-center text-xs text-muted">{time.slice(0, 10)}</p>}
            <div className={cn('flex flex-col', message.mine ? 'items-end' : 'items-start')}>
              <p
                dir="auto"
                className={cn(
                  'max-w-[82%] rounded-dialog px-3.5 py-2 leading-snug whitespace-pre-wrap [overflow-wrap:anywhere] sm:max-w-md',
                  message.mine ? 'bg-deep text-chalk' : 'bg-raised',
                )}
              >
                <span className="sr-only">{message.mine ? t.chat.you : name}: </span>
                {message.body}
              </p>
              {lastOfGroup && <p className="mt-1 px-1 text-xs text-muted">{time.slice(11)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
