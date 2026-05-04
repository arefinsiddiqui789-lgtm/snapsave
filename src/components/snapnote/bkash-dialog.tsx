'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Copy, Check, Send, ExternalLink } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const BKASH_NUMBER = '01701659879';
const BKASH_ANDROID_PACKAGE = 'com.bKash.customerapp';
const BKASH_IOS_APP_ID = '1351183172';

interface BkashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch {
        document.body.removeChild(textarea);
        return false;
      }
    });
}

// Shared content for both Dialog and Sheet
function BkashContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(BKASH_NUMBER);
    if (success) {
      setCopied(true);
      toast.success('bKash number copied!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }, []);

  const handleSendMoney = useCallback(async () => {
    // Step 1: Always copy number first
    await copyToClipboard(BKASH_NUMBER);

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

    if (isAndroid) {
      // Android: Use market:// to open Play Store app directly
      window.location.href = `market://details?id=${BKASH_ANDROID_PACKAGE}`;
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = `https://play.google.com/store/apps/details?id=${BKASH_ANDROID_PACKAGE}`;
        }
      }, 2500);
    } else if (isIOS) {
      window.open(`https://apps.apple.com/app/id${BKASH_IOS_APP_ID}`, '_blank');
    } else {
      // Desktop: Open bKash website where user can log in and send money
      window.open('https://www.bkash.com', '_blank');
    }

    toast.success('Number copied! Opening bKash...');
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  }, [onOpenChange]);

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* bKash Logo Large */}
      <div className="h-20 w-20 rounded-2xl bg-[#E2136E]/10 dark:bg-[#E2136E]/15 flex items-center justify-center border border-[#E2136E]/20 p-2">
        <img src="/bkash-logo.png" alt="bKash" className="h-full w-full rounded-xl object-contain" />
      </div>

      {/* bKash Number Display */}
      <div className="w-full space-y-2">
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
          bKash Number
        </p>
        <div className="flex items-center justify-center bg-[#E2136E]/5 dark:bg-[#E2136E]/10 border border-[#E2136E]/20 rounded-2xl px-4 py-4">
          <span className="text-[26px] font-bold tracking-[0.2em] text-[#E2136E] font-mono select-all">
            {BKASH_NUMBER}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3">
        {/* Send Money Button */}
        <button
          onClick={handleSendMoney}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl text-base font-bold transition-all active:scale-95 hover:opacity-90 bg-[#E2136E] text-white shadow-lg shadow-[#E2136E]/30"
        >
          <Send className="h-5 w-5" />
          Send Money
        </button>

        {/* Copy Number Button */}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
            copied
              ? 'bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400'
              : 'bg-[#E2136E]/10 dark:bg-[#E2136E]/15 border border-[#E2136E]/20 text-[#E2136E]'
          }`}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              Copy Number
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="w-full bg-secondary/30 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">How to send:</p>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Tap <strong>Send Money</strong> → number auto-copied & bKash opens</li>
          <li>In bKash, tap <strong>Send Money</strong></li>
          <li><strong>Paste</strong> the number in the &quot;To&quot; field</li>
          <li>Enter amount, confirm with PIN — done!</li>
        </ol>
      </div>

      {/* App download links */}
      <div className="w-full flex gap-3">
        <a
          href={`https://play.google.com/store/apps/details?id=${BKASH_ANDROID_PACKAGE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/30 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Get on Android
        </a>
        <a
          href={`https://apps.apple.com/app/id${BKASH_IOS_APP_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/30 text-xs font-medium text-muted-foreground hover:bg-secondary/50 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Get on iOS
        </a>
      </div>

      {/* Thank you */}
      <p className="text-xs text-muted-foreground text-center italic">
        Every small contribution means a lot! ❤️
      </p>
    </div>
  );
}

export function BkashDialog({ open, onOpenChange }: BkashDialogProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[85vh] overflow-auto px-0 pt-0 pb-8"
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          </div>
          <SheetHeader className="px-6 pt-1 pb-0">
            <SheetTitle className="flex items-center gap-2.5 text-lg">
              <img src="/bkash-logo.png" alt="bKash" className="h-8 w-8 rounded-lg object-contain" />
              Support via bKash
            </SheetTitle>
            <SheetDescription className="text-left">
              Send a small contribution to support the developer
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4">
            <BkashContent onOpenChange={onOpenChange} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: centered dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <img src="/bkash-logo.png" alt="bKash" className="h-8 w-8 rounded-lg object-contain" />
            Support via bKash
          </DialogTitle>
          <DialogDescription>
            Send a small contribution to support the developer
          </DialogDescription>
        </DialogHeader>
        <BkashContent onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}
