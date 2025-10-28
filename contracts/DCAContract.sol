// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRouter {
    struct Route {
        address from;
        address to;
        bool stable;
        address factory;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        Route[] memory routes
    ) external view returns (uint256[] memory amounts);
}

contract DCAContract is Ownable, ReentrancyGuard {

    constructor() Ownable(msg.sender) {
        keeper = msg.sender; // Initially set owner as keeper
    }
    using SafeERC20 for IERC20;

    // Contract addresses
    address public constant MUSD_TOKEN = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address public constant BTC_TOKEN = 0x7b7C000000000000000000000000000000000000;
    address public constant SWAP_ROUTER = 0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9;

    // Time cycles
    uint256 public constant ONE_HOUR = 3600;
    uint256 public constant ONE_DAY = 86400;

    struct DCAplan {
        address user;
        uint256 amountPerExecution;
        uint256 timeCycle; // in seconds (ONE_HOUR or ONE_DAY)
        uint256 lastExecution;
        uint256 totalExecutions;
        uint256 maxExecutions; // 0 means unlimited
        bool isActive;
        uint256 createdAt;
    }

    // Mapping from plan ID to DCA plan
    mapping(uint256 => DCAplan) public dcaPlans;
    // Mapping from user to their plan IDs
    mapping(address => uint256[]) public userPlans;

    uint256 public nextPlanId = 1;
    uint256 public executionFee = 0.001 ether; // Fee for executing DCA
    address public keeper;


    // Events
    event PlanCreated(
        uint256 indexed planId,
        address indexed user,
        uint256 amountPerExecution,
        uint256 timeCycle,
        uint256 maxExecutions
    );

    event PlanExecuted(
        uint256 indexed planId,
        address indexed user,
        uint256 amountIn,
        uint256 amountOut,
        uint256 executionNumber
    );

    event PlanStopped(uint256 indexed planId, address indexed user);

    event ExecutionFeeUpdated(uint256 newFee);

    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);



    /**
     * @dev Create a new DCA plan
     * @param amountPerExecution Amount of mUSD to swap per execution
     * @param timeCycle Time between executions (ONE_HOUR or ONE_DAY)
     * @param maxExecutions Maximum number of executions (0 for unlimited)
     */
    function createPlan(
        uint256 amountPerExecution,
        uint256 timeCycle,
        uint256 maxExecutions
    ) external payable nonReentrant {
        require(amountPerExecution > 0, "Amount must be greater than 0");
        require(
            timeCycle == ONE_HOUR || timeCycle == ONE_DAY,
            "Invalid time cycle"
        );
        require(msg.value >= executionFee, "Insufficient execution fee");

        // Check user has sufficient mUSD balance
        IERC20 musdToken = IERC20(MUSD_TOKEN);
        require(
            musdToken.balanceOf(msg.sender) >= amountPerExecution,
            "Insufficient mUSD balance"
        );

        // Create the plan
        uint256 planId = nextPlanId++;
        dcaPlans[planId] = DCAplan({
            user: msg.sender,
            amountPerExecution: amountPerExecution,
            timeCycle: timeCycle,
            lastExecution: 0, // Will be set on first execution
            totalExecutions: 0,
            maxExecutions: maxExecutions,
            isActive: true,
            createdAt: block.timestamp
        });

        userPlans[msg.sender].push(planId);

        emit PlanCreated(
            planId,
            msg.sender,
            amountPerExecution,
            timeCycle,
            maxExecutions
        );
    }

    /**
     * @dev Execute a DCA plan (only keeper can call this)
     * @param planId The ID of the plan to execute
     */
    function executePlan(uint256 planId) external nonReentrant {
        require(msg.sender == keeper, "Only keeper can execute plans");
        require(canExecutePlan(planId), "Plan cannot be executed");
        _executePlanInternal(planId);
    }

    /**
     * @dev Stop a DCA plan
     * @param planId The ID of the plan to stop
     */
    function stopPlan(uint256 planId) external {
        DCAplan storage plan = dcaPlans[planId];
        require(plan.user == msg.sender, "Not plan owner");
        require(plan.isActive, "Plan already inactive");

        plan.isActive = false;
        emit PlanStopped(planId, msg.sender);
    }

    /**
     * @dev Get user's plan IDs
     * @param user The user address
     * @return Array of plan IDs
     */
    function getUserPlans(address user) external view returns (uint256[] memory) {
        return userPlans[user];
    }

    /**
     * @dev Check if a plan can be executed
     * @param planId The plan ID to check
     * @return canExecute Whether the plan can be executed
     */
    function canExecutePlan(uint256 planId) public view returns (bool canExecute) {
        DCAplan storage plan = dcaPlans[planId];

        if (!plan.isActive) return false;
        if (plan.maxExecutions > 0 && plan.totalExecutions >= plan.maxExecutions) return false;
        if (block.timestamp < plan.lastExecution + plan.timeCycle) return false;

        IERC20 musdToken = IERC20(MUSD_TOKEN);
        if (musdToken.balanceOf(plan.user) < plan.amountPerExecution) return false;

        return true;
    }

    /**
     * @dev Update execution fee (only owner)
     * @param newFee New execution fee in wei
     */
    function updateExecutionFee(uint256 newFee) external onlyOwner {
        executionFee = newFee;
        emit ExecutionFeeUpdated(newFee);
    }

    /**
     * @dev Update keeper address (only owner)
     * @param newKeeper New keeper address
     */
    function updateKeeper(address newKeeper) external onlyOwner {
        require(newKeeper != address(0), "Invalid keeper address");
        address oldKeeper = keeper;
        keeper = newKeeper;
        emit KeeperUpdated(oldKeeper, newKeeper);
    }

    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency function to recover stuck tokens (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Batch execute multiple DCA plans (only keeper can call this)
     * @param planIds Array of plan IDs to execute
     */
    function batchExecutePlans(uint256[] calldata planIds) external nonReentrant {
        require(msg.sender == keeper, "Only keeper can execute plans");
        for (uint256 i = 0; i < planIds.length; i++) {
            if (canExecutePlan(planIds[i])) {
                _executePlanInternal(planIds[i]);
            }
        }
    }

    /**
     * @dev Internal function to execute a plan (used by both single and batch execution)
     * @param planId The ID of the plan to execute
     */
    function _executePlanInternal(uint256 planId) internal {
        DCAplan storage plan = dcaPlans[planId];

        IERC20 musdToken = IERC20(MUSD_TOKEN);

        // Transfer mUSD from user to this contract
        musdToken.safeTransferFrom(
            plan.user,
            address(this),
            plan.amountPerExecution
        );

        // Approve router to spend mUSD
        musdToken.forceApprove(SWAP_ROUTER, plan.amountPerExecution);

        // Prepare swap route (mUSD -> BTC)
        IRouter.Route[] memory routes = new IRouter.Route[](1);
        routes[0] = IRouter.Route({
            from: MUSD_TOKEN,
            to: BTC_TOKEN,
            stable: false,
            factory: address(0) // Use default factory
        });

        // Get expected output amount
        uint256[] memory amountsOut = IRouter(SWAP_ROUTER).getAmountsOut(
            plan.amountPerExecution,
            routes
        );
        uint256 minAmountOut = (amountsOut[1] * 95) / 100; // 5% slippage tolerance

        // Execute swap
        uint256[] memory actualAmounts = IRouter(SWAP_ROUTER)
            .swapExactTokensForTokens(
                plan.amountPerExecution,
                minAmountOut,
                routes,
                plan.user, // Send BTC directly to user
                block.timestamp + 300 // 5 minute deadline
            );

        // Update plan state
        plan.lastExecution = block.timestamp;
        plan.totalExecutions++;

        // Check if plan should be deactivated
        if (plan.maxExecutions > 0 && plan.totalExecutions >= plan.maxExecutions) {
            plan.isActive = false;
        }

        emit PlanExecuted(
            planId,
            plan.user,
            actualAmounts[0],
            actualAmounts[1],
            plan.totalExecutions
        );
    }

    /**
     * @dev Get all executable plan IDs
     * @return executablePlans Array of plan IDs that can be executed
     */
    function getExecutablePlans() external view returns (uint256[] memory executablePlans) {
        uint256 count = 0;

        // First pass: count executable plans
        for (uint256 i = 1; i < nextPlanId; i++) {
            if (canExecutePlan(i)) {
                count++;
            }
        }

        // Second pass: populate array
        executablePlans = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextPlanId; i++) {
            if (canExecutePlan(i)) {
                executablePlans[index] = i;
                index++;
            }
        }
    }

    /**
     * @dev Get plan details
     * @param planId The plan ID
     * @return plan The DCA plan details
     */
    function getPlan(uint256 planId) external view returns (DCAplan memory plan) {
        return dcaPlans[planId];
    }

    /**
     * @dev Get next execution time for a plan
     * @param planId The plan ID
     * @return nextExecution Timestamp of next execution (0 if can execute now)
     */
    function getNextExecutionTime(uint256 planId) external view returns (uint256 nextExecution) {
        DCAplan storage plan = dcaPlans[planId];
        if (!plan.isActive) return 0;

        uint256 nextTime = plan.lastExecution + plan.timeCycle;
        if (block.timestamp >= nextTime) return 0;

        return nextTime;
    }



    /**
     * @dev Check if user has approved sufficient mUSD for their active plans
     * @param user The user address
     * @return hasApproval Whether user has sufficient approvals
     */
    function hasUserApprovedSufficientMUSD(address user) external view returns (bool hasApproval) {
        IERC20 musdToken = IERC20(MUSD_TOKEN);
        uint256 allowance = musdToken.allowance(user, address(this));

        uint256[] memory userPlanIds = userPlans[user];
        uint256 totalRequired = 0;

        for (uint256 i = 0; i < userPlanIds.length; i++) {
            DCAplan storage plan = dcaPlans[userPlanIds[i]];
            if (plan.isActive) {
                totalRequired += plan.amountPerExecution;
            }
        }

        return allowance >= totalRequired;
    }
}
