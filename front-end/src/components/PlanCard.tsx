import { useWriteContract, useReadContract } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CONTRACTS, DCA_CONTRACT_ABI } from '@/lib/contracts';
import { toast } from 'sonner';
import { Square, Clock, TrendingUp, Calendar } from 'lucide-react';
import { formatUnits } from 'viem';

interface PlanCardProps {
  planId: bigint;
}

export const PlanCard = ({ planId }: PlanCardProps) => {
  const { writeContractAsync } = useWriteContract();

  const { data: plan, refetch } = useReadContract({
    address: CONTRACTS.DCA_CONTRACT,
    abi: DCA_CONTRACT_ABI,
    functionName: 'getPlan',
    args: [planId],
  });

  const { data: nextExecution } = useReadContract({
    address: CONTRACTS.DCA_CONTRACT,
    abi: DCA_CONTRACT_ABI,
    functionName: 'getNextExecutionTime',
    args: [planId],
  });

  if (!plan) return null;

  const handleStop = async () => {
    try {
      await writeContractAsync({
        address: CONTRACTS.DCA_CONTRACT,
        abi: DCA_CONTRACT_ABI,
        functionName: 'stopPlan',
        args: [planId],
      } as any);
      toast.success('Plan stopped successfully!');
      refetch();
    } catch (error: any) {
      console.error('Stop error:', error);
      toast.error(error.message || 'Failed to stop plan');
    }
  };

  const formatTime = (timestamp: bigint) => {
    if (timestamp === 0n) return 'Ready';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const interval = plan.timeCycle === 3600n ? 'Hourly' : 'Daily';
  const amount = formatUnits(plan.amountPerExecution, 18);

  return (
    <Card className="glass-card border border-border/30 hover-glow-primary transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl tracking-tight">Plan #{planId.toString()}</CardTitle>
          <Badge
            variant={plan.isActive ? "default" : "secondary"}
            className={plan.isActive ? "bg-success glow-primary-sm" : "bg-secondary"}
          >
            {plan.isActive ? 'Active' : 'Stopped'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-5 text-sm">
          <div className="space-y-2">
            <div className="flex items-center text-foreground/60 tracking-wide">
              <TrendingUp className="w-4 h-4 mr-2 text-primary" />
              Amount
            </div>
            <div className="font-semibold text-foreground tracking-tight">{amount} mUSD</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-foreground/60 tracking-wide">
              <Clock className="w-4 h-4 mr-2 text-accent" />
              Interval
            </div>
            <div className="font-semibold text-foreground tracking-tight">{interval}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-foreground/60 tracking-wide">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              Executions
            </div>
            <div className="font-semibold text-foreground tracking-tight">
              {plan.totalExecutions.toString()}
              {plan.maxExecutions > 0n && `/${plan.maxExecutions.toString()}`}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-foreground/60 text-xs tracking-wide">Next Run</div>
            <div className="font-semibold text-xs text-foreground tracking-tight">
              {nextExecution && formatTime(nextExecution)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/30 rounded-xl border border-border/40 backdrop-blur-sm">
          <p className="text-xs text-foreground/60 text-center tracking-wide leading-relaxed">
            ⚡ Plans are automatically executed by the keeper at scheduled intervals
          </p>
        </div>

        {plan.isActive && (
          <Button
            onClick={handleStop}
            variant="destructive"
            size="sm"
            className="w-full rounded-xl"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
