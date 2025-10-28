import { useAccount, useReadContract } from 'wagmi';
import { WalletButton } from '@/components/WalletButton';
import { CreatePlanModal } from '@/components/CreatePlanModal';
import { PlanCard } from '@/components/PlanCard';
import { DashboardStats } from '@/components/DashboardStats';
import { ExecutionHistory } from '@/components/ExecutionHistory';
import { TelegramLink } from '@/components/TelegramLink';
import { CONTRACTS, DCA_CONTRACT_ABI } from '@/lib/contracts';
import { TrendingUp, Zap } from 'lucide-react';

const Index = () => {
  const { address, isConnected } = useAccount();

  const { data: planIds } = useReadContract({
    address: CONTRACTS.DCA_CONTRACT,
    abi: DCA_CONTRACT_ABI,
    functionName: 'getUserPlans',
    args: address ? [address] : undefined,
  });

  return (
    <div className="min-h-screen">
      {/* Header - Futuristic with subtle glow */}
      <header className="border-b border-border/40 backdrop-blur-xl sticky top-0 z-50 glass-card-strong">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-bg-primary flex items-center justify-center glow-primary-sm animate-glow">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text tracking-tight">DCA Protocol</h1>
                <p className="text-xs text-muted-foreground tracking-wide">Automated Dollar Cost Averaging</p>
              </div>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="w-24 h-24 rounded-3xl gradient-bg-primary flex items-center justify-center glow-primary mb-8 animate-glow">
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-5xl font-bold mb-6 gradient-text tracking-tight">
              Welcome to DCA Protocol
            </h2>
            <p className="text-xl text-foreground/70 mb-10 max-w-2xl leading-relaxed">
              Automate your cryptocurrency purchases with Dollar Cost Averaging.
              Set up recurring swaps from mUSD to BTC at your preferred intervals.
            </p>
            <WalletButton />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Stats */}
            <DashboardStats />

            {/* Plans Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Your DCA Plans</h2>
                  <p className="text-foreground/60 mt-1 tracking-wide">
                    Manage your automated trading strategies
                  </p>
                </div>
                <CreatePlanModal />
              </div>

              {planIds && planIds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {planIds.map((planId) => (
                    <PlanCard key={planId.toString()} planId={planId} />
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-16 text-center border border-border/30">
                  <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-6 glow-primary-sm">
                    <TrendingUp className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 tracking-tight">No DCA plans yet</h3>
                  <p className="text-foreground/60 mb-8 max-w-md mx-auto">
                    Create your first automated trading plan to get started
                  </p>
                  <CreatePlanModal />
                </div>
              )}
            </div>

            {/* Execution History and Telegram */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ExecutionHistory />
              </div>
              <div>
                <TelegramLink />
              </div>
            </div>

            {/* Info Cards - Premium feel with geometric precision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              <div className="glass-card rounded-2xl p-8 border border-border/30 hover-glow-primary">
                <h3 className="text-xl font-semibold mb-5 gradient-text tracking-tight">How it works</h3>
                <ul className="space-y-3 text-sm text-foreground/70 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>Create a plan with your desired swap amount and interval</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>Approve mUSD tokens for the contract</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>The contract automatically swaps at your set intervals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>Receive BTC directly to your wallet</span>
                  </li>
                </ul>
              </div>

              <div className="glass-card rounded-2xl p-8 border border-border/30 hover-glow-primary">
                <h3 className="text-xl font-semibold mb-5 gradient-text tracking-tight">Benefits</h3>
                <ul className="space-y-3 text-sm text-foreground/70 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-accent mt-0.5">▸</span>
                    <span>Reduce timing risk with consistent purchases</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent mt-0.5">▸</span>
                    <span>Remove emotion from your investment strategy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent mt-0.5">▸</span>
                    <span>Fully automated - set it and forget it</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent mt-0.5">▸</span>
                    <span>Stop or adjust plans anytime</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
