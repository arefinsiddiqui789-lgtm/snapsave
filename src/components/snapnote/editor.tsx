'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useNoteStore } from '@/store/note-store';
import { formatDateTime, formatTime, formatDate } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pin,
  Flame,
  Clock,
  Copy,
  Trash2,
  Sparkles,
  Minimize2,
  Maximize2,
  Check,
  Wand2,
  List,
  Tags,
  Save,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function Editor() {
  const activeNoteId = useNoteStore((s) => s.activeNoteId);
  const activeNote = useNoteStore((s) => s.notes.find((n) => n.id === s.activeNoteId));
  const updateNote = useNoteStore((s) => s.updateNote);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const togglePin = useNoteStore((s) => s.togglePin);
  const toggleHighPriority = useNoteStore((s) => s.toggleHighPriority);
  const setCreateNoteDialogOpen = useNoteStore((s) => s.setCreateNoteDialogOpen);
  const setIsAiLoading = useNoteStore((s) => s.setIsAiLoading);
  const isAiLoading = useNoteStore((s) => s.isAiLoading);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Local state for fast typing — avoids store re-renders on every keystroke
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const isLocalEdit = useRef(false);

  // Sync local state when active note changes
  useEffect(() => {
    if (activeNote) {
      // Only sync if not currently editing (prevents cursor jump)
      if (!isLocalEdit.current) {
        setLocalTitle(activeNote.title);
        setLocalContent(activeNote.content);
      }
      setLastSavedAt(activeNote.updatedAt);
      // Auto-focus title on new empty note
      if (!activeNote.content.trim() && !activeNote.title.trim()) {
        setTimeout(() => titleRef.current?.focus(), 150);
      }
    }
    isLocalEdit.current = false;
  }, [activeNoteId]);

  // Auto-save with debounce — writes to store
  const triggerAutoSave = useCallback(
    (field: 'title' | 'content', value: string) => {
      if (!activeNoteId) return;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        isLocalEdit.current = true; // prevent sync from overwriting
        updateNote(activeNoteId, { [field]: value });
        const now = Date.now();
        setLastSavedAt(now);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      }, 300);
    },
    [activeNoteId, updateNote]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalTitle(val);
      triggerAutoSave('title', val);
      // Auto-resize
      const target = e.target;
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
    },
    [triggerAutoSave]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalContent(val);
      triggerAutoSave('content', val);
    },
    [triggerAutoSave]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Auto-resize title on mount / note switch
  useEffect(() => {
    if (titleRef.current && activeNote) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [activeNoteId]); // only re-run on note switch

  // Copy note content
  const handleCopy = useCallback(async () => {
    if (!activeNote) return;
    const text = `${activeNote.title}\n\n${activeNote.content}`;
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, [activeNote]);

  // Delete note
  const handleDelete = useCallback(() => {
    if (!activeNoteId) return;
    deleteNote(activeNoteId);
    toast.success('Note deleted');
  }, [activeNoteId, deleteNote]);

  // AI Improve
  const handleImprove = useCallback(async () => {
    if (!localContent.trim()) {
      toast.error('Write something first');
      return;
    }
    setIsAiLoading(true);
    setShowAIPanel(true);
    try {
      const res = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: localContent }),
      });
      const data = await res.json();
      if (data.improved) {
        isLocalEdit.current = true;
        setLocalContent(data.improved);
        updateNote(activeNoteId!, { content: data.improved });
        toast.success('Note improved by AI');
      } else {
        toast.error(data.error || 'Failed to improve note');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsAiLoading(false);
    }
  }, [localContent, activeNoteId, updateNote, setIsAiLoading]);

  // AI Summarize
  const handleSummarize = useCallback(async () => {
    if (!localContent.trim()) {
      toast.error('Write something first');
      return;
    }
    setIsAiLoading(true);
    setShowAIPanel(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: localContent }),
      });
      const data = await res.json();
      if (data.summary) {
        const newContent = `${localContent}\n\n---\n📝 **AI Summary:**\n${data.summary}`;
        isLocalEdit.current = true;
        setLocalContent(newContent);
        updateNote(activeNoteId!, { content: newContent });
        toast.success('Summary added');
      } else {
        toast.error(data.error || 'Failed to summarize');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsAiLoading(false);
    }
  }, [localContent, activeNoteId, updateNote, setIsAiLoading]);

  // AI Suggest Tags
  const handleSuggestTags = useCallback(async () => {
    if (!localContent.trim()) {
      toast.error('Write something first');
      return;
    }
    setIsAiLoading(true);
    setShowAIPanel(true);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: localContent }),
      });
      const data = await res.json();
      if (data.tags && Array.isArray(data.tags)) {
        const { addTag } = useNoteStore.getState();
        const currentNote = useNoteStore.getState().notes.find((n) => n.id === activeNoteId);
        let added = 0;
        data.tags.forEach((tag: string) => {
          if (currentNote && !currentNote.tags.includes(tag)) {
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
  }, [localContent, activeNoteId, setIsAiLoading]);

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md px-6"
        >
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Sparkles className="h-12 w-12 text-primary/30" />
          </div>
          <h2 className="text-2xl font-bold text-foreground/90 font-[family-name:var(--font-title)]">
            Welcome to SnapNote Pro
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Your intelligent note-taking companion. Capture thoughts instantly, organize automatically, and retrieve effortlessly.
          </p>
          <Button
            onClick={() => setCreateNoteDialogOpen(true)}
            className="mt-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all active:scale-[0.97]"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Create Your First Note
          </Button>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground/40">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl+N</kbd>
              New note
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl+F</kbd>
              Search
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full bg-background ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={<Pin className={`h-3.5 w-3.5 ${activeNote.isPinned ? 'text-amber-500 fill-amber-500' : ''}`} />}
            onClick={() => togglePin(activeNote.id)}
            title={activeNote.isPinned ? 'Unpin' : 'Pin (Ctrl+Shift+P)'}
            active={activeNote.isPinned}
          />
          <ToolbarButton
            icon={<Flame className={`h-3.5 w-3.5 ${activeNote.isHighPriority ? 'text-destructive' : ''}`} />}
            onClick={() => toggleHighPriority(activeNote.id)}
            title="High priority"
            active={activeNote.isHighPriority}
          />
          <div className="w-px h-4 bg-border/60 mx-1" />
          <ToolbarButton
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={handleCopy}
            title="Copy"
          />
          <ToolbarButton
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={handleDelete}
            title="Delete"
            destructive
          />
          <div className="w-px h-4 bg-border/60 mx-1" />
          <ToolbarButton
            icon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={() => setShowAIPanel(!showAIPanel)}
            title="AI Tools"
            active={showAIPanel}
            primary
          />
        </div>

        <div className="flex items-center gap-1.5">
          <AnimatePresence>
            {showSaved && lastSavedAt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full"
              >
                <Check className="h-3 w-3" />
                Saved at {formatTime(lastSavedAt)}
              </motion.div>
            )}
          </AnimatePresence>
          <ToolbarButton
            icon={isFocusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? 'Exit focus mode' : 'Focus mode'}
          />
        </div>
      </div>

      {/* AI Tools Panel */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary/5 to-transparent">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
                onClick={handleImprove}
                disabled={isAiLoading}
              >
                <Wand2 className="h-3 w-3" />
                Improve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
                onClick={handleSummarize}
                disabled={isAiLoading}
              >
                <List className="h-3 w-3" />
                Summarize
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
                onClick={handleSuggestTags}
                disabled={isAiLoading}
              >
                <Tags className="h-3 w-3" />
                Auto-Tag
              </Button>
              {isAiLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-primary ml-2"
                >
                  <div className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="font-medium">Thinking…</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-5 py-6 md:px-10 md:py-8">
          {/* Title - clearly editable */}
          <textarea
            ref={titleRef}
            value={localTitle}
            onChange={handleTitleChange}
            placeholder="Enter note title…"
            className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none resize-none font-[family-name:var(--font-title)] text-foreground placeholder:text-muted-foreground/40 leading-tight overflow-hidden"
            rows={1}
            style={{ height: 'auto' }}
          />

          {/* Date & Time line */}
          <div className="flex items-center gap-3 mt-2 mb-4 text-[12px] text-muted-foreground/60">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Created {formatDateTime(activeNote.createdAt)}
            </span>
            {activeNote.updatedAt !== activeNote.createdAt && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Save className="h-3 w-3" />
                  Last edited {formatDate(activeNote.updatedAt)} at {formatTime(activeNote.updatedAt)}
                </span>
              </>
            )}
          </div>

          {/* Tags display */}
          {activeNote.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {activeNote.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-2 py-0 h-5 font-medium cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => {
                    const { removeTag } = useNoteStore.getState();
                    removeTag(activeNote.id, tag);
                    toast.success(`Tag "${tag}" removed`);
                  }}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}

          {/* Status indicators */}
          <div className="flex items-center gap-2 mb-4">
            {activeNote.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </span>
            )}
            {activeNote.isHighPriority && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                <Flame className="h-2.5 w-2.5" /> High Priority
              </span>
            )}
            {activeNote.isTemporary && activeNote.expiresAt && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full countdown-pulse">
                <Clock className="h-2.5 w-2.5" /> Self-destructing
              </span>
            )}
          </div>

          {/* Content */}
          <textarea
            ref={contentRef}
            value={localContent}
            onChange={handleContentChange}
            placeholder="Start writing your note…"
            className="editor-content w-full min-h-[50vh] bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed text-foreground/85 placeholder:text-muted-foreground/35 font-[family-name:var(--font-body)] focus:placeholder:text-muted-foreground/20 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

// Toolbar Button component
function ToolbarButton({
  icon,
  onClick,
  title,
  active = false,
  primary = false,
  destructive = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  primary?: boolean;
  destructive?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-7 w-7 transition-all active:scale-90 ${
        active
          ? primary
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary'
          : destructive
            ? 'text-muted-foreground hover:text-destructive'
            : 'text-muted-foreground hover:text-foreground'
      }`}
      onClick={onClick}
      title={title}
    >
      {icon}
    </Button>
  );
}
