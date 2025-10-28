import { useAccount, useReadContract } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CONTRACTS, DCA_CONTRACT_ABI, ERC20_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';
import { Wallet, TrendingUp, Clock } from 'lucide-react';

export const DashboardStats = () => {
  const { address } = useAccount();

  const { data: musdBalance } = useReadContract({
    address: CONTRACTS.MUSD_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: btcBalance } = useReadContract({
    address: CONTRACTS.BTC_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: planIds } = useReadContract({
    address: CONTRACTS.DCA_CONTRACT,
    abi: DCA_CONTRACT_ABI,
    functionName: 'getUserPlans',
    args: address ? [address] : undefined,
  });

  const activePlans = planIds?.length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="glass-card border border-border/30 hover-glow-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium tracking-wide text-foreground/80">mUSD Balance</CardTitle>
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center glow-accent-sm">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold gradient-text tracking-tight">
            {musdBalance ? parseFloat(formatUnits(musdBalance, 18)).toFixed(2) : '0.00'}
          </div>
          <p className="text-xs text-foreground/50 mt-2 tracking-wide">Available for DCA</p>
        </CardContent>
      </Card>

      <Card className="glass-card border border-border/30 hover-glow-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium tracking-wide text-foreground/80">BTC Balance</CardTitle>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-primary-sm">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold gradient-text tracking-tight">
            {btcBalance ? parseFloat(formatUnits(btcBalance, 18)).toFixed(4) : '0.0000'}
          </div>
          <p className="text-xs text-foreground/50 mt-2 tracking-wide">Accumulated</p>
        </CardContent>
      </Card>

      <Card className="glass-card border border-border/30 hover-glow-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium tracking-wide text-foreground/80">Active Plans</CardTitle>
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center glow-accent-sm">
            <Clock className="h-5 w-5 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold gradient-text tracking-tight">{activePlans}</div>
          <p className="text-xs text-foreground/50 mt-2 tracking-wide">Running strategies</p>
        </CardContent>
      </Card>
    </div>
  );
};
