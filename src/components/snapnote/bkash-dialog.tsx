'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const BKASH_NUMBER = '01701659879';

interface BkashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BkashDialog({ open, onOpenChange }: BkashDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BKASH_NUMBER);
      setCopied(true);
      toast.success('bKash number copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older mobile browsers
      const textarea = document.createElement('textarea');
      textarea.value = BKASH_NUMBER;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('bKash number copied!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Failed to copy. Please copy manually.');
      }
      document.body.removeChild(textarea);
    }
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[85vh] overflow-auto px-0 pt-0 pb-8"
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
        </div>

        <SheetHeader className="px-6 pt-1 pb-0">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <Image src="/bkash-logo.png" alt="bKash" width={32} height={32} className="rounded-lg" />
            Support via bKash
          </SheetTitle>
          <SheetDescription className="text-left">
            Send a small contribution to support the developer
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-5 px-6 py-5">
          {/* bKash Logo Large */}
          <div className="h-20 w-20 rounded-2xl bg-[#E2136E]/10 dark:bg-[#E2136E]/15 flex items-center justify-center border border-[#E2136E]/20">
            <Image src="/bkash-logo.png" alt="bKash" width={64} height={64} className="rounded-xl" />
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

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
              copied
                ? 'bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400'
                : 'bg-[#E2136E] text-white shadow-lg shadow-[#E2136E]/25'
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

          {/* Instructions */}
          <div className="w-full bg-secondary/30 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">How to send:</p>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Copy the bKash number above</li>
              <li>Open your bKash app</li>
              <li>Go to &quot;Send Money&quot;</li>
              <li>Paste the number and enter amount</li>
              <li>Complete the transaction</li>
            </ol>
          </div>

          {/* Thank you */}
          <p className="text-xs text-muted-foreground text-center italic">
            Every small contribution means a lot! ❤️
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
