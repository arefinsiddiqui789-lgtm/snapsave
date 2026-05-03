'use client';

import { useCallback, useState, useEffect } from 'react';
import { useNoteStore } from '@/store/note-store';
import { getTagColorClass, TemporaryDuration, formatDateTime } from '@/types/note';
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

    // Build friendly label
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
          content: `${activeNote.content}\n\n---\n✨ Summary:\n${data.summary}`,
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
                Priority
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
              <div className="space-y-2">
                {/* Preset buttons */}
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

                {/* Custom timer toggle */}
                <button
                  onClick={() => setShowCustomTimer(!showCustomTimer)}
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
                    showCustomTimer
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Settings2 className="h-2.5 w-2.5" />
                  Custom Time
                </button>

                {/* Custom time input */}
                {showCustomTimer && (
                  <div className="space-y-2 p-2.5 bg-secondary/30 rounded-lg border border-border/40">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold block mb-1">
                          Hours
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="720"
                          placeholder="0"
                          value={customHours}
                          onChange={(e) => setCustomHours(e.target.value.replace(/[^0-9]/g, ''))}
                          onKeyDown={handleCustomTimerKeyDown}
                          className="h-7 text-xs bg-background border-border/50 focus:border-primary/40 text-center"
                        />
                      </div>
                      <span className="text-muted-foreground/40 text-xs pb-1.5">:</span>
                      <div className="flex-1">
                        <label className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold block mb-1">
                          Minutes
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="30"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                          onKeyDown={handleCustomTimerKeyDown}
                          className="h-7 text-xs bg-background border-border/50 focus:border-primary/40 text-center"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-7 text-[11px] gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20"
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
            <div className="space-y-2 text-[11px]">
              <div className="bg-secondary/30 rounded-lg px-3 py-2">
                <div className="text-muted-foreground/60 text-[9px] uppercase tracking-wider font-semibold mb-0.5">Created</div>
                <div className="text-foreground/80 font-medium">{formatDateTime(activeNote.createdAt)}</div>
              </div>
              <div className="bg-secondary/30 rounded-lg px-3 py-2">
                <div className="text-muted-foreground/60 text-[9px] uppercase tracking-wider font-semibold mb-0.5">Last Modified</div>
                <div className="text-foreground/80 font-medium">{formatDateTime(activeNote.updatedAt)}</div>
              </div>
            </div>
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
