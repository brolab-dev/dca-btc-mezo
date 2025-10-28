export const CONTRACTS = {
  MUSD_TOKEN: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' as `0x${string}`,
  BTC_TOKEN: '0x7b7C000000000000000000000000000000000000' as `0x${string}`,
  SWAP_ROUTER: '0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9' as `0x${string}`,
  DCA_CONTRACT: '0x29C17CD908EF3087812760C099735AA7f1cDacA4' as `0x${string}`,
} as const;

export const DCA_CONTRACT_ABI = [
  {
    inputs: [
      { name: "amountPerExecution", type: "uint256" },
      { name: "timeCycle", type: "uint256" },
      { name: "maxExecutions", type: "uint256" }
    ],
    name: "createPlan",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "executePlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "stopPlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPlans",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "getPlan",
    outputs: [{
      components: [
        { name: "user", type: "address" },
        { name: "amountPerExecution", type: "uint256" },
        { name: "timeCycle", type: "uint256" },
        { name: "lastExecution", type: "uint256" },
        { name: "totalExecutions", type: "uint256" },
        { name: "maxExecutions", type: "uint256" },
        { name: "isActive", type: "bool" },
        { name: "createdAt", type: "uint256" }
      ],
      name: "",
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "canExecutePlan",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "getNextExecutionTime",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "executionFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "ONE_HOUR",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "ONE_DAY",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "planId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amountIn", type: "uint256" },
      { indexed: false, name: "amountOut", type: "uint256" },
      { indexed: false, name: "executionNumber", type: "uint256" }
    ],
    name: "PlanExecuted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "planId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amountPerExecution", type: "uint256" },
      { indexed: false, name: "timeCycle", type: "uint256" },
      { indexed: false, name: "maxExecutions", type: "uint256" }
    ],
    name: "PlanCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "planId", type: "uint256" },
      { indexed: true, name: "user", type: "address" }
    ],
    name: "PlanStopped",
    type: "event"
  }
] as const;

export const ERC20_ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export const TIME_CYCLES = {
  ONE_HOUR: 3600n,
  ONE_DAY: 86400n,
} as const;
