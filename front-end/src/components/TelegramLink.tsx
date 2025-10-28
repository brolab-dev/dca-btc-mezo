import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TelegramLink() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [botUsername, setBotUsername] = useState('dca_mezo_bot'); // Replace with your actual bot username

  // Generate Telegram deep link
  const getTelegramLink = () => {
    if (!address) return '';
    return `https://t.me/${botUsername}?start=${address}`;
  };

  const copyToClipboard = async () => {
    const link = getTelegramLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Telegram link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const openTelegram = () => {
    window.open(getTelegramLink(), '_blank');
  };

  if (!isConnected) {
    return (
      <Card className="glass-card border border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-primary" />
            </div>
            Telegram Notifications
          </CardTitle>
          <CardDescription className="text-foreground/60 tracking-wide">
            Connect your wallet to enable Telegram notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="glass-card border border-border/30 hover-glow-primary transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-primary-sm">
            <Send className="w-5 h-5 text-primary" />
          </div>
          Telegram Notifications
        </CardTitle>
        <CardDescription className="text-foreground/60 tracking-wide">
          Get instant notifications when your DCA plans execute
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Features */}
        <div className="space-y-3">
          <p className="text-sm font-medium tracking-wide text-foreground/80">What you'll get:</p>
          <ul className="text-sm text-foreground/70 space-y-2">
            <li className="flex items-center gap-3">
              <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center bg-primary/10 border-primary/30 text-primary">✓</Badge>
              <span className="tracking-wide">Instant execution notifications</span>
            </li>
            <li className="flex items-center gap-3">
              <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center bg-primary/10 border-primary/30 text-primary">✓</Badge>
              <span className="tracking-wide">View plans and history via bot commands</span>
            </li>
            <li className="flex items-center gap-3">
              <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center bg-primary/10 border-primary/30 text-primary">✓</Badge>
              <span className="tracking-wide">Check wallet balance and status</span>
            </li>
          </ul>
        </div>

        {/* Link Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium tracking-wide text-foreground/80">Your Telegram Link</label>
          <div className="flex gap-2">
            <Input
              value={getTelegramLink()}
              readOnly
              className="font-mono text-xs bg-secondary/30 border-border/40 rounded-xl"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0 rounded-xl border-border/40 hover:bg-primary/10 hover:border-primary/30"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={openTelegram}
            className="flex-1 gap-2 btn-glow rounded-xl"
          >
            <Send className="w-4 h-4" />
            Open in Telegram
          </Button>
        </div>

        {/* Instructions */}
        <div className="rounded-xl bg-secondary/30 border border-border/40 p-5 space-y-3 backdrop-blur-sm">
          <p className="text-sm font-medium tracking-wide text-foreground/80">How to link:</p>
          <ol className="text-sm text-foreground/70 space-y-2 list-decimal list-inside tracking-wide leading-relaxed">
            <li>Click "Open in Telegram" or copy the link</li>
            <li>Start a chat with the bot</li>
            <li>Your wallet will be automatically linked</li>
            <li>Start receiving notifications!</li>
          </ol>
        </div>

        {/* Bot Commands */}
        <div className="rounded-xl border border-border/40 p-5 space-y-3 bg-secondary/20 backdrop-blur-sm">
          <p className="text-sm font-medium tracking-wide text-foreground/80">Available Commands:</p>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">/wallet</Badge>
              <span className="text-foreground/60">View wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">/plans</Badge>
              <span className="text-foreground/60">View plans</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">/history</Badge>
              <span className="text-foreground/60">View history</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">/help</Badge>
              <span className="text-foreground/60">Show help</span>
            </div>
          </div>
        </div>

        {/* Bot Info */}
        <div className="flex items-center justify-between text-xs text-foreground/60 pt-3 border-t border-border/40">
          <span className="tracking-wide">Bot: @{botUsername}</span>
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary transition-colors tracking-wide"
          >
            View Bot
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

