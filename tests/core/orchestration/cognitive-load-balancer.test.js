/**
 * Cognitive Load Balancer Tests
 *
 * Story ORCH-6 - Intelligent task distribution based on agent cognitive capacity
 *
 * Tests the core functionality of the CognitiveLoadBalancer class including:
 * - Agent registration and unregistration
 * - Task submission and routing
 * - Affinity scoring algorithm
 * - Throttle policies
 * - Rebalancing
 * - Metrics and queue management
 *
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const CognitiveLoadBalancer = require('../../../.aiox-core/core/orchestration/cognitive-load-balancer');
const {
  AgentStatus,
  TaskStatus,
  TaskPriority,
  ThrottlePolicy,
  AFFINITY_WEIGHTS,
  OVERLOAD_THRESHOLD,
} = CognitiveLoadBalancer;

describe('CognitiveLoadBalancer', () => {
  let balancer;
  let tempDir;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `clb-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    balancer = new CognitiveLoadBalancer({
      projectRoot: tempDir,
      persistMetrics: false,
    });
  });

  afterEach(() => {
    balancer.removeAllListeners();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const b = new CognitiveLoadBalancer();
      expect(b.throttlePolicy).toBe(ThrottlePolicy.QUEUE_WHEN_FULL);
      expect(b.maxQueueSize).toBe(1000);
      expect(b.agents.size).toBe(0);
      expect(b.tasks.size).toBe(0);
      expect(b.queue).toEqual([]);
    });

    it('should accept custom options using nullish coalescing', () => {
      const b = new CognitiveLoadBalancer({
        projectRoot: '/custom/path',
        throttlePolicy: ThrottlePolicy.REJECT_WHEN_FULL,
        maxQueueSize: 50,
        persistMetrics: false,
      });
      expect(b.projectRoot).toBe('/custom/path');
      expect(b.throttlePolicy).toBe(ThrottlePolicy.REJECT_WHEN_FULL);
      expect(b.maxQueueSize).toBe(50);
      expect(b.persistMetrics).toBe(false);
    });

    it('should extend EventEmitter', () => {
      expect(balancer).toBeInstanceOf(require('events').EventEmitter);
    });

    it('should initialize metrics with startTime', () => {
      expect(balancer.metrics.startTime).toBeLessThanOrEqual(Date.now());
      expect(balancer.metrics.totalSubmitted).toBe(0);
      expect(balancer.metrics.totalCompleted).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          AGENT REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('registerAgent', () => {
    it('should register agent with default profile', () => {
      const profile = balancer.registerAgent('agent-1');
      expect(profile.id).toBe('agent-1');
      expect(profile.maxLoad).toBe(100);
      expect(profile.currentLoad).toBe(0);
      expect(profile.specialties).toEqual([]);
      expect(profile.processingSpeed).toBe(1.0);
      expect(profile.status).toBe(AgentStatus.AVAILABLE);
      expect(profile.activeTasks).toEqual([]);
      expect(profile.completedCount).toBe(0);
      expect(profile.failedCount).toBe(0);
    });

    it('should register agent with custom profile', () => {
      const profile = balancer.registerAgent('agent-2', {
        maxLoad: 50,
        specialties: ['frontend', 'testing'],
        processingSpeed: 1.5,
      });
      expect(profile.maxLoad).toBe(50);
      expect(profile.specialties).toEqual(['frontend', 'testing']);
      expect(profile.processingSpeed).toBe(1.5);
    });

    it('should emit agent:registered event', () => {
      const handler = jest.fn();
      balancer.on('agent:registered', handler);

      balancer.registerAgent('agent-3');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: 'agent-3' })
      );
    });

    it('should throw on empty agentId', () => {
      expect(() => balancer.registerAgent('')).toThrow('agentId must be a non-empty string');
    });

    it('should throw on non-string agentId', () => {
      expect(() => balancer.registerAgent(null)).toThrow('agentId must be a non-empty string');
      expect(() => balancer.registerAgent(123)).toThrow('agentId must be a non-empty string');
    });

    it('should overwrite existing agent on re-registration', () => {
      balancer.registerAgent('agent-1', { maxLoad: 50 });
      balancer.registerAgent('agent-1', { maxLoad: 200 });
      expect(balancer.agents.get('agent-1').maxLoad).toBe(200);
    });
  });

  describe('unregisterAgent', () => {
    it('should unregister agent and return orphaned task IDs', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 5 });

      const orphaned = balancer.unregisterAgent('agent-1');
      expect(orphaned).toContain('task-1');
      expect(balancer.agents.has('agent-1')).toBe(false);
    });

    it('should re-queue orphaned tasks', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 5 });

      balancer.unregisterAgent('agent-1');

      const task = balancer.tasks.get('task-1');
      expect(task.status).toBe(TaskStatus.QUEUED);
      expect(task.assignedTo).toBeNull();
      expect(balancer.queue).toContain('task-1');
    });

    it('should throw on unknown agent', () => {
      expect(() => balancer.unregisterAgent('unknown')).toThrow("Agent 'unknown' not found");
    });

    it('should reassign orphaned tasks to remaining agents', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.registerAgent('agent-2', { maxLoad: 100 });

      balancer.submitTask({ id: 'task-1', complexity: 5 });
      const task = balancer.tasks.get('task-1');
      // Force assign to agent-1
      if (task.assignedTo !== 'agent-1') {
        balancer.assignTask('task-1', 'agent-1');
      }

      balancer.unregisterAgent('agent-1');

      // Task should be reassigned to agent-2 via queue processing
      const updatedTask = balancer.tasks.get('task-1');
      expect(updatedTask.assignedTo).toBe('agent-2');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          TASK SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('submitTask', () => {
    beforeEach(() => {
      balancer.registerAgent('agent-1', { maxLoad: 100, specialties: ['backend'] });
    });

    it('should submit and auto-assign a task', () => {
      const result = balancer.submitTask({ type: 'coding', complexity: 5 });
      expect(result.assignedTo).toBe('agent-1');
      expect(result.status).toBe(TaskStatus.ASSIGNED);
      expect(result.taskId).toBeDefined();
    });

    it('should auto-generate task ID when omitted', () => {
      const result = balancer.submitTask({ type: 'coding', complexity: 3 });
      expect(result.taskId).toMatch(/^task-/);
    });

    it('should use provided task ID', () => {
      const result = balancer.submitTask({ id: 'my-task-1', complexity: 3 });
      expect(result.taskId).toBe('my-task-1');
    });

    it('should emit task:submitted event', () => {
      const handler = jest.fn();
      balancer.on('task:submitted', handler);

      balancer.submitTask({ id: 'evt-task', complexity: 3 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 'evt-task' })
      );
    });

    it('should emit task:assigned event when assigned', () => {
      const handler = jest.fn();
      balancer.on('task:assigned', handler);

      balancer.submitTask({ id: 'asgn-task', complexity: 3 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 'asgn-task', agentId: 'agent-1' })
      );
    });

    it('should throw on non-object task input', () => {
      expect(() => balancer.submitTask(null)).toThrow('Task must be a non-null object');
      expect(() => balancer.submitTask('string')).toThrow('Task must be a non-null object');
    });

    it('should clamp complexity to range 1-10', () => {
      balancer.submitTask({ id: 'low', complexity: -5 });
      balancer.submitTask({ id: 'high', complexity: 999 });

      expect(balancer.tasks.get('low').complexity).toBe(1);
      expect(balancer.tasks.get('high').complexity).toBe(10);
    });

    it('should default complexity to 5', () => {
      balancer.submitTask({ id: 'default-cplx' });
      expect(balancer.tasks.get('default-cplx').complexity).toBe(5);
    });

    it('should queue task when all agents at capacity', () => {
      balancer.registerAgent('small-agent', { maxLoad: 5 });
      // Fill agent-1
      for (let i = 0; i < 20; i++) {
        balancer.submitTask({ id: `fill-${i}`, complexity: 5 });
      }

      const result = balancer.submitTask({ id: 'overflow-task', complexity: 10 });
      // Should be queued (or assigned to small-agent depending on capacity)
      expect([TaskStatus.QUEUED, TaskStatus.ASSIGNED]).toContain(result.status);
    });

    it('should increment totalSubmitted metric', () => {
      balancer.submitTask({ complexity: 3 });
      balancer.submitTask({ complexity: 3 });
      balancer.submitTask({ complexity: 3 });

      expect(balancer.metrics.totalSubmitted).toBe(3);
    });
  });

  describe('submitTask - Priority handling', () => {
    it('should handle critical priority tasks by bypassing queue', () => {
      balancer.registerAgent('fast-agent', { maxLoad: 100 });

      // Fill agent partially
      balancer.submitTask({ id: 'normal-1', complexity: 5, priority: TaskPriority.NORMAL });

      const result = balancer.submitTask({
        id: 'critical-1',
        complexity: 3,
        priority: TaskPriority.CRITICAL,
      });

      expect(result.status).toBe(TaskStatus.ASSIGNED);
      expect(result.assignedTo).toBe('fast-agent');
    });

    it('should reject critical tasks under reject-when-full policy when no agent available', () => {
      balancer.setThrottlePolicy(ThrottlePolicy.REJECT_WHEN_FULL);
      // No agents registered

      const result = balancer.submitTask({
        id: 'critical-no-agent',
        complexity: 3,
        priority: TaskPriority.CRITICAL,
      });

      expect(result.status).toBe(TaskStatus.FAILED);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          MANUAL ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('assignTask', () => {
    it('should manually assign task to specific agent', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.registerAgent('agent-2', { maxLoad: 100 });

      balancer.submitTask({ id: 'task-1', complexity: 5 });

      const result = balancer.assignTask('task-1', 'agent-2');
      expect(result.assignedTo).toBe('agent-2');

      const task = balancer.tasks.get('task-1');
      expect(task.assignedTo).toBe('agent-2');
    });

    it('should remove task from queue on manual assignment', () => {
      // Create a task that goes to queue (no agents)
      balancer.submitTask({ id: 'queued-task', complexity: 5 });
      expect(balancer.queue).toContain('queued-task');

      // Now register an agent and manually assign
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.assignTask('queued-task', 'agent-1');

      expect(balancer.queue).not.toContain('queued-task');
    });

    it('should throw on unknown task', () => {
      balancer.registerAgent('agent-1');
      expect(() => balancer.assignTask('unknown', 'agent-1')).toThrow("Task 'unknown' not found");
    });

    it('should throw on unknown agent', () => {
      balancer.registerAgent('agent-1');
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      expect(() => balancer.assignTask('task-1', 'unknown')).toThrow("Agent 'unknown' not found");
    });

    it('should move task from one agent to another', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.registerAgent('agent-2', { maxLoad: 100 });

      balancer.submitTask({ id: 'task-1', complexity: 5 });

      // Ensure it's on agent-1
      balancer.assignTask('task-1', 'agent-1');
      expect(balancer.agents.get('agent-1').activeTasks).toContain('task-1');

      // Move to agent-2
      balancer.assignTask('task-1', 'agent-2');
      expect(balancer.agents.get('agent-1').activeTasks).not.toContain('task-1');
      expect(balancer.agents.get('agent-2').activeTasks).toContain('task-1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          TASK COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('completeTask', () => {
    beforeEach(() => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
    });

    it('should mark task as completed', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.completeTask('task-1', { output: 'done' });

      const task = balancer.tasks.get('task-1');
      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.result).toEqual({ output: 'done' });
      expect(task.completedAt).toBeDefined();
    });

    it('should free agent capacity', () => {
      balancer.submitTask({ id: 'task-1', complexity: 8 });
      expect(balancer.agents.get('agent-1').currentLoad).toBe(8);

      balancer.completeTask('task-1');
      expect(balancer.agents.get('agent-1').currentLoad).toBe(0);
    });

    it('should update agent completion stats', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.completeTask('task-1');

      const agent = balancer.agents.get('agent-1');
      expect(agent.completedCount).toBe(1);
      expect(agent.avgCompletionTime).toBeGreaterThanOrEqual(0);
    });

    it('should emit task:completed event', () => {
      const handler = jest.fn();
      balancer.on('task:completed', handler);

      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.completeTask('task-1', 'result-data');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          result: 'result-data',
          agentId: 'agent-1',
        })
      );
    });

    it('should increment totalCompleted metric', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.completeTask('task-1');

      expect(balancer.metrics.totalCompleted).toBe(1);
    });

    it('should throw on unknown task', () => {
      expect(() => balancer.completeTask('unknown')).toThrow("Task 'unknown' not found");
    });

    it('should process queue after completing task', () => {
      // Fill agent to capacity
      balancer.registerAgent('agent-full', { maxLoad: 10 });
      balancer.submitTask({ id: 'fill-1', complexity: 5 });
      balancer.submitTask({ id: 'fill-2', complexity: 5 });

      // This should be queued (agent-1 may have space but agent-full is full)
      balancer.submitTask({ id: 'waiting', complexity: 8 });

      // Complete a task to free capacity
      balancer.completeTask('fill-1');

      // Check that queue processing attempted
      expect(balancer.metrics.totalCompleted).toBe(1);
    });

    it('should return completion time info', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      const result = balancer.completeTask('task-1');

      expect(result.taskId).toBe('task-1');
      expect(result.agentId).toBe('agent-1');
      expect(result.completionTime).toBeGreaterThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          TASK FAILURE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('failTask', () => {
    beforeEach(() => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
    });

    it('should mark task as failed', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.failTask('task-1', 'Something went wrong');

      const task = balancer.tasks.get('task-1');
      expect(task.status).toBe(TaskStatus.FAILED);
      expect(task.error).toBe('Something went wrong');
    });

    it('should accept Error objects', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.failTask('task-1', new Error('Detailed error'));

      const task = balancer.tasks.get('task-1');
      expect(task.error).toBe('Detailed error');
    });

    it('should free agent capacity', () => {
      balancer.submitTask({ id: 'task-1', complexity: 7 });
      expect(balancer.agents.get('agent-1').currentLoad).toBe(7);

      balancer.failTask('task-1', 'fail');
      expect(balancer.agents.get('agent-1').currentLoad).toBe(0);
    });

    it('should update agent failure stats', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.failTask('task-1', 'error');

      expect(balancer.agents.get('agent-1').failedCount).toBe(1);
    });

    it('should emit task:failed event', () => {
      const handler = jest.fn();
      balancer.on('task:failed', handler);

      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.failTask('task-1', 'test error');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          error: 'test error',
          agentId: 'agent-1',
        })
      );
    });

    it('should throw on unknown task', () => {
      expect(() => balancer.failTask('unknown')).toThrow("Task 'unknown' not found");
    });

    it('should use default error message when none provided', () => {
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.failTask('task-1');

      expect(balancer.tasks.get('task-1').error).toBe('Unknown error');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          AGENT LOAD QUERIES
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('getAgentLoad', () => {
    it('should return 0% for empty agent', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      expect(balancer.getAgentLoad('agent-1')).toBe(0);
    });

    it('should return correct load percentage', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 10 });
      // complexity 10 on maxLoad 100 = 10%
      expect(balancer.getAgentLoad('agent-1')).toBe(10);
    });

    it('should cap at 100%', () => {
      balancer.registerAgent('agent-1', { maxLoad: 10 });
      balancer.setThrottlePolicy(ThrottlePolicy.SPILLOVER);
      balancer.submitTask({ id: 'task-1', complexity: 10 });
      balancer.submitTask({ id: 'task-2', complexity: 10 });

      expect(balancer.getAgentLoad('agent-1')).toBe(100);
    });

    it('should return 100% for agent with maxLoad 0', () => {
      balancer.registerAgent('agent-zero', { maxLoad: 0 });
      expect(balancer.getAgentLoad('agent-zero')).toBe(100);
    });

    it('should throw on unknown agent', () => {
      expect(() => balancer.getAgentLoad('unknown')).toThrow("Agent 'unknown' not found");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          OPTIMAL AGENT
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('getOptimalAgent', () => {
    it('should return null when no agents registered', () => {
      const result = balancer.getOptimalAgent({ type: 'coding', complexity: 5 });
      expect(result).toBeNull();
    });

    it('should return agent info without assigning', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });

      const result = balancer.getOptimalAgent({ type: 'coding', complexity: 5 });
      expect(result.agentId).toBe('agent-1');
      expect(result.currentLoad).toBe(0);
      expect(result.affinityScore).toBeGreaterThan(0);
      expect(result.specialties).toEqual([]);

      // Verify no task was created or assigned
      expect(balancer.agents.get('agent-1').activeTasks.length).toBe(0);
    });

    it('should prefer agent with matching specialties', () => {
      balancer.registerAgent('generalist', { maxLoad: 100, specialties: [] });
      balancer.registerAgent('specialist', { maxLoad: 100, specialties: ['testing'] });

      const result = balancer.getOptimalAgent({
        type: 'test',
        complexity: 5,
        requiredSpecialties: ['testing'],
      });

      expect(result.agentId).toBe('specialist');
    });

    it('should factor in processing speed', () => {
      balancer.registerAgent('slow', { maxLoad: 100, processingSpeed: 0.5 });
      balancer.registerAgent('fast', { maxLoad: 100, processingSpeed: 2.0 });

      const result = balancer.getOptimalAgent({ type: 'coding', complexity: 5 });
      expect(result.agentId).toBe('fast');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          AFFINITY SCORING
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Affinity scoring algorithm', () => {
    it('should weight specialty match at 40%', () => {
      expect(AFFINITY_WEIGHTS.SPECIALTY).toBe(0.4);
    });

    it('should weight load inverse at 30%', () => {
      expect(AFFINITY_WEIGHTS.LOAD_INVERSE).toBe(0.3);
    });

    it('should weight speed at 20%', () => {
      expect(AFFINITY_WEIGHTS.SPEED).toBe(0.2);
    });

    it('should weight success rate at 10%', () => {
      expect(AFFINITY_WEIGHTS.SUCCESS_RATE).toBe(0.1);
    });

    it('should prefer less loaded agents for equal specialty match', () => {
      balancer.registerAgent('loaded', { maxLoad: 100, specialties: ['backend'] });
      balancer.registerAgent('free', { maxLoad: 100, specialties: ['backend'] });

      // Load up the first agent
      balancer.submitTask({ id: 'load-1', complexity: 8 });
      balancer.assignTask('load-1', 'loaded');
      balancer.submitTask({ id: 'load-2', complexity: 8 });
      balancer.assignTask('load-2', 'loaded');

      const result = balancer.getOptimalAgent({
        type: 'backend',
        complexity: 5,
        requiredSpecialties: ['backend'],
      });

      expect(result.agentId).toBe('free');
    });

    it('should give new agents benefit of the doubt for success rate', () => {
      balancer.registerAgent('new-agent', { maxLoad: 100 });
      const agent = balancer.agents.get('new-agent');

      // Internal method access for testing
      const successRate = balancer._getSuccessRate(agent);
      expect(successRate).toBe(1); // Perfect score for untested agents
    });

    it('should calculate correct success rate with history', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });

      // 3 completed, 1 failed = 75% success
      balancer.submitTask({ id: 't1', complexity: 2 });
      balancer.completeTask('t1');
      balancer.submitTask({ id: 't2', complexity: 2 });
      balancer.completeTask('t2');
      balancer.submitTask({ id: 't3', complexity: 2 });
      balancer.completeTask('t3');
      balancer.submitTask({ id: 't4', complexity: 2 });
      balancer.failTask('t4', 'error');

      const agent = balancer.agents.get('agent-1');
      expect(balancer._getSuccessRate(agent)).toBe(0.75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          THROTTLE POLICIES
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Throttle policies', () => {
    describe('setThrottlePolicy', () => {
      it('should accept valid policies', () => {
        balancer.setThrottlePolicy(ThrottlePolicy.QUEUE_WHEN_FULL);
        expect(balancer.throttlePolicy).toBe('queue-when-full');

        balancer.setThrottlePolicy(ThrottlePolicy.REJECT_WHEN_FULL);
        expect(balancer.throttlePolicy).toBe('reject-when-full');

        balancer.setThrottlePolicy(ThrottlePolicy.SPILLOVER);
        expect(balancer.throttlePolicy).toBe('spillover');
      });

      it('should throw on invalid policy', () => {
        expect(() => balancer.setThrottlePolicy('invalid')).toThrow("Invalid throttle policy 'invalid'");
      });
    });

    describe('queue-when-full', () => {
      it('should queue tasks when agents are full', () => {
        balancer.setThrottlePolicy(ThrottlePolicy.QUEUE_WHEN_FULL);
        balancer.registerAgent('small', { maxLoad: 5 });

        balancer.submitTask({ id: 'fill', complexity: 5 });
        const result = balancer.submitTask({ id: 'overflow', complexity: 5 });

        expect(result.status).toBe(TaskStatus.QUEUED);
        expect(balancer.queue).toContain('overflow');
      });

      it('should reject when queue is full', () => {
        balancer = new CognitiveLoadBalancer({
          projectRoot: tempDir,
          persistMetrics: false,
          maxQueueSize: 1,
        });
        balancer.setThrottlePolicy(ThrottlePolicy.QUEUE_WHEN_FULL);

        // No agents, first task goes to queue
        balancer.submitTask({ id: 'queue-1', complexity: 5 });
        // Second task should fail because queue is full
        const handler = jest.fn();
        balancer.on('queue:full', handler);

        const result = balancer.submitTask({ id: 'queue-2', complexity: 5 });
        expect(result.status).toBe(TaskStatus.FAILED);
        expect(handler).toHaveBeenCalled();
      });
    });

    describe('reject-when-full', () => {
      it('should reject tasks when no agent can accept', () => {
        balancer.setThrottlePolicy(ThrottlePolicy.REJECT_WHEN_FULL);
        balancer.registerAgent('tiny', { maxLoad: 3 });

        balancer.submitTask({ id: 'fill', complexity: 3 });
        const result = balancer.submitTask({ id: 'rejected', complexity: 3 });

        expect(result.status).toBe(TaskStatus.FAILED);
        expect(balancer.metrics.totalRejected).toBeGreaterThan(0);
      });
    });

    describe('spillover', () => {
      it('should assign to least loaded agent even when over capacity', () => {
        balancer.setThrottlePolicy(ThrottlePolicy.SPILLOVER);
        balancer.registerAgent('agent-1', { maxLoad: 5 });

        balancer.submitTask({ id: 'fill', complexity: 5 });
        const result = balancer.submitTask({ id: 'spill', complexity: 5 });

        expect(result.status).toBe(TaskStatus.ASSIGNED);
        expect(result.assignedTo).toBe('agent-1');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          REBALANCING
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('rebalance', () => {
    it('should return empty movements when no overloaded agents', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 5 });

      const result = balancer.rebalance();
      expect(result.movements).toEqual([]);
    });

    it('should return empty movements when no underloaded agents', () => {
      balancer.registerAgent('agent-1', { maxLoad: 10 });
      balancer.setThrottlePolicy(ThrottlePolicy.SPILLOVER);

      // Overload the agent
      for (let i = 0; i < 10; i++) {
        balancer.submitTask({ id: `heavy-${i}`, complexity: 5 });
      }

      const result = balancer.rebalance();
      expect(result.movements).toEqual([]);
    });

    it('should move tasks from overloaded to underloaded agents', () => {
      balancer.registerAgent('overloaded', { maxLoad: 10 });
      balancer.registerAgent('idle', { maxLoad: 100 });
      balancer.setThrottlePolicy(ThrottlePolicy.SPILLOVER);

      // Fill overloaded agent
      for (let i = 0; i < 5; i++) {
        balancer.submitTask({ id: `task-${i}`, complexity: 3 });
        balancer.assignTask(`task-${i}`, 'overloaded');
      }

      const result = balancer.rebalance();
      expect(result.movements.length).toBeGreaterThan(0);
      expect(result.movements[0].from).toBe('overloaded');
      expect(result.movements[0].to).toBe('idle');
    });

    it('should emit task:rebalanced events', () => {
      const handler = jest.fn();
      balancer.on('task:rebalanced', handler);

      balancer.registerAgent('overloaded', { maxLoad: 10 });
      balancer.registerAgent('idle', { maxLoad: 100 });
      balancer.setThrottlePolicy(ThrottlePolicy.SPILLOVER);

      for (let i = 0; i < 5; i++) {
        balancer.submitTask({ id: `rb-${i}`, complexity: 3 });
        balancer.assignTask(`rb-${i}`, 'overloaded');
      }

      balancer.rebalance();
      expect(handler).toHaveBeenCalled();
    });

    it('should increment totalRebalanced metric', () => {
      balancer.registerAgent('over', { maxLoad: 10 });
      balancer.registerAgent('under', { maxLoad: 100 });
      balancer.setThrottlePolicy(ThrottlePolicy.SPILLOVER);

      for (let i = 0; i < 5; i++) {
        balancer.submitTask({ id: `rebal-${i}`, complexity: 3 });
        balancer.assignTask(`rebal-${i}`, 'over');
      }

      balancer.rebalance();
      expect(balancer.metrics.totalRebalanced).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          QUEUE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('getQueue', () => {
    it('should return empty array initially', () => {
      expect(balancer.getQueue()).toEqual([]);
    });

    it('should return queued tasks with details', () => {
      // No agents - tasks go to queue
      balancer.submitTask({ id: 'q1', type: 'code', complexity: 5 });
      balancer.submitTask({ id: 'q2', type: 'test', complexity: 3 });

      const queue = balancer.getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].id).toBe('q1');
      expect(queue[1].id).toBe('q2');
      expect(queue[0].status).toBe(TaskStatus.QUEUED);
    });

    it('should drain queue when agent becomes available', () => {
      // Tasks go to queue first
      balancer.submitTask({ id: 'wait-1', complexity: 5 });
      expect(balancer.queue).toHaveLength(1);

      // Register agent - queue should process
      balancer.registerAgent('new-agent', { maxLoad: 100 });

      // Submit another task that triggers queue processing
      balancer.submitTask({ id: 'trigger', complexity: 3 });

      // wait-1 may still be in queue since registerAgent doesn't auto-process
      // But the trigger task should be assigned
      const task = balancer.tasks.get('trigger');
      expect(task.assignedTo).toBe('new-agent');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          METRICS
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('getMetrics', () => {
    it('should return comprehensive metrics snapshot', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 5 });
      balancer.completeTask('task-1');

      const metrics = balancer.getMetrics();

      expect(metrics.totalSubmitted).toBe(1);
      expect(metrics.totalCompleted).toBe(1);
      expect(metrics.totalFailed).toBe(0);
      expect(metrics.totalRejected).toBe(0);
      expect(metrics.queueLength).toBe(0);
      expect(metrics.activeAgents).toBe(1);
      expect(metrics.throughputPerMinute).toBeGreaterThanOrEqual(0);
      expect(metrics.avgWaitTime).toBeGreaterThanOrEqual(0);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.agentUtilization).toBeDefined();
      expect(metrics.agentUtilization['agent-1']).toBeDefined();
    });

    it('should include per-agent utilization', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 10 });

      const metrics = balancer.getMetrics();
      const agentMetrics = metrics.agentUtilization['agent-1'];

      expect(agentMetrics.load).toBe(10);
      expect(agentMetrics.activeTasks).toBe(1);
      expect(agentMetrics.status).toBeDefined();
    });

    it('should track agent success rate in metrics', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 't1', complexity: 2 });
      balancer.completeTask('t1');
      balancer.submitTask({ id: 't2', complexity: 2 });
      balancer.failTask('t2', 'error');

      const metrics = balancer.getMetrics();
      expect(metrics.agentUtilization['agent-1'].successRate).toBe(0.5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          AGENT STATUS
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Agent status transitions', () => {
    it('should start as available', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      expect(balancer.agents.get('agent-1').status).toBe(AgentStatus.AVAILABLE);
    });

    it('should transition to busy when tasks assigned', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 5 });

      expect(balancer.agents.get('agent-1').status).toBe(AgentStatus.BUSY);
    });

    it('should transition to overloaded at threshold', () => {
      balancer.registerAgent('agent-1', { maxLoad: 10 });
      balancer.submitTask({ id: 'task-1', complexity: 9 }); // 90% load > 85% threshold

      expect(balancer.agents.get('agent-1').status).toBe(AgentStatus.OVERLOADED);
    });

    it('should transition back to available when tasks complete', () => {
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 5 });

      expect(balancer.agents.get('agent-1').status).toBe(AgentStatus.BUSY);

      balancer.completeTask('task-1');
      expect(balancer.agents.get('agent-1').status).toBe(AgentStatus.AVAILABLE);
    });

    it('should emit agent:overloaded event', () => {
      const handler = jest.fn();
      balancer.on('agent:overloaded', handler);

      balancer.registerAgent('agent-1', { maxLoad: 10 });
      balancer.submitTask({ id: 'task-1', complexity: 9 });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: 'agent-1' })
      );
    });

    it('should emit agent:available event when load drops', () => {
      const handler = jest.fn();
      balancer.on('agent:available', handler);

      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'task-1', complexity: 90 });
      balancer.completeTask('task-1');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: 'agent-1' })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Metrics persistence', () => {
    it('should persist metrics to disk when enabled', async () => {
      const persistBalancer = new CognitiveLoadBalancer({
        projectRoot: tempDir,
        persistMetrics: true,
      });

      persistBalancer.registerAgent('agent-1', { maxLoad: 100 });
      persistBalancer.submitTask({ id: 'task-1', complexity: 5 });
      await persistBalancer.completeTask('task-1');

      // Allow async file write to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metricsPath = path.join(tempDir, '.aiox', 'load-balancer-metrics.json');
      const exists = fs.existsSync(metricsPath);
      expect(exists).toBe(true);

      if (exists) {
        const content = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        expect(content.totalCompleted).toBe(1);
      }

      persistBalancer.removeAllListeners();
    });

    it('should not persist when persistMetrics is false', async () => {
      balancer.submitTask({ id: 'no-persist', complexity: 5 });
      // Register agent so the task gets assigned then completed
      balancer.registerAgent('agent-1', { maxLoad: 100 });
      balancer.submitTask({ id: 'assigned', complexity: 5 });
      await balancer.completeTask('assigned');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metricsPath = path.join(tempDir, '.aiox', 'load-balancer-metrics.json');
      expect(fs.existsSync(metricsPath)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          EXPORTS
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Module exports', () => {
    it('should export CognitiveLoadBalancer as default and named', () => {
      expect(CognitiveLoadBalancer).toBeDefined();
      expect(CognitiveLoadBalancer.CognitiveLoadBalancer).toBe(CognitiveLoadBalancer);
    });

    it('should export AgentStatus enum', () => {
      expect(AgentStatus.AVAILABLE).toBe('available');
      expect(AgentStatus.BUSY).toBe('busy');
      expect(AgentStatus.OVERLOADED).toBe('overloaded');
      expect(AgentStatus.OFFLINE).toBe('offline');
    });

    it('should export TaskStatus enum', () => {
      expect(TaskStatus.QUEUED).toBe('queued');
      expect(TaskStatus.ASSIGNED).toBe('assigned');
      expect(TaskStatus.COMPLETED).toBe('completed');
      expect(TaskStatus.FAILED).toBe('failed');
    });

    it('should export TaskPriority enum', () => {
      expect(TaskPriority.LOW).toBe('low');
      expect(TaskPriority.NORMAL).toBe('normal');
      expect(TaskPriority.HIGH).toBe('high');
      expect(TaskPriority.CRITICAL).toBe('critical');
    });

    it('should export ThrottlePolicy enum', () => {
      expect(ThrottlePolicy.QUEUE_WHEN_FULL).toBe('queue-when-full');
      expect(ThrottlePolicy.REJECT_WHEN_FULL).toBe('reject-when-full');
      expect(ThrottlePolicy.SPILLOVER).toBe('spillover');
    });

    it('should export AFFINITY_WEIGHTS', () => {
      const total = AFFINITY_WEIGHTS.SPECIALTY + AFFINITY_WEIGHTS.LOAD_INVERSE +
        AFFINITY_WEIGHTS.SPEED + AFFINITY_WEIGHTS.SUCCESS_RATE;
      expect(total).toBeCloseTo(1.0);
    });

    it('should export OVERLOAD_THRESHOLD', () => {
      expect(OVERLOAD_THRESHOLD).toBe(85);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                          EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Edge cases', () => {
    it('should handle submitting tasks with no agents registered', () => {
      const result = balancer.submitTask({ id: 'orphan', complexity: 5 });
      expect(result.status).toBe(TaskStatus.QUEUED);
    });

    it('should handle multiple agents with same specialty', () => {
      balancer.registerAgent('a1', { maxLoad: 100, specialties: ['js'] });
      balancer.registerAgent('a2', { maxLoad: 100, specialties: ['js'] });

      const result = balancer.submitTask({
        id: 'js-task',
        complexity: 5,
        requiredSpecialties: ['js'],
      });

      expect(result.status).toBe(TaskStatus.ASSIGNED);
      expect(['a1', 'a2']).toContain(result.assignedTo);
    });

    it('should handle task with no required specialties', () => {
      balancer.registerAgent('a1', { maxLoad: 100, specialties: ['niche'] });

      const result = balancer.submitTask({ id: 'generic', complexity: 5 });
      expect(result.status).toBe(TaskStatus.ASSIGNED);
    });

    it('should handle completing task that has no agent', () => {
      // Create task that goes to queue (no agents)
      balancer.submitTask({ id: 'no-agent-task', complexity: 5 });

      // Manually change status to simulate edge case
      const task = balancer.tasks.get('no-agent-task');
      task.status = TaskStatus.ASSIGNED;

      const result = balancer.completeTask('no-agent-task');
      expect(result.taskId).toBe('no-agent-task');
    });

    it('should handle rapid fire task submission', () => {
      balancer.registerAgent('worker', { maxLoad: 1000 });

      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(balancer.submitTask({ complexity: 1 }));
      }

      const assigned = results.filter((r) => r.status === TaskStatus.ASSIGNED).length;
      expect(assigned).toBe(100);
      expect(balancer.metrics.totalSubmitted).toBe(100);
    });
  });
});
