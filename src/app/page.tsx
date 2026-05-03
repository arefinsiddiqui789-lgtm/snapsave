'use client';

import { useEffect, useCallback, useState } from 'react';
import { useNoteStore } from '@/store/note-store';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/snapnote/sidebar';
import { Editor } from '@/components/snapnote/editor';
import { RightPanel } from '@/components/snapnote/right-panel';
import { CreateNoteDialog } from '@/components/snapnote/create-note-dialog';
import { AuthScreen } from '@/components/snapnote/auth-screen';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Moon,
  Sun,
  PanelLeft,
  PanelRight,
  Plus,
  LogOut,
  FileText,
  PenLine,
  Settings2,
  Search,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type MobileTab = 'notes' | 'editor' | 'details';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const setCreateNoteDialogOpen = useNoteStore((s) => s.setCreateNoteDialogOpen);
  const activeNoteId = useNoteStore((s) => s.activeNoteId);
  const notes = useNoteStore((s) => s.notes);
  const cleanupExpiredNotes = useNoteStore((s) => s.cleanupExpiredNotes);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [authReady, setAuthReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('notes');

  // Wait for auth store to hydrate from localStorage
  useEffect(() => {
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Cleanup expired notes periodically
  useEffect(() => {
    cleanupExpiredNotes();
    const interval = setInterval(cleanupExpiredNotes, 30000);
    return () => clearInterval(interval);
  }, [cleanupExpiredNotes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setCreateNoteDialogOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (activeNoteId) {
          const { togglePin } = useNoteStore.getState();
          togglePin(activeNoteId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCreateNoteDialogOpen, activeNoteId]);

  // When a note is selected, auto-switch to editor tab on mobile
  useEffect(() => {
    if (isMobile && activeNoteId && mobileTab === 'notes') {
      setMobileTab('editor');
    }
  }, [activeNoteId, isMobile, mobileTab]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Show loading while auth hydrates
  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // ========== MOBILE LAYOUT — Native App Feel ==========
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
        {/* Status bar area — thin, app-like */}
        <div className="flex items-center justify-between px-4 pt-2 pb-1 bg-background/95 backdrop-blur-md z-20 safe-top">
          <h1 className="text-[15px] font-bold font-[family-name:var(--font-title)] text-foreground">
            SnapNote Pro
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground active:text-foreground active:bg-secondary/60 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Main content area — full screen between status bar and bottom nav */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {/* Notes Tab — Full screen notes list */}
            {mobileTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                <MobileNotesList />
              </motion.div>
            )}

            {/* Editor Tab */}
            {mobileTab === 'editor' && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: mobileTab === 'notes' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                <Editor />
              </motion.div>
            )}

            {/* Details Tab */}
            {mobileTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 overflow-auto"
              >
                <MobileDetailsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Button — New Note */}
        <button
          onClick={() => setCreateNoteDialogOpen(true)}
          className="absolute right-5 bottom-[76px] z-30 h-14 w-14 rounded-full bg-primary shadow-lg shadow-primary/25 active:scale-90 transition-transform flex items-center justify-center"
        >
          <Plus className="h-6 w-6 text-primary-foreground" />
        </button>

        {/* Bottom Tab Bar — Native app navigation */}
        <div className="bg-background/95 backdrop-blur-md border-t border-border/50 safe-bottom z-20">
          <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
            <button
              onClick={() => setMobileTab('notes')}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-colors ${
                mobileTab === 'notes'
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Notes</span>
            </button>

            <button
              onClick={() => setMobileTab('editor')}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-colors ${
                mobileTab === 'editor'
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <PenLine className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Edit</span>
            </button>

            <button
              onClick={() => setMobileTab('details')}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-colors ${
                mobileTab === 'details'
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <Settings2 className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Details</span>
            </button>
          </div>
          {/* Active tab indicator */}
          <div className="relative h-0.5 mx-4 mb-1">
            <motion.div
              className="absolute h-0.5 rounded-full bg-primary"
              initial={false}
              animate={{
                left: mobileTab === 'notes' ? '0%' : mobileTab === 'editor' ? '33.33%' : '66.66%',
                width: '33.33%',
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>

        {/* Create Note Dialog */}
        <CreateNoteDialog />
      </div>
    );
  }

  // ========== DESKTOP LAYOUT — Unchanged ==========
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main editor */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top bar with theme toggle */}
        <div className="absolute top-2 right-3 z-10 flex items-center gap-1">
          {authUser && (
            <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">
              {authUser.username}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => {
              logout();
              toast.success('Logged out');
            }}
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Editor />
      </div>

      {/* Right panel */}
      <RightPanel />

      {/* Create Note Dialog */}
      <CreateNoteDialog />
    </div>
  );
}

// ========== Mobile Sub-Components ==========

function MobileNotesList() {
  const searchQuery = useNoteStore((s) => s.searchQuery);
  const setSearchQuery = useNoteStore((s) => s.setSearchQuery);
  const activeNoteId = useNoteStore((s) => s.activeNoteId);
  const setActiveNote = useNoteStore((s) => s.setActiveNote);
  const notes = useNoteStore((s) => s.notes);
  const setCreateNoteDialogOpen = useNoteStore((s) => s.setCreateNoteDialogOpen);

  const filteredNotes = useMemo(() => {
    let filtered: Note[] = [...notes];
    const now = Date.now();
    filtered = filtered.filter(
      (note) => !note.isTemporary || !note.expiresAt || note.expiresAt > now
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          note.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.isHighPriority !== b.isHighPriority) return a.isHighPriority ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    return filtered;
  }, [notes, searchQuery]);

  const groupedNotes = useMemo(() => groupNotesByDate(filteredNotes), [filteredNotes]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search bar */}
      <div className="px-4 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search notes…"
            className="w-full h-10 pl-10 pr-4 text-sm bg-secondary/50 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:text-foreground"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-auto px-3 pb-4">
        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-base font-semibold text-foreground">No notes yet</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Try a different search' : 'Tap + to create your first note'}
            </p>
          </div>
        )}

        {Object.entries(groupedNotes).map(([dateLabel, dateNotes]) => (
          <div key={dateLabel}>
            <div className="px-1 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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
                  className={`w-full text-left px-4 py-3.5 rounded-2xl mb-2 transition-all active:scale-[0.98] ${
                    isActive
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-card border border-border/30 active:bg-secondary/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {note.isPinned && (
                          <Pin className="h-3 w-3 text-amber-500 shrink-0 fill-amber-500" />
                        )}
                        {note.isHighPriority && (
                          <Flame className="h-3 w-3 text-red-500 shrink-0" />
                        )}
                        {note.isTemporary && (
                          <Clock className="h-3 w-3 text-orange-400 shrink-0 countdown-pulse" />
                        )}
                        <span className={`text-[15px] font-semibold truncate leading-snug ${
                          isActive ? 'text-primary' : 'text-foreground'
                        }`}>
                          {title}
                        </span>
                      </div>
                      {/* Content preview */}
                      {note.content.trim() && (
                        <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {note.content.trim().slice(0, 100)}
                        </p>
                      )}
                      {note.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getTagColorClass(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                      {getRelativeTime(note.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Developer credit at bottom of notes list */}
      <div className="text-center py-2 border-t border-border/30">
        <p className="text-[10px] font-medium text-foreground">
          Developed By Arefin Siddiqui
        </p>
        <p className="text-[9px] text-muted-foreground mt-0.5">
          Studying in CSE at IUB
        </p>
      </div>
    </div>
  );
}

function MobileDetailsPanel() {
  const activeNoteId = useNoteStore((s) => s.activeNoteId);
  const activeNote = useNoteStore((s) => s.notes.find((n) => n.id === s.activeNoteId));
  const addTag = useNoteStore((s) => s.addTag);
  const removeTag = useNoteStore((s) => s.removeTag);
  const togglePin = useNoteStore((s) => s.togglePin);
  const toggleHighPriority = useNoteStore((s) => s.toggleHighPriority);
  const setTemporary = useNoteStore((s) => s.setTemporary);
  const setTemporaryCustom = useNoteStore((s) => s.setTemporaryCustom);
  const removeTemporary = useNoteStore((s) => s.removeTemporary);
  const updateNote = useNoteStore((s) => s.updateNote);
  const isAiLoading = useNoteStore((s) => s.isAiLoading);
  const setIsAiLoading = useNoteStore((s) => s.setIsAiLoading);
  const logout = useAuthStore((s) => s.logout);

  const [newTag, setNewTag] = useState('');
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');

  const handleAddTag = useCallback(() => {
    if (!activeNoteId || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (activeNote?.tags.includes(tag)) {
      toast.error('Tag already exists');
      return;
    }
    addTag(activeNoteId, tag);
    setNewTag('');
    toast.success(`Tag "${tag}" added`);
  }, [activeNoteId, activeNote, newTag, addTag]);

  const handleCustomTimer = useCallback(() => {
    if (!activeNoteId) return;
    const hours = parseInt(customHours || '0', 10) || 0;
    const minutes = parseInt(customMinutes || '0', 10) || 0;
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      toast.error('Enter a valid time (at least 1 minute)');
      return;
    }
    if (totalMinutes > 43200) {
      toast.error('Maximum duration is 30 days');
      return;
    }
    const ms = totalMinutes * 60 * 1000;
    setTemporaryCustom(activeNoteId, ms);
    let label = '';
    if (hours > 0) label += `${hours} hour${hours > 1 ? 's' : ''}`;
    if (hours > 0 && minutes > 0) label += ' ';
    if (minutes > 0) label += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    toast.success(`Self-destruct in ${label}`);
    setShowCustomTimer(false);
    setCustomHours('');
    setCustomMinutes('');
  }, [activeNoteId, customHours, customMinutes, setTemporaryCustom]);

  const handleSummarize = useCallback(async () => {
    if (!activeNote?.content.trim()) {
      toast.error('Write something first');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNote.content }),
      });
      if (!res.ok) { toast.error('Failed to reach AI'); return; }
      const data = await res.json();
      if (data.summary) {
        updateNote(activeNoteId!, { content: `${activeNote.content}\n\n---\n✨ Summary:\n${data.summary}` });
        toast.success('Summary added!');
      } else { toast.error(data.error || 'Failed to summarize'); }
    } catch { toast.error('Something went wrong'); }
    finally { setIsAiLoading(false); }
  }, [activeNote, activeNoteId, updateNote, setIsAiLoading]);

  const handleSuggestTags = useCallback(async () => {
    if (!activeNote?.content.trim()) { toast.error('Write something first'); return; }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNote.content }),
      });
      if (!res.ok) { toast.error('Failed to reach AI'); return; }
      const data = await res.json();
      if (data.tags && Array.isArray(data.tags)) {
        let added = 0;
        data.tags.forEach((tag: string) => {
          if (!activeNote.tags.includes(tag)) { addTag(activeNoteId!, tag); added++; }
        });
        toast.success(`Added ${added} tag${added !== 1 ? 's' : ''}`);
      } else { toast.error(data.error || 'Failed to suggest tags'); }
    } catch { toast.error('Something went wrong'); }
    finally { setIsAiLoading(false); }
  }, [activeNote, activeNoteId, addTag, setIsAiLoading]);

  const tempDurations: { key: TemporaryDuration; label: string; short: string }[] = [
    { key: '10min', label: '10 Minutes', short: '10m' },
    { key: '1hour', label: '1 Hour', short: '1h' },
    { key: '1day', label: '1 Day', short: '1d' },
  ];

  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-8">
        <FileText className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-base font-semibold text-foreground">No note selected</p>
        <p className="text-sm mt-1">Go to Notes tab and pick one</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto px-4 py-4 space-y-5">
        {/* Status toggles — large, touch-friendly */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
          <div className="flex gap-3">
            <button
              onClick={() => togglePin(activeNote.id)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                activeNote.isPinned
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/15 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                  : 'bg-secondary/40 text-muted-foreground border border-border/30'
              }`}
            >
              <Pin className="h-4 w-4" />
              {activeNote.isPinned ? 'Pinned' : 'Pin'}
            </button>
            <button
              onClick={() => toggleHighPriority(activeNote.id)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                activeNote.isHighPriority
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/15 dark:text-red-400 border border-red-200 dark:border-red-800/30'
                  : 'bg-secondary/40 text-muted-foreground border border-border/30'
              }`}
            >
              <Flame className="h-4 w-4" />
              {activeNote.isHighPriority ? 'Priority' : 'Priority'}
            </button>
          </div>
        </div>

        {/* Self-Destruct */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Timer className="h-3.5 w-3.5 inline mr-1" />
            Self-Destruct
          </p>
          {activeNote.isTemporary && activeNote.expiresAt ? (
            <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/10 rounded-2xl px-4 py-3 border border-orange-200 dark:border-orange-800/30">
              <CountdownTimer expiresAt={activeNote.expiresAt} />
              <button
                className="text-sm text-orange-600 dark:text-orange-400 font-semibold active:text-orange-700"
                onClick={() => { removeTemporary(activeNote.id); toast.success('Timer cancelled'); }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {tempDurations.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => { setTemporary(activeNote.id, d.key); toast.success(`Self-destruct in ${d.label.toLowerCase()}`); }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-sm font-semibold bg-secondary/40 text-muted-foreground border border-border/30 active:scale-95 active:bg-secondary/70 transition-all"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {d.short}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCustomTimer(!showCustomTimer)}
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                  showCustomTimer
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-secondary/40 text-muted-foreground border border-border/30'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Custom Time
              </button>
              {showCustomTimer && (
                <div className="space-y-3 p-4 bg-secondary/20 rounded-2xl border border-border/30">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground block mb-1.5 font-semibold">Hours</label>
                      <input
                        type="number" min="0" max="720" placeholder="0"
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value.replace(/[^0-9]/g, ''))}
                        className="h-10 text-sm bg-background border border-border/40 rounded-xl px-3 text-center w-full outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <span className="text-muted-foreground text-lg pb-2">:</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground block mb-1.5 font-semibold">Min</label>
                      <input
                        type="number" min="0" max="59" placeholder="30"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                        className="h-10 text-sm bg-background border border-border/40 rounded-xl px-3 text-center w-full outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCustomTimer}
                    className="w-full h-10 text-sm font-semibold gap-2 bg-primary/10 text-primary border border-primary/20 rounded-2xl active:scale-95 transition-transform"
                  >
                    <Check className="h-4 w-4 inline mr-1" />
                    Set Timer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Tag className="h-3.5 w-3.5 inline mr-1" />
            Tags
          </p>
          {activeNote.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {activeNote.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer active:opacity-60 transition-opacity ${getTagColorClass(tag)}`}
                  onClick={() => { removeTag(activeNote.id, tag); toast.success(`Tag "${tag}" removed`); }}
                >
                  {tag}
                  <X className="h-3 w-3" />
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              placeholder="Add tag…"
              className="flex-1 h-10 px-3 text-sm bg-secondary/30 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground text-foreground"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
            />
            <button
              className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary active:scale-90 transition-transform flex items-center justify-center"
              onClick={handleAddTag}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 inline mr-1" />
            Timeline
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center px-1">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground font-medium">{formatDateTime(activeNote.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-muted-foreground">Modified</span>
              <span className="text-foreground font-medium">{formatDateTime(activeNote.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* AI */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 inline mr-1" />
            AI Tools
          </p>
          <div className="space-y-2">
            <button
              onClick={handleSummarize}
              disabled={isAiLoading || !activeNote.content.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-secondary/30 border border-border/30 text-sm font-semibold text-foreground active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <List className="h-4 w-4" />}
              Summarize
            </button>
            <button
              onClick={handleSuggestTags}
              disabled={isAiLoading || !activeNote.content.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-secondary/30 border border-border/30 text-sm font-semibold text-foreground active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tags className="h-4 w-4" />}
              Auto-Tag
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <button
            onClick={() => { logout(); toast.success('Logged out'); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm font-semibold text-destructive active:scale-95 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// Countdown timer component for mobile
function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        const { cleanupExpiredNotes } = useNoteStore.getState();
        cleanupExpiredNotes();
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      else if (minutes > 0) setTimeLeft(`${minutes}m ${seconds}s`);
      else setTimeLeft(`${seconds}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="text-orange-600 dark:text-orange-400 font-mono text-sm font-semibold countdown-pulse">
      {timeLeft}
    </span>
  );
}

// Re-export types/utils needed by mobile components
import { useMemo } from 'react';
import { Note, getNoteTitle, getRelativeTime, getTagColorClass, groupNotesByDate, TemporaryDuration, formatDateTime } from '@/types/note';
import {
  Pin,
  Flame,
  Clock,
  FileText,
  Tag,
  Plus,
  X,
  Calendar,
  Sparkles,
  Timer,
  List,
  Tags,
  Loader2,
  Settings2,
  Check,
  LogOut,
} from 'lucide-react';
