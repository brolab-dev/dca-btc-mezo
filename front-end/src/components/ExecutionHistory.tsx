import { useExecutionHistory, formatExecutionHistory } from '@/hooks/useExecutionHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ExternalLink, TrendingUp, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ExecutionHistory() {
  const { history, isLoading, error } = useExecutionHistory();

  if (error) {
    return (
      <Card className="glass-card border border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-destructive tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            Error Loading History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/60 tracking-wide">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="glass-card border border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-primary-sm">
              <History className="w-5 h-5 text-primary" />
            </div>
            Execution History
          </CardTitle>
          <CardDescription className="text-foreground/60 tracking-wide">Loading your transaction history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-5 rounded-xl border border-border/40 bg-secondary/20">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="glass-card border border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-primary-sm">
              <History className="w-5 h-5 text-primary" />
            </div>
            Execution History
          </CardTitle>
          <CardDescription className="text-foreground/60 tracking-wide">Your DCA execution history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 glow-primary-sm">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <p className="text-sm text-foreground/60 max-w-sm tracking-wide leading-relaxed">
              No executions yet. Your DCA plans will automatically execute based on your schedule.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border border-border/30 hover-glow-primary transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-primary-sm">
            <History className="w-5 h-5 text-primary" />
          </div>
          Execution History
        </CardTitle>
        <CardDescription className="text-foreground/60 tracking-wide">
          {history.length} execution{history.length !== 1 ? 's' : ''} completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((execution, index) => {
            const formatted = formatExecutionHistory(execution);
            const explorerUrl = `https://explorer.test.mezo.org/tx/${execution.transactionHash}`;

            return (
              <div
                key={`${execution.transactionHash}-${index}`}
                className="group p-5 rounded-xl border border-border/40 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30 transition-all duration-300 hover-glow-primary backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Plan and Execution Info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/30">
                        Plan #{formatted.planId}
                      </Badge>
                      <Badge variant="secondary" className="font-mono bg-accent/10 text-accent border-accent/30">
                        Execution #{formatted.executionNumber}
                      </Badge>
                    </div>

                    {/* Swap Details */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground tracking-tight">
                          {parseFloat(formatted.amountInFormatted).toFixed(2)}
                        </span>
                        <span className="text-foreground/60">mUSD</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary tracking-tight">
                          {parseFloat(formatted.amountOutFormatted).toFixed(8)}
                        </span>
                        <span className="text-foreground/60">BTC</span>
                      </div>
                    </div>

                    {/* Timestamp and Transaction */}
                    <div className="flex items-center gap-3 text-xs text-foreground/60 tracking-wide">
                      <span>
                        {formatDistanceToNow(formatted.date, { addSuffix: true })}
                      </span>
                      <span>•</span>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <span className="font-mono">
                          {execution.transactionHash.slice(0, 6)}...{execution.transactionHash.slice(-4)}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Price Indicator */}
                  <div className="text-right">
                    <div className="text-xs text-foreground/60 mb-1 tracking-wide">Price</div>
                    <div className="text-sm font-semibold text-foreground tracking-tight">
                      {(parseFloat(formatted.amountInFormatted) / parseFloat(formatted.amountOutFormatted)).toFixed(2)}
                    </div>
                    <div className="text-xs text-foreground/60 tracking-wide">mUSD/BTC</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats - Premium feel with geometric precision */}
        {history.length > 0 && (
          <div className="mt-8 pt-8 border-t border-border/40">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-secondary/20 border border-border/30">
                <div className="text-3xl font-bold gradient-text tracking-tight">
                  {history.length}
                </div>
                <div className="text-xs text-foreground/60 mt-2 tracking-wide">Total Executions</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/20 border border-border/30">
                <div className="text-3xl font-bold text-foreground tracking-tight">
                  {history.reduce((sum, h) => sum + parseFloat(formatExecutionHistory(h).amountInFormatted), 0).toFixed(2)}
                </div>
                <div className="text-xs text-foreground/60 mt-2 tracking-wide">Total mUSD Spent</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/20 border border-border/30">
                <div className="text-3xl font-bold text-accent tracking-tight">
                  {history.reduce((sum, h) => sum + parseFloat(formatExecutionHistory(h).amountOutFormatted), 0).toFixed(8)}
                </div>
                <div className="text-xs text-foreground/60 mt-2 tracking-wide">Total BTC Acquired</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/20 border border-border/30">
                <div className="text-3xl font-bold text-primary tracking-tight">
                  {(
                    history.reduce((sum, h) => sum + parseFloat(formatExecutionHistory(h).amountInFormatted), 0) /
                    history.reduce((sum, h) => sum + parseFloat(formatExecutionHistory(h).amountOutFormatted), 0)
                  ).toFixed(2)}
                </div>
                <div className="text-xs text-foreground/60 mt-2 tracking-wide">Avg Price</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

