'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const BKASH_NUMBER = '01701659879';

// bKash SVG Logo
function BkashLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* bKash logo - stylized "b" in speech bubble */}
      <rect width="200" height="200" rx="40" fill="#E2136E" />
      <path
        d="M60 55 C60 45, 70 35, 85 35 L115 35 C130 35, 140 45, 140 55 L140 105 C140 115, 130 125, 115 125 L90 125 L70 150 L75 125 L85 125 C70 125, 60 115, 60 105 Z"
        fill="white"
      />
      <circle cx="95" cy="70" r="10" fill="#E2136E" />
      <path
        d="M85 90 L105 90 L105 100 C105 105, 100 108, 95 108 C90 108, 85 105, 85 100 Z"
        fill="#E2136E"
      />
    </svg>
  );
}

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
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = BKASH_NUMBER;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BkashLogo className="h-7 w-7" />
            Support via bKash
          </DialogTitle>
          <DialogDescription>
            Send a small contribution to support the developer
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {/* bKash Logo Large */}
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-[#E2136E]/10 dark:bg-[#E2136E]/15 flex items-center justify-center border border-[#E2136E]/20">
              <BkashLogo className="h-14 w-14" />
            </div>
          </div>

          {/* bKash Number Display */}
          <div className="w-full space-y-2">
            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
              bKash Number
            </p>
            <div className="relative flex items-center justify-center bg-[#E2136E]/5 dark:bg-[#E2136E]/10 border border-[#E2136E]/20 rounded-xl px-4 py-4">
              <span className="text-2xl font-bold tracking-widest text-[#E2136E] font-mono select-all">
                {BKASH_NUMBER}
              </span>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              copied
                ? 'bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400'
                : 'bg-[#E2136E] text-white hover:bg-[#C70F60] shadow-md shadow-[#E2136E]/25'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Number
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="w-full bg-secondary/30 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">How to send:</p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Copy the bKash number above</li>
              <li>Open your bKash app</li>
              <li>Go to &quot;Send Money&quot;</li>
              <li>Paste the number and enter amount</li>
              <li>Complete the transaction</li>
            </ol>
          </div>

          {/* Thank you message */}
          <p className="text-xs text-muted-foreground text-center italic">
            Every small contribution means a lot! ❤️
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
