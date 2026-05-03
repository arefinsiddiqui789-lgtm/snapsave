'use client';

import { useCallback, useState, useEffect } from 'react';
import { useNoteStore } from '@/store/note-store';
import { getTagColorClass, TemporaryDuration, formatDateTime } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pin,
  Flame,
  Clock,
  Tag,
  Plus,
  X,
  Calendar,
  PanelRightClose,
  PanelRight,
  Sparkles,
  Timer,
  List,
  Tags,
  Loader2,
  Settings2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

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
  const rightPanelOpen = useNoteStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useNoteStore((s) => s.setRightPanelOpen);
  const isAiLoading = useNoteStore((s) => s.isAiLoading);
  const setIsAiLoading = useNoteStore((s) => s.setIsAiLoading);

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

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

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

  const handleCustomTimerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomTimer();
      }
    },
    [handleCustomTimer]
  );

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
      if (!res.ok) {
        toast.error('Failed to reach AI. Please try again.');
        return;
      }
      const data = await res.json();
      if (data.summary) {
        updateNote(activeNoteId!, {
          content: `${activeNote.content}\n\n---\n✨ Summary:\n${data.summary}`,
        });
        toast.success('Summary added!');
      } else {
        toast.error(data.error || 'Failed to summarize');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  }, [activeNote, activeNoteId, updateNote, setIsAiLoading]);

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
      if (!res.ok) {
        toast.error('Failed to reach AI. Please try again.');
        return;
      }
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
      <div className="flex flex-col items-center py-3 px-1.5 border-l border-border/60">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"
          onClick={() => setRightPanelOpen(true)}
          title="Open details"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!activeNote) {
    return (
      <div className="w-[240px] min-w-[240px] border-l border-border/60 bg-sidebar panel-transition flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-sm font-semibold font-[family-name:var(--font-title)] text-foreground/80">Details</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground/50"
            onClick={() => setRightPanelOpen(false)}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground/40 text-sm">
          No note selected
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
    <div className="w-[240px] min-w-[240px] border-l border-border/60 bg-sidebar panel-transition flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <span className="text-sm font-semibold font-[family-name:var(--font-title)] text-foreground/80">Details</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/50"
          onClick={() => setRightPanelOpen(false)}
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3.5 space-y-5">

          {/* Status — toggle switches feel */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Status</p>
            <div className="flex gap-2">
              <button
                onClick={() => togglePin(activeNote.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeNote.isPinned
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/15 dark:text-amber-400'
                    : 'bg-secondary/40 text-muted-foreground/60 hover:bg-secondary/70 hover:text-foreground'
                }`}
              >
                <Pin className="h-3 w-3" />
                {activeNote.isPinned ? 'Pinned' : 'Pin'}
              </button>
              <button
                onClick={() => toggleHighPriority(activeNote.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeNote.isHighPriority
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/15 dark:text-red-400'
                    : 'bg-secondary/40 text-muted-foreground/60 hover:bg-secondary/70 hover:text-foreground'
                }`}
              >
                <Flame className="h-3 w-3" />
                {activeNote.isHighPriority ? 'Priority' : 'Priority'}
              </button>
            </div>
          </div>

          {/* Self-Destruct */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              <Timer className="h-3 w-3 inline mr-1" />
              Self-Destruct
            </p>
            {activeNote.isTemporary && activeNote.expiresAt ? (
              <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/10 rounded-md px-3 py-2">
                <CountdownTimer expiresAt={activeNote.expiresAt} />
                <button
                  className="text-[10px] text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium"
                  onClick={() => {
                    removeTemporary(activeNote.id);
                    toast.success('Timer cancelled');
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {tempDurations.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => {
                        setTemporary(activeNote.id, d.key);
                        toast.success(`Self-destruct in ${d.label.toLowerCase()}`);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium bg-secondary/40 text-muted-foreground/60 hover:bg-secondary/70 hover:text-foreground transition-all"
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {d.short}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowCustomTimer(!showCustomTimer)}
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    showCustomTimer
                      ? 'bg-primary/8 text-primary'
                      : 'bg-secondary/40 text-muted-foreground/60 hover:bg-secondary/70 hover:text-foreground'
                  }`}
                >
                  <Settings2 className="h-2.5 w-2.5" />
                  Custom Time
                </button>

                {showCustomTimer && (
                  <div className="space-y-2 p-2.5 bg-secondary/20 rounded-md border border-border/30">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-[9px] text-muted-foreground/40 block mb-1">Hours</label>
                        <Input
                          type="number"
                          min="0"
                          max="720"
                          placeholder="0"
                          value={customHours}
                          onChange={(e) => setCustomHours(e.target.value.replace(/[^0-9]/g, ''))}
                          onKeyDown={handleCustomTimerKeyDown}
                          className="h-7 text-xs bg-background border-border/40 focus:border-primary/30 text-center"
                        />
                      </div>
                      <span className="text-muted-foreground/30 text-xs pb-1.5">:</span>
                      <div className="flex-1">
                        <label className="text-[9px] text-muted-foreground/40 block mb-1">Min</label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="30"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                          onKeyDown={handleCustomTimerKeyDown}
                          className="h-7 text-xs bg-background border-border/40 focus:border-primary/30 text-center"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-7 text-[11px] gap-1.5 bg-primary/8 text-primary hover:bg-primary/15 border border-primary/15"
                      variant="outline"
                      onClick={handleCustomTimer}
                    >
                      <Check className="h-3 w-3" />
                      Set Timer
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              <Tag className="h-3 w-3 inline mr-1" />
              Tags
            </p>
            {activeNote.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {activeNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer hover:opacity-75 transition-opacity ${getTagColorClass(tag)}`}
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
                className="h-7 text-xs bg-secondary/30 border-transparent focus:border-primary/30 placeholder:text-muted-foreground/35"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground/50 hover:text-primary hover:bg-primary/8"
                onClick={handleAddTag}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Timestamps — like a book's publication info */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              <Calendar className="h-3 w-3 inline mr-1" />
              Timeline
            </p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-muted-foreground/45">Created</span>
                <span className="text-foreground/65 font-medium">{formatDateTime(activeNote.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center px-0.5">
                <span className="text-muted-foreground/45">Modified</span>
                <span className="text-foreground/65 font-medium">{formatDateTime(activeNote.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* AI — clean, not flashy */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              <Sparkles className="h-3 w-3 inline mr-1" />
              AI
            </p>
            <div className="space-y-1.5">
              <button
                onClick={handleSummarize}
                disabled={isAiLoading || !activeNote.content.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 hover:bg-secondary/50 text-[11px] font-medium text-foreground/70 hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <List className="h-3 w-3" />}
                Summarize
              </button>
              <button
                onClick={handleSuggestTags}
                disabled={isAiLoading || !activeNote.content.trim()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 hover:bg-secondary/50 text-[11px] font-medium text-foreground/70 hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tags className="h-3 w-3" />}
                Auto-Tag
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
