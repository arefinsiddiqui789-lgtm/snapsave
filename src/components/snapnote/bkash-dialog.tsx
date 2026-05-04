'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Copy, Check, Send } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const BKASH_NUMBER = '01701659879';

// bKash deep link: opens the bKash app directly to Send Money with number pre-filled
// Works on Android & iOS if bKash app is installed
const BKASH_SEND_MONEY_URL = `bkash://send_money?phone=${BKASH_NUMBER}`;
// Fallback web URL for users without the app
const BKASH_WEB_URL = 'https://www.bkash.com';

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

  const handleSendMoney = useCallback(() => {
    // Try to open bKash app with deep link
    const startTime = Date.now();

    // Attempt to open the bKash app
    window.location.href = BKASH_SEND_MONEY_URL;

    // If the app didn't open after 1.5s, redirect to web version
    setTimeout(() => {
      // If the page is still visible, the app didn't open
      if (Date.now() - startTime < 2000) {
        toast.error('bKash app not found. Opening web version...');
        setTimeout(() => {
          window.open(BKASH_WEB_URL, '_blank');
        }, 500);
      }
    }, 1500);

    // Close the sheet
    onOpenChange(false);
  }, [onOpenChange]);

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
            <img src="/bkash-logo.png" alt="bKash" className="h-8 w-8 rounded-lg object-contain" />
            Support via bKash
          </SheetTitle>
          <SheetDescription className="text-left">
            Send a small contribution to support the developer
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-5 px-6 py-5">
          {/* bKash Logo Large */}
          <div className="h-24 w-24 rounded-2xl bg-[#E2136E]/10 dark:bg-[#E2136E]/15 flex items-center justify-center border border-[#E2136E]/20 p-2">
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
            {/* Send Money Button — primary action */}
            <button
              onClick={handleSendMoney}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl text-base font-bold transition-all active:scale-95 bg-[#E2136E] text-white shadow-lg shadow-[#E2136E]/30"
            >
              <Send className="h-5 w-5" />
              Send Money
            </button>

            {/* Copy Number Button — secondary action */}
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
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Tap <strong>Send Money</strong> to open bKash app directly</li>
              <li>Your number will be auto-filled — just enter the amount</li>
              <li>Complete the transaction with your PIN</li>
            </ol>
            <p className="text-[10px] text-muted-foreground/70 mt-2">
              Or copy the number and send manually from your bKash app
            </p>
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
