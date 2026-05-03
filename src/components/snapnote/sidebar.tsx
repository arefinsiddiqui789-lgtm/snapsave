'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useNoteStore } from '@/store/note-store';
import { Note, getNoteTitle, getRelativeTime, getTagColorClass, groupNotesByDate, formatTime } from '@/types/note';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Pin,
  Flame,
  Clock,
  FileText,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const searchQuery = useNoteStore((s) => s.searchQuery);
  const setSearchQuery = useNoteStore((s) => s.setSearchQuery);
  const activeNoteId = useNoteStore((s) => s.activeNoteId);
  const setActiveNote = useNoteStore((s) => s.setActiveNote);
  const setCreateNoteDialogOpen = useNoteStore((s) => s.setCreateNoteDialogOpen);
  const sidebarOpen = useNoteStore((s) => s.sidebarOpen);
  const setSidebarOpen = useNoteStore((s) => s.setSidebarOpen);

  // Subscribe to raw data directly
  const notes = useNoteStore((s) => s.notes);

  // Compute filtered notes — just search + expired cleanup + sort
  const filteredNotes = useMemo(() => {
    let filtered: Note[] = [...notes];

    // Clean up expired notes
    const now = Date.now();
    filtered = filtered.filter(
      (note) => !note.isTemporary || !note.expiresAt || note.expiresAt > now
    );

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          note.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort: pinned first, then high priority, then by updatedAt
    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.isHighPriority !== b.isHighPriority) return a.isHighPriority ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

    return filtered;
  }, [notes, searchQuery]);

  const groupedNotes = useMemo(() => groupNotesByDate(filteredNotes), [filteredNotes]);

  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchQuery('');
        searchRef.current?.blur();
      }
    },
    [setSearchQuery]
  );

  // Focus search on Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-1.5 border-r border-border bg-sidebar">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mb-2 hover:bg-primary/10"
          onClick={() => setSidebarOpen(true)}
          title="Open sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Separator className="w-5 my-2" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/10"
          onClick={() => setCreateNoteDialogOpen(true)}
          title="New note (Ctrl+N)"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-border w-[300px] min-w-[300px] panel-transition">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight font-[family-name:var(--font-title)] leading-tight">
              SnapNote Pro
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(false)}
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search notes…"
            className="pl-8 h-8 text-sm bg-background/80 border-border/50 focus:border-primary/40 focus:bg-background transition-colors"
            value={searchQuery}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <Separator className="mx-3" />

      {/* Notes list */}
      <ScrollArea className="flex-1">
        <div className="py-1.5 px-1.5">
          {Object.keys(groupedNotes).length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <FileText className="h-7 w-7 opacity-30" />
              </div>
              <p className="text-sm font-medium">No notes found</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {searchQuery ? 'Try a different search' : 'Create your first note'}
              </p>
            </div>
          )}

          {Object.entries(groupedNotes).map(([dateLabel, dateNotes]) => (
            <div key={dateLabel}>
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {dateLabel}
                </span>
              </div>
              {dateNotes.map((note) => {
                const title = getNoteTitle(note);
                const isActive = note.id === activeNoteId;

                return (
                  <button
                    key={note.id}
                    onClick={() => setActiveNote(note.id)}
                    className={`note-item w-full text-left px-3 py-2.5 rounded-lg mb-0.5 relative transition-colors ${
                      isActive ? 'active' : ''
                    } ${note.isHighPriority && !isActive ? 'priority-glow' : ''} ${
                      note.isPinned && !isActive ? 'pin-glow' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Note Name */}
                        <div className="flex items-center gap-1.5">
                          {note.isPinned && (
                            <Pin className="h-2.5 w-2.5 text-amber-500 shrink-0 fill-amber-500" />
                          )}
                          {note.isHighPriority && (
                            <Flame className="h-2.5 w-2.5 text-destructive shrink-0" />
                          )}
                          {note.isTemporary && (
                            <Clock className="h-2.5 w-2.5 text-orange-500 shrink-0 countdown-pulse" />
                          )}
                          <span className={`text-[13px] font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {title}
                          </span>
                        </div>
                        {note.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {note.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex px-1.5 py-0 rounded text-[9px] font-medium leading-4 ${getTagColorClass(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-[9px] text-muted-foreground/50">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-0.5 tabular-nums text-right leading-tight">
                        <span className="block">{getRelativeTime(note.updatedAt)}</span>
                        <span className="block text-[9px] text-muted-foreground/30">{formatTime(note.updatedAt)}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* New Note button */}
      <div className="p-3 border-t border-border/60">
        <Button
          onClick={() => setCreateNoteDialogOpen(true)}
          className="w-full h-9 text-sm font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Note
          <kbd className="ml-auto text-[9px] opacity-50 pointer-events-none">⌘N</kbd>
        </Button>
      </div>
    </div>
  );
}
