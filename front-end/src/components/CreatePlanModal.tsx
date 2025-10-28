import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CONTRACTS, DCA_CONTRACT_ABI, ERC20_ABI, TIME_CYCLES } from '@/lib/contracts';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export const CreatePlanModal = () => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [interval, setInterval] = useState<'hourly' | 'daily'>('daily');
  const [maxExecutions, setMaxExecutions] = useState('0');
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: executionFee } = useReadContract({
    address: CONTRACTS.DCA_CONTRACT,
    abi: DCA_CONTRACT_ABI,
    functionName: 'executionFee',
  });

  const { data: musdAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.MUSD_TOKEN,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.DCA_CONTRACT] : undefined,
  });

  const handleApprove = async () => {
    if (!amount || !address) return;

    try {
      const amountBigInt = parseUnits(amount, 18);
      
      await writeContractAsync({
        address: CONTRACTS.MUSD_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.DCA_CONTRACT, amountBigInt * 1000n],
      } as any);

      toast.success('Token approval successful!');
      
      // Refetch allowance after approval
      setTimeout(() => {
        refetchAllowance();
      }, 2000);
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve tokens');
    }
  };

  const handleCreatePlan = async () => {
    if (!amount || !address || !executionFee) return;

    try {
      const amountBigInt = parseUnits(amount, 18);
      const timeCycle = interval === 'hourly' ? TIME_CYCLES.ONE_HOUR : TIME_CYCLES.ONE_DAY;

      await writeContractAsync({
        address: CONTRACTS.DCA_CONTRACT,
        abi: DCA_CONTRACT_ABI,
        functionName: 'createPlan',
        args: [amountBigInt, timeCycle, BigInt(maxExecutions)],
        value: executionFee,
      } as any);

      toast.success('DCA Plan created successfully!');
      setOpen(false);
      setAmount('');
      setMaxExecutions('0');
    } catch (error: any) {
      console.error('Create plan error:', error);
      toast.error(error.message || 'Failed to create plan');
    }
  };

  const needsApproval = musdAllowance !== undefined && amount && 
    musdAllowance < parseUnits(amount, 18);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 glow-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create DCA Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Create DCA Plan</DialogTitle>
          <DialogDescription>
            Set up automated swaps from mUSD to BTC at regular intervals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount per swap (mUSD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Swap Interval</Label>
            <Select value={interval} onValueChange={(v: 'hourly' | 'daily') => setInterval(v)}>
              <SelectTrigger className="glass-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-border">
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Every Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxExecutions">Max Executions (0 for unlimited)</Label>
            <Input
              id="maxExecutions"
              type="number"
              placeholder="0"
              value={maxExecutions}
              onChange={(e) => setMaxExecutions(e.target.value)}
              className="glass-card"
            />
          </div>

          {executionFee && (
            <div className="text-sm text-muted-foreground">
              Execution fee: {(Number(executionFee) / 1e18).toFixed(4)} ETH
            </div>
          )}

          <div className="flex gap-2">
            {needsApproval && (
              <Button 
                onClick={handleApprove} 
                variant="secondary"
                className="flex-1 glass-card"
              >
                Approve mUSD
              </Button>
            )}
            <Button 
              onClick={handleCreatePlan}
              disabled={!amount || needsApproval}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0"
            >
              Create Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
