'use client';

import { useCallback, useState, useEffect } from 'react';
import { useNoteStore } from '@/store/note-store';
import { getRelativeTime, getTagColorClass, TemporaryDuration } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pin,
  Flame,
  Clock,
  Tag,
  Plus,
  X,
  Calendar,
  History,
  RotateCcw,
  PanelRightClose,
  PanelRight,
  Sparkles,
  Timer,
  Wand2,
  List,
  Tags,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="text-orange-600 dark:text-orange-400 font-mono text-xs countdown-pulse">
      {timeLeft}
    </span>
  );
}

export function RightPanel() {
  const {
    activeNoteId,
    notes,
    addTag,
    removeTag,
    togglePin,
    toggleHighPriority,
    setTemporary,
    removeTemporary,
    restoreVersion,
    updateNote,
    rightPanelOpen,
    setRightPanelOpen,
    isAiLoading,
    setIsAiLoading,
  } = useNoteStore();

  const [newTag, setNewTag] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId);

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

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // AI Improve
  const handleImprove = useCallback(async () => {
    if (!activeNote?.content.trim()) {
      toast.error('Write something first');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNote.content }),
      });
      const data = await res.json();
      if (data.improved) {
        updateNote(activeNoteId!, { content: data.improved });
        toast.success('Note improved by AI');
      } else {
        toast.error(data.error || 'Failed to improve');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsAiLoading(false);
    }
  }, [activeNote, activeNoteId, updateNote, setIsAiLoading]);

  // AI Summarize
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
      const data = await res.json();
      if (data.summary) {
        updateNote(activeNoteId!, {
          content: `${activeNote.content}\n\n---\n📝 **AI Summary:**\n${data.summary}`,
        });
        toast.success('Summary added');
      } else {
        toast.error(data.error || 'Failed to summarize');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsAiLoading(false);
    }
  }, [activeNote, activeNoteId, updateNote, setIsAiLoading]);

  // AI Suggest Tags
  const handleSuggestTags = useCallback(async () => {
    if (!activeNote?.content.trim()) {
      toast.error('Write something first');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNote.content }),
      });
      const data = await res.json();
      if (data.tags && Array.isArray(data.tags)) {
        let added = 0;
        data.tags.forEach((tag: string) => {
          if (!activeNote.tags.includes(tag)) {
            addTag(activeNoteId!, tag);
            added++;
          }
        });
        toast.success(`Added ${added} tag${added !== 1 ? 's' : ''}`);
      } else {
        toast.error(data.error || 'Failed to suggest tags');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsAiLoading(false);
    }
  }, [activeNote, activeNoteId, addTag, setIsAiLoading]);

  if (!rightPanelOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-1.5 border-l border-border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/10"
          onClick={() => setRightPanelOpen(true)}
          title="Open details panel"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!activeNote) {
    return (
      <div className="w-[260px] min-w-[260px] border-l border-border bg-sidebar panel-transition flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <span className="text-sm font-semibold font-[family-name:var(--font-title)]">Details</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setRightPanelOpen(false)}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a note
        </div>
      </div>
    );
  }

  const tempDurations: { key: TemporaryDuration; label: string; short: string }[] = [
    { key: '10min', label: '10 Minutes', short: '10m' },
    { key: '1hour', label: '1 Hour', short: '1h' },
    { key: '1day', label: '1 Day', short: '1d' },
  ];

  return (
    <div className="w-[260px] min-w-[260px] border-l border-border bg-sidebar panel-transition flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-sm font-semibold font-[family-name:var(--font-title)]">Details</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => setRightPanelOpen(false)}
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Status
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => togglePin(activeNote.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                  activeNote.isPinned
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Pin className="h-3 w-3" />
                {activeNote.isPinned ? 'Pinned' : 'Pin'}
              </button>
              <button
                onClick={() => toggleHighPriority(activeNote.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                  activeNote.isHighPriority
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Flame className="h-3 w-3" />
                {activeNote.isHighPriority ? 'Priority' : 'Priority'}
              </button>
            </div>
          </div>

          <Separator />

          {/* Self-Destruct Timer */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Timer className="h-3 w-3 inline mr-1" />
              Self-Destruct
            </h4>
            {activeNote.isTemporary && activeNote.expiresAt ? (
              <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2.5">
                <CountdownTimer expiresAt={activeNote.expiresAt} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-orange-600 dark:text-orange-400 hover:text-orange-800 px-2"
                  onClick={() => {
                    removeTemporary(activeNote.id);
                    toast.success('Timer cancelled');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                {tempDurations.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => {
                      setTemporary(activeNote.id, d.key);
                      toast.success(`Self-destruct in ${d.label.toLowerCase()}`);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {d.short}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Tag className="h-3 w-3 inline mr-1" />
              Tags
            </h4>
            {activeNote.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {activeNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${getTagColorClass(tag)}`}
                    onClick={() => {
                      removeTag(activeNote.id, tag);
                      toast.success(`Tag "${tag}" removed`);
                    }}
                  >
                    {tag}
                    <X className="h-2 w-2" />
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                placeholder="Add tag…"
                className="h-7 text-xs bg-background border-border/50 focus:border-primary/40"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 hover:bg-primary/10"
                onClick={handleAddTag}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Calendar className="h-3 w-3 inline mr-1" />
              Timestamps
            </h4>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="tabular-nums">{getRelativeTime(activeNote.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Modified</span>
                <span className="tabular-nums">{getRelativeTime(activeNote.updatedAt)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Version History */}
          <div className="space-y-2">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowHistory(!showHistory)}
            >
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                <History className="h-3 w-3 inline mr-1" />
                History ({activeNote.versions.length})
              </h4>
              <motion.div animate={{ rotate: showHistory ? 180 : 0 }}>
                <svg
                  className="h-3 w-3 text-muted-foreground/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.div>
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {activeNote.versions.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/40 py-1">
                      No previous versions yet
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {[...activeNote.versions].reverse().map((version) => (
                        <button
                          key={version.id}
                          onClick={() => {
                            restoreVersion(activeNote.id, version.id);
                            toast.success('Version restored');
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/70 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {getRelativeTime(version.savedAt)}
                            </span>
                            <RotateCcw className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-1">
                            {version.title || version.content.slice(0, 40) || 'Empty note'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* AI Actions */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Sparkles className="h-3 w-3 inline mr-1" />
              AI Assistant
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={handleImprove}
                disabled={isAiLoading || !activeNote.content.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-[11px] font-medium text-primary/80 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isAiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                Improve Writing
              </button>
              <button
                onClick={handleSummarize}
                disabled={isAiLoading || !activeNote.content.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-[11px] font-medium text-primary/80 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isAiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <List className="h-3 w-3" />
                )}
                Summarize
              </button>
              <button
                onClick={handleSuggestTags}
                disabled={isAiLoading || !activeNote.content.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-[11px] font-medium text-primary/80 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isAiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Tags className="h-3 w-3" />
                )}
                Auto-Tag
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
