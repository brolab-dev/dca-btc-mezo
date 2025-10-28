import { useEffect, useState } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACTS, DCA_CONTRACT_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

export interface ExecutionHistory {
  planId: bigint;
  user: string;
  amountIn: bigint;
  amountOut: bigint;
  executionNumber: bigint;
  timestamp: bigint;
  transactionHash: string;
  blockNumber: bigint;
}

export function useExecutionHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [history, setHistory] = useState<ExecutionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address || !publicClient) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current block number
        const latestBlock = await publicClient.getBlockNumber();

        // Mezo testnet has a 10,000 block limit for getLogs
        // We'll query in chunks to avoid this limitation
        const BLOCK_CHUNK_SIZE = 10000n;
        const CONTRACT_DEPLOY_BLOCK = 8309000n; // Approximate deploy block, adjust if needed

        let allLogs: any[] = [];
        let fromBlock = CONTRACT_DEPLOY_BLOCK;

        // Query in chunks
        while (fromBlock <= latestBlock) {
          const toBlock = fromBlock + BLOCK_CHUNK_SIZE > latestBlock
            ? latestBlock
            : fromBlock + BLOCK_CHUNK_SIZE;

          try {
            const logs = await publicClient.getLogs({
              address: CONTRACTS.DCA_CONTRACT,
              event: {
                type: 'event',
                name: 'PlanExecuted',
                inputs: [
                  { indexed: true, name: 'planId', type: 'uint256' },
                  { indexed: true, name: 'user', type: 'address' },
                  { indexed: false, name: 'amountIn', type: 'uint256' },
                  { indexed: false, name: 'amountOut', type: 'uint256' },
                  { indexed: false, name: 'executionNumber', type: 'uint256' }
                ]
              },
              args: {
                user: address
              },
              fromBlock,
              toBlock
            });

            allLogs = [...allLogs, ...logs];
          } catch (chunkError) {
            console.warn(`Error fetching logs from block ${fromBlock} to ${toBlock}:`, chunkError);
          }

          fromBlock = toBlock + 1n;
        }

        // Get block timestamps for each event
        const historyWithTimestamps = await Promise.all(
          allLogs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            
            return {
              planId: log.args.planId!,
              user: log.args.user!,
              amountIn: log.args.amountIn!,
              amountOut: log.args.amountOut!,
              executionNumber: log.args.executionNumber!,
              timestamp: block.timestamp,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber
            };
          })
        );

        // Sort by timestamp descending (newest first)
        historyWithTimestamps.sort((a, b) => Number(b.timestamp - a.timestamp));

        setHistory(historyWithTimestamps);
      } catch (err) {
        console.error('Error fetching execution history:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [address, publicClient]);

  return { history, isLoading, error };
}

// Helper function to format execution history for display
export function formatExecutionHistory(execution: ExecutionHistory) {
  return {
    planId: execution.planId.toString(),
    amountInFormatted: formatUnits(execution.amountIn, 18),
    amountOutFormatted: formatUnits(execution.amountOut, 18),
    executionNumber: execution.executionNumber.toString(),
    date: new Date(Number(execution.timestamp) * 1000),
    transactionHash: execution.transactionHash,
    blockNumber: execution.blockNumber.toString()
  };
}

