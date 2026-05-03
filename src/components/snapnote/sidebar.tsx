'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNoteStore } from '@/store/note-store';
import { getNoteTitle, getNotePreview, getRelativeTime, getTagColorClass, groupNotesByDate } from '@/types/note';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Pin,
  Flame,
  Clock,
  Tag,
  FileText,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar() {
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedTag,
    setSelectedTag,
    activeNoteId,
    setActiveNote,
    createNote,
    getFilteredNotes,
    getAllTags,
    notes,
    sidebarOpen,
    setSidebarOpen,
  } = useNoteStore();

  const searchRef = useRef<HTMLInputElement>(null);
  const filteredNotes = getFilteredNotes();
  const allTags = getAllTags();
  const groupedNotes = groupNotesByDate(filteredNotes);

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

  const filters: { key: typeof activeFilter; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'all', label: 'All', icon: <FileText className="h-3 w-3" />, count: notes.length },
    { key: 'pinned', label: 'Pinned', icon: <Pin className="h-3 w-3" />, count: notes.filter(n => n.isPinned).length },
    { key: 'high-priority', label: 'Priority', icon: <Flame className="h-3 w-3" />, count: notes.filter(n => n.isHighPriority).length },
    { key: 'temporary', label: 'Temp', icon: <Clock className="h-3 w-3" />, count: notes.filter(n => n.isTemporary).length },
    { key: 'tags', label: 'Tags', icon: <Tag className="h-3 w-3" /> },
  ];

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
          onClick={() => createNote()}
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

      {/* Filters */}
      <div className="px-3 pb-2">
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setActiveFilter(f.key);
                if (f.key !== 'tags') setSelectedTag(null);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                activeFilter === f.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
              {f.count !== undefined && f.count > 0 && (
                <span className={`ml-0.5 text-[9px] ${activeFilter === f.key ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      <AnimatePresence>
        {activeFilter === 'tags' && allTags.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                    selectedTag === tag
                      ? getTagColorClass(tag)
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {activeFilter === 'tags' && allTags.length === 0 && (
          <div className="px-3 pb-2">
            <p className="text-[11px] text-muted-foreground/50">No tags yet. Add tags to your notes.</p>
          </div>
        )}
      </AnimatePresence>

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
                const preview = getNotePreview(note.content);
                const isActive = note.id === activeNoteId;

                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <button
                      onClick={() => setActiveNote(note.id)}
                      className={`note-item w-full text-left px-3 py-2.5 rounded-lg mb-0.5 relative transition-all ${
                        isActive ? 'active' : ''
                      } ${note.isHighPriority && !isActive ? 'priority-glow' : ''} ${
                        note.isPinned && !isActive ? 'pin-glow' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
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
                            <span className={`text-[13px] font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                              {title}
                            </span>
                          </div>
                          {preview && (
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1 pl-0">
                              {preview}
                            </p>
                          )}
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
                        <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-0.5 tabular-nums">
                          {getRelativeTime(note.updatedAt)}
                        </span>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* New Note button */}
      <div className="p-3 border-t border-border/60">
        <Button
          onClick={() => createNote()}
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
