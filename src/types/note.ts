export interface NoteVersion {
  id: string;
  content: string;
  title: string;
  savedAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isHighPriority: boolean;
  isTemporary: boolean;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  versions: NoteVersion[];
}

export type FilterType = 'all' | 'pinned' | 'high-priority' | 'temporary' | 'tags';

export type TemporaryDuration = '10min' | '1hour' | '1day';

export const TEMPORARY_DURATIONS: Record<TemporaryDuration, number> = {
  '10min': 10 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
};

export const TAG_COLORS: Record<string, string> = {
  work: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  personal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ideas: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  todo: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  meeting: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  research: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  journal: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  project: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  learning: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function getTagColorClass(tag: string): string {
  const lower = tag.toLowerCase();
  for (const [key, value] of Object.entries(TAG_COLORS)) {
    if (key !== 'default' && (lower.includes(key) || key.includes(lower))) {
      return value;
    }
  }
  return TAG_COLORS.default;
}

export function createNewNote(id: string): Note {
  return {
    id,
    title: '',
    content: '',
    tags: [],
    isPinned: false,
    isHighPriority: false,
    isTemporary: false,
    expiresAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
  };
}

export function getNotePreview(note: Note, maxLength: number = 60): string {
  let content = note.content || '';
  // Strip markdown chars
  content = content.replace(/[#*_~`>\-\[\]()]/g, '').trim();
  // If content starts with the title text, strip it to avoid duplication
  if (note.title.trim()) {
    const titleTrimmed = note.title.trim().replace(/[#*_~`>\-\[\]()]/g, '');
    if (content.startsWith(titleTrimmed)) {
      content = content.slice(titleTrimmed.length).trim();
    }
  }
  if (!content) return '';
  return content.length > maxLength ? content.slice(0, maxLength) + '…' : content;
}

export function getNoteTitle(note: Note): string {
  if (note.title.trim()) return note.title.trim();
  return 'Untitled Note';
}

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(timestamp: number): string {
  const now = Date.now();
  const today = new Date(now).toDateString();
  const yesterday = new Date(now - 86400000).toDateString();
  const noteDate = new Date(timestamp).toDateString();

  if (noteDate === today) return 'Today';
  if (noteDate === yesterday) return 'Yesterday';
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function groupNotesByDate(notes: Note[]): Record<string, Note[]> {
  const groups: Record<string, Note[]> = {};
  const now = Date.now();
  const today = new Date(now).toDateString();
  const yesterday = new Date(now - 86400000).toDateString();

  for (const note of notes) {
    const noteDate = new Date(note.updatedAt).toDateString();
    let label: string;

    if (noteDate === today) {
      label = 'Today';
    } else if (noteDate === yesterday) {
      label = 'Yesterday';
    } else {
      label = new Date(note.updatedAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(note);
  }

  return groups;
}
