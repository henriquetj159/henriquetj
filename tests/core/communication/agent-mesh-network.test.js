/**
 * Tests: Agent Mesh Network
 *
 * Testes unitarios para a rede mesh P2P descentralizada entre agentes.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const AgentMeshNetwork = require('../../../.aiox-core/core/communication/agent-mesh-network');
const {
  MessageType,
  PeerState,
  MeshEvent,
  DEFAULT_OPTIONS,
} = AgentMeshNetwork;

// ═══════════════════════════════════════════════════════════════════════════════════
//                              HELPERS
// ═══════════════════════════════════════════════════════════════════════════════════

function createMesh(opts = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mesh-test-'));
  const mesh = new AgentMeshNetwork(tmpDir, {
    autoStart: false,
    heartbeatInterval: 1000,
    peerTimeout: 3000,
    messageTTL: 5000,
    requestTimeout: 2000,
    ...opts,
  });
  return { mesh, tmpDir };
}

function cleanupDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              TESTS
// ═══════════════════════════════════════════════════════════════════════════════════

describe('AgentMeshNetwork', () => {
  let mesh;
  let tmpDir;

  beforeEach(() => {
    jest.useFakeTimers();
    const ctx = createMesh();
    mesh = ctx.mesh;
    tmpDir = ctx.tmpDir;
  });

  afterEach(() => {
    mesh.destroy();
    jest.useRealTimers();
    cleanupDir(tmpDir);
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       CONSTRUCTOR & EXPORTS
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('constructor & exports', () => {
    test('deve criar instancia com defaults', () => {
      const m = new AgentMeshNetwork('/tmp/test');
      expect(m).toBeInstanceOf(AgentMeshNetwork);
      expect(m.projectRoot).toBe('/tmp/test');
      expect(m.peers.size).toBe(0);
      m.destroy();
    });

    test('deve aceitar opcoes personalizadas', () => {
      const m = new AgentMeshNetwork('/tmp/test', {
        heartbeatInterval: 5000,
        maxQueueSize: 50,
      });
      expect(m.options.heartbeatInterval).toBe(5000);
      expect(m.options.maxQueueSize).toBe(50);
      expect(m.options.peerTimeout).toBe(DEFAULT_OPTIONS.peerTimeout);
      m.destroy();
    });

    test('deve exportar constantes', () => {
      expect(MessageType.DIRECT).toBe('direct');
      expect(MessageType.BROADCAST).toBe('broadcast');
      expect(MessageType.REQUEST).toBe('request');
      expect(MessageType.RESPONSE).toBe('response');
      expect(PeerState.ACTIVE).toBe('active');
      expect(PeerState.TIMEOUT).toBe('timeout');
      expect(MeshEvent.PEER_JOINED).toBe('peer-joined');
      expect(MeshEvent.MESSAGE_SENT).toBe('message-sent');
    });

    test('deve estender EventEmitter', () => {
      expect(typeof mesh.on).toBe('function');
      expect(typeof mesh.emit).toBe('function');
      expect(typeof mesh.removeAllListeners).toBe('function');
    });

    test('deve usar nullish coalescing para projectRoot', () => {
      const m = new AgentMeshNetwork(null);
      expect(m.projectRoot).toBe(process.cwd());
      m.destroy();
    });

    test('deve inicializar estatisticas em zero', () => {
      const stats = mesh.getStats();
      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.peersJoined).toBe(0);
      expect(stats.peerCount).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       PEER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('join()', () => {
    test('deve registrar um peer na mesh', () => {
      const result = mesh.join('agent-1', { capabilities: ['coding'] });
      expect(result.id).toBe('agent-1');
      expect(result.capabilities).toEqual(['coding']);
      expect(result.state).toBe('active');
      expect(mesh.peers.size).toBe(1);
    });

    test('deve emitir evento peer-joined', () => {
      const handler = jest.fn();
      mesh.on(MeshEvent.PEER_JOINED, handler);
      mesh.join('agent-1');
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: 'agent-1' })
      );
    });

    test('deve lancar erro para agentId invalido', () => {
      expect(() => mesh.join('')).toThrow('agentId is required');
      expect(() => mesh.join(null)).toThrow('agentId is required');
    });

    test('deve lancar erro para peer duplicado', () => {
      mesh.join('agent-1');
      expect(() => mesh.join('agent-1')).toThrow('already exists');
    });

    test('deve auto-inscrever em topicos', () => {
      mesh.join('agent-1', { topics: ['deploy', 'test'] });
      expect(mesh.getTopicSubscribers('deploy')).toContain('agent-1');
      expect(mesh.getTopicSubscribers('test')).toContain('agent-1');
    });

    test('deve criar adjacencia bidirecional com peers existentes', () => {
      mesh.join('agent-1');
      mesh.join('agent-2');
      expect(mesh.adjacency.get('agent-1').has('agent-2')).toBe(true);
      expect(mesh.adjacency.get('agent-2').has('agent-1')).toBe(true);
    });

    test('deve incrementar estatistica peersJoined', () => {
      mesh.join('a1');
      mesh.join('a2');
      expect(mesh.getStats().peersJoined).toBe(2);
    });
  });

  describe('leave()', () => {
    test('deve remover peer da mesh', () => {
      mesh.join('agent-1');
      const result = mesh.leave('agent-1');
      expect(result).toBe(true);
      expect(mesh.peers.size).toBe(0);
    });

    test('deve retornar false para peer inexistente', () => {
      expect(mesh.leave('ghost')).toBe(false);
    });

    test('deve emitir evento peer-left', () => {
      mesh.join('agent-1');
      const handler = jest.fn();
      mesh.on(MeshEvent.PEER_LEFT, handler);
      mesh.leave('agent-1');
      expect(handler).toHaveBeenCalledWith({ agentId: 'agent-1' });
    });

    test('deve remover adjacencias do peer removido', () => {
      mesh.join('agent-1');
      mesh.join('agent-2');
      mesh.leave('agent-1');
      expect(mesh.adjacency.get('agent-2').has('agent-1')).toBe(false);
    });

    test('deve remover inscricoes de topicos', () => {
      mesh.join('agent-1', { topics: ['deploy'] });
      mesh.leave('agent-1');
      expect(mesh.getTopicSubscribers('deploy')).toEqual([]);
    });

    test('deve incrementar estatistica peersLeft', () => {
      mesh.join('a1');
      mesh.leave('a1');
      expect(mesh.getStats().peersLeft).toBe(1);
    });
  });

  describe('getPeer()', () => {
    test('deve retornar dados do peer', () => {
      mesh.join('agent-1', { capabilities: ['coding'] });
      const peer = mesh.getPeer('agent-1');
      expect(peer).not.toBeNull();
      expect(peer.id).toBe('agent-1');
      expect(peer.capabilities).toEqual(['coding']);
    });

    test('deve retornar null para peer inexistente', () => {
      expect(mesh.getPeer('ghost')).toBeNull();
    });

    test('deve retornar copia, nao referencia', () => {
      mesh.join('agent-1', { capabilities: ['a'] });
      const p1 = mesh.getPeer('agent-1');
      const p2 = mesh.getPeer('agent-1');
      p1.capabilities.push('b');
      expect(p2.capabilities).toEqual(['a']);
    });
  });

  describe('listPeers()', () => {
    test('deve listar todos os peers', () => {
      mesh.join('a1');
      mesh.join('a2');
      const peers = mesh.listPeers();
      expect(peers).toHaveLength(2);
    });

    test('deve filtrar por topico', () => {
      mesh.join('a1', { topics: ['deploy'] });
      mesh.join('a2', { topics: ['test'] });
      const peers = mesh.listPeers({ topic: 'deploy' });
      expect(peers).toHaveLength(1);
      expect(peers[0].id).toBe('a1');
    });

    test('deve filtrar por capability', () => {
      mesh.join('a1', { capabilities: ['coding'] });
      mesh.join('a2', { capabilities: ['testing'] });
      const peers = mesh.listPeers({ capability: 'testing' });
      expect(peers).toHaveLength(1);
      expect(peers[0].id).toBe('a2');
    });

    test('deve retornar array vazio para topico inexistente', () => {
      mesh.join('a1');
      expect(mesh.listPeers({ topic: 'ghost' })).toEqual([]);
    });

    test('deve combinar filtros de topico e capability', () => {
      mesh.join('a1', { capabilities: ['coding'], topics: ['deploy'] });
      mesh.join('a2', { capabilities: ['testing'], topics: ['deploy'] });
      const peers = mesh.listPeers({ topic: 'deploy', capability: 'coding' });
      expect(peers).toHaveLength(1);
      expect(peers[0].id).toBe('a1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       DIRECT MESSAGING
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('send()', () => {
    test('deve enviar mensagem direta entre peers adjacentes', () => {
      mesh.join('a1');
      mesh.join('a2');
      const handler = jest.fn();
      mesh.on(MeshEvent.MESSAGE_RECEIVED, handler);

      const result = mesh.send('a1', 'a2', { text: 'hello' });
      expect(result.from).toBe('a1');
      expect(result.to).toBe('a2');
      expect(result.id).toBeDefined();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'a1',
          to: 'a2',
          payload: { text: 'hello' },
        })
      );
    });

    test('deve emitir evento message-sent', () => {
      mesh.join('a1');
      mesh.join('a2');
      const handler = jest.fn();
      mesh.on(MeshEvent.MESSAGE_SENT, handler);
      mesh.send('a1', 'a2', 'ping');
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'a1', to: 'a2' })
      );
    });

    test('deve lancar erro se remetente nao existe', () => {
      mesh.join('a2');
      expect(() => mesh.send('ghost', 'a2', 'hi')).toThrow('not found');
    });

    test('deve lancar erro se destinatario nao existe', () => {
      mesh.join('a1');
      expect(() => mesh.send('a1', 'ghost', 'hi')).toThrow('not found');
    });

    test('deve incrementar messagesSent', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.send('a1', 'a2', 'msg1');
      mesh.send('a1', 'a2', 'msg2');
      expect(mesh.getStats().messagesSent).toBe(2);
    });

    test('deve clonar payload (nao compartilhar referencia)', () => {
      mesh.join('a1');
      mesh.join('a2');
      const payload = { data: [1, 2, 3] };
      const handler = jest.fn();
      mesh.on(MeshEvent.MESSAGE_RECEIVED, handler);
      mesh.send('a1', 'a2', payload);
      payload.data.push(4);
      expect(handler.mock.calls[0][0].payload.data).toEqual([1, 2, 3]);
    });

    test('deve enfileirar para peer offline', () => {
      mesh.join('a1');
      mesh.join('a2');

      // Simular peer offline
      mesh.peers.get('a2').state = PeerState.INACTIVE;

      mesh.send('a1', 'a2', 'offline-msg');
      expect(mesh.getQueueSize('a2')).toBe(1);
    });

    test('deve atualizar lastSeen do remetente', () => {
      mesh.join('a1');
      mesh.join('a2');
      const before = mesh.peers.get('a1').lastSeen;
      jest.advanceTimersByTime(100);
      mesh.send('a1', 'a2', 'ping');
      expect(mesh.peers.get('a1').lastSeen).toBeGreaterThanOrEqual(before);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       BROADCAST
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('broadcast()', () => {
    test('deve enviar para todos os peers ativos', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.join('a3');
      const result = mesh.broadcast('a1', 'hello everyone');
      expect(result.delivered).toBe(2);
      expect(result.totalTargets).toBe(2);
    });

    test('deve excluir remetente por padrao', () => {
      mesh.join('a1');
      mesh.join('a2');
      const handler = jest.fn();
      mesh.on(MeshEvent.MESSAGE_RECEIVED, handler);
      mesh.broadcast('a1', 'msg');
      const receivers = handler.mock.calls.map(c => c[0].to);
      expect(receivers).not.toContain('a1');
    });

    test('deve incluir remetente quando excludeSelf=false', () => {
      mesh.join('a1');
      mesh.join('a2');
      const handler = jest.fn();
      mesh.on(MeshEvent.MESSAGE_RECEIVED, handler);
      mesh.broadcast('a1', 'msg', { excludeSelf: false });
      const receivers = handler.mock.calls.map(c => c[0].to);
      expect(receivers).toContain('a1');
    });

    test('deve filtrar por topico', () => {
      mesh.join('a1', { topics: ['deploy'] });
      mesh.join('a2', { topics: ['deploy'] });
      mesh.join('a3', { topics: ['test'] });
      const result = mesh.broadcast('a1', 'deploy update', { topic: 'deploy' });
      expect(result.delivered).toBe(1); // a2 only, a1 excluded
      expect(result.totalTargets).toBe(1);
    });

    test('deve emitir evento broadcast', () => {
      mesh.join('a1');
      mesh.join('a2');
      const handler = jest.fn();
      mesh.on(MeshEvent.BROADCAST, handler);
      mesh.broadcast('a1', 'msg');
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'a1', deliveredTo: expect.any(Array) })
      );
    });

    test('deve incrementar messagesBroadcast', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.broadcast('a1', 'msg1');
      mesh.broadcast('a1', 'msg2');
      expect(mesh.getStats().messagesBroadcast).toBe(2);
    });

    test('deve enfileirar para peers offline', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.INACTIVE;
      const result = mesh.broadcast('a1', 'msg');
      expect(result.queued).toBe(1);
      expect(mesh.getQueueSize('a2')).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       REQUEST / RESPONSE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('request() & reply()', () => {
    test('deve resolver quando reply e chamado', async () => {
      mesh.join('a1');
      mesh.join('a2');

      const promise = mesh.request('a1', 'a2', { q: 'status?' });

      // Pegar o messageId da request enviada
      const sentEvents = [];
      mesh.on(MeshEvent.MESSAGE_SENT, (e) => sentEvents.push(e));

      // O promise ja foi criado, precisamos encontrar o pending request
      const [requestId] = Array.from(mesh.pendingRequests.keys());

      mesh.reply('a2', requestId, { status: 'ok' });

      const response = await promise;
      expect(response.from).toBe('a2');
      expect(response.payload.status).toBe('ok');
    });

    test('deve rejeitar com timeout', async () => {
      mesh.join('a1');
      mesh.join('a2');

      const promise = mesh.request('a1', 'a2', 'ping', { timeout: 1000 });

      jest.advanceTimersByTime(1100);

      await expect(promise).rejects.toThrow('timed out');
    });

    test('reply deve retornar false para request inexistente', () => {
      mesh.join('a1');
      expect(mesh.reply('a1', 'fake-id', 'nope')).toBe(false);
    });

    test('reply deve lancar erro para peer inexistente', () => {
      expect(() => mesh.reply('ghost', 'id', 'data')).toThrow('not found');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       TOPICS / PUB-SUB
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('subscribe() / unsubscribe()', () => {
    test('deve inscrever peer em topico', () => {
      mesh.join('a1');
      mesh.subscribe('a1', 'deploy');
      expect(mesh.getTopicSubscribers('deploy')).toContain('a1');
    });

    test('deve desinscrever peer de topico', () => {
      mesh.join('a1');
      mesh.subscribe('a1', 'deploy');
      mesh.unsubscribe('a1', 'deploy');
      expect(mesh.getTopicSubscribers('deploy')).not.toContain('a1');
    });

    test('deve remover topico vazio', () => {
      mesh.join('a1');
      mesh.subscribe('a1', 'deploy');
      mesh.unsubscribe('a1', 'deploy');
      expect(mesh.topics.has('deploy')).toBe(false);
    });

    test('deve lancar erro para peer inexistente', () => {
      expect(() => mesh.subscribe('ghost', 'topic')).toThrow('not found');
      expect(() => mesh.unsubscribe('ghost', 'topic')).toThrow('not found');
    });

    test('deve lancar erro para topico invalido', () => {
      mesh.join('a1');
      expect(() => mesh.subscribe('a1', '')).toThrow('topic is required');
      expect(() => mesh.subscribe('a1', null)).toThrow('topic is required');
    });

    test('getTopicSubscribers deve retornar array vazio para topico inexistente', () => {
      expect(mesh.getTopicSubscribers('ghost')).toEqual([]);
    });

    test('deve suportar multiplos subscribers por topico', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.join('a3');
      mesh.subscribe('a1', 'events');
      mesh.subscribe('a2', 'events');
      mesh.subscribe('a3', 'events');
      expect(mesh.getTopicSubscribers('events')).toHaveLength(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       ROUTING & TOPOLOGY
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('getShortestPath()', () => {
    test('deve retornar caminho direto entre adjacentes', () => {
      mesh.join('a1');
      mesh.join('a2');
      const route = mesh.getShortestPath('a1', 'a2');
      expect(route).toEqual(['a1', 'a2']);
    });

    test('deve retornar [self] para mesmo peer', () => {
      mesh.join('a1');
      expect(mesh.getShortestPath('a1', 'a1')).toEqual(['a1']);
    });

    test('deve retornar null para peer inexistente', () => {
      mesh.join('a1');
      expect(mesh.getShortestPath('a1', 'ghost')).toBeNull();
      expect(mesh.getShortestPath('ghost', 'a1')).toBeNull();
    });

    test('deve encontrar caminho multi-hop', () => {
      // Criar topologia: a1 - a2 - a3 (remover adjacencia direta a1-a3)
      mesh.join('a1');
      mesh.join('a2');
      mesh.join('a3');

      // Remover adjacencia direta a1<->a3
      mesh.adjacency.get('a1').delete('a3');
      mesh.adjacency.get('a3').delete('a1');

      const route = mesh.getShortestPath('a1', 'a3');
      expect(route).toEqual(['a1', 'a2', 'a3']);
    });

    test('deve retornar null quando nao ha caminho', () => {
      mesh.join('a1');
      mesh.join('a2');

      // Remover toda adjacencia
      mesh.adjacency.get('a1').clear();
      mesh.adjacency.get('a2').clear();

      expect(mesh.getShortestPath('a1', 'a2')).toBeNull();
    });
  });

  describe('getRoute()', () => {
    test('deve ser alias para getShortestPath', () => {
      mesh.join('a1');
      mesh.join('a2');
      expect(mesh.getRoute('a1', 'a2')).toEqual(mesh.getShortestPath('a1', 'a2'));
    });
  });

  describe('getTopology()', () => {
    test('deve retornar topologia vazia para mesh vazia', () => {
      const topo = mesh.getTopology();
      expect(topo.nodes).toEqual([]);
      expect(topo.edges).toEqual([]);
      expect(topo.peerCount).toBe(0);
    });

    test('deve retornar nos e arestas', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.join('a3');
      const topo = mesh.getTopology();
      expect(topo.peerCount).toBe(3);
      expect(topo.edgeCount).toBe(3); // fully connected: 3 edges
      expect(topo.nodes).toHaveLength(3);
    });

    test('deve evitar arestas duplicadas', () => {
      mesh.join('a1');
      mesh.join('a2');
      const topo = mesh.getTopology();
      // a1-a2 aparece apenas uma vez
      expect(topo.edges).toHaveLength(1);
    });

    test('deve incluir timestamp', () => {
      const topo = mesh.getTopology();
      expect(topo.timestamp).toBeDefined();
      expect(typeof topo.timestamp).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       MESSAGE QUEUE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('message queue', () => {
    test('getQueuedMessages deve retornar mensagens enfileiradas', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.INACTIVE;
      mesh.send('a1', 'a2', { data: 'queued' });
      const msgs = mesh.getQueuedMessages('a2');
      expect(msgs).toHaveLength(1);
      expect(msgs[0].payload.data).toBe('queued');
    });

    test('getQueueSize deve retornar tamanho da fila', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.INACTIVE;
      mesh.send('a1', 'a2', 'msg1');
      mesh.send('a1', 'a2', 'msg2');
      expect(mesh.getQueueSize('a2')).toBe(2);
    });

    test('purgeQueue deve limpar a fila', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.INACTIVE;
      mesh.send('a1', 'a2', 'msg');
      const purged = mesh.purgeQueue('a2');
      expect(purged).toBe(1);
      expect(mesh.getQueueSize('a2')).toBe(0);
    });

    test('purgeQueue deve retornar 0 para fila inexistente', () => {
      expect(mesh.purgeQueue('ghost')).toBe(0);
    });

    test('getQueuedMessages deve retornar vazio para peer sem fila', () => {
      expect(mesh.getQueuedMessages('ghost')).toEqual([]);
    });

    test('deve emitir queue-overflow quando fila cheia', () => {
      const ctx = createMesh({ maxQueueSize: 2 });
      const m = ctx.mesh;
      m.join('a1');
      m.join('a2');
      m.peers.get('a2').state = PeerState.INACTIVE;

      const handler = jest.fn();
      m.on(MeshEvent.QUEUE_OVERFLOW, handler);

      m.send('a1', 'a2', 'msg1');
      m.send('a1', 'a2', 'msg2');
      m.send('a1', 'a2', 'msg3'); // overflow

      expect(handler).toHaveBeenCalledTimes(1);
      expect(m.getQueueSize('a2')).toBe(2);
      expect(m.getStats().messagesDropped).toBe(1);

      m.destroy();
      cleanupDir(ctx.tmpDir);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       RATE LIMITING
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('rate limiting', () => {
    test('deve permitir envios dentro do limite', () => {
      const ctx = createMesh({ rateLimit: { tokensPerInterval: 5, interval: 60000 } });
      const m = ctx.mesh;
      m.join('a1');
      m.join('a2');

      expect(() => {
        for (let i = 0; i < 5; i++) {
          m.send('a1', 'a2', `msg${i}`);
        }
      }).not.toThrow();

      m.destroy();
      cleanupDir(ctx.tmpDir);
    });

    test('deve bloquear envios acima do limite', () => {
      const ctx = createMesh({ rateLimit: { tokensPerInterval: 3, interval: 60000 } });
      const m = ctx.mesh;
      m.join('a1');
      m.join('a2');

      m.send('a1', 'a2', 'msg1');
      m.send('a1', 'a2', 'msg2');
      m.send('a1', 'a2', 'msg3');

      expect(() => m.send('a1', 'a2', 'msg4')).toThrow('Rate limit exceeded');

      m.destroy();
      cleanupDir(ctx.tmpDir);
    });

    test('deve reabastecer tokens apos intervalo', () => {
      const ctx = createMesh({ rateLimit: { tokensPerInterval: 2, interval: 1000 } });
      const m = ctx.mesh;
      m.join('a1');
      m.join('a2');

      m.send('a1', 'a2', 'msg1');
      m.send('a1', 'a2', 'msg2');
      expect(() => m.send('a1', 'a2', 'msg3')).toThrow('Rate limit');

      jest.advanceTimersByTime(1000);

      expect(() => m.send('a1', 'a2', 'msg4')).not.toThrow();

      m.destroy();
      cleanupDir(ctx.tmpDir);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       HEARTBEAT & PRUNING
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('heartbeat & pruning', () => {
    test('deve detectar peers com timeout', () => {
      mesh.join('a1');
      mesh.join('a2');

      const handler = jest.fn();
      mesh.on(MeshEvent.PEER_TIMEOUT, handler);

      // Avançar tempo alem do peerTimeout
      jest.advanceTimersByTime(4000);
      mesh._runHeartbeat();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: expect.any(String) })
      );
    });

    test('deve marcar peer como timeout', () => {
      mesh.join('a1');
      jest.advanceTimersByTime(4000);
      mesh._runHeartbeat();
      expect(mesh.peers.get('a1').state).toBe(PeerState.TIMEOUT);
    });

    test('deve remover adjacencias de peer timeout', () => {
      mesh.join('a1');
      mesh.join('a2');
      jest.advanceTimersByTime(4000);
      mesh._runHeartbeat();
      expect(mesh.adjacency.get('a1').size).toBe(0);
      expect(mesh.adjacency.get('a2').size).toBe(0);
    });

    test('nao deve marcar peer ativo com timeout', () => {
      mesh.join('a1');
      mesh.join('a2');

      jest.advanceTimersByTime(2000);
      mesh.send('a1', 'a2', 'keep-alive'); // atualiza lastSeen de a1

      jest.advanceTimersByTime(2000);
      mesh._runHeartbeat();

      // a1 enviou mensagem recentemente, nao deveria ter timeout
      expect(mesh.peers.get('a1').state).toBe(PeerState.ACTIVE);
    });

    test('startHeartbeat deve iniciar timer', () => {
      mesh.startHeartbeat();
      expect(mesh._heartbeatTimer).not.toBeNull();
      expect(mesh._started).toBe(true);
    });

    test('stopHeartbeat deve parar timer', () => {
      mesh.startHeartbeat();
      mesh.stopHeartbeat();
      expect(mesh._heartbeatTimer).toBeNull();
      expect(mesh._started).toBe(false);
    });

    test('startHeartbeat duplo nao deve criar dois timers', () => {
      mesh.startHeartbeat();
      const timer1 = mesh._heartbeatTimer;
      mesh.startHeartbeat();
      expect(mesh._heartbeatTimer).toBe(timer1);
    });

    test('deve purge mensagens expiradas na fila durante heartbeat', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.INACTIVE;

      mesh.send('a1', 'a2', 'will-expire');
      expect(mesh.getQueueSize('a2')).toBe(1);

      // Avançar tempo alem do messageTTL (5000ms)
      jest.advanceTimersByTime(6000);
      mesh._runHeartbeat();

      expect(mesh.getQueueSize('a2')).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       PARTITION DETECTION
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('detectPartitions()', () => {
    test('deve retornar uma unica particao para rede conectada', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.join('a3');
      const partitions = mesh.detectPartitions();
      expect(partitions).toHaveLength(1);
      expect(partitions[0]).toHaveLength(3);
    });

    test('deve detectar duas particoes', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.join('a3');
      mesh.join('a4');

      // Desconectar a1,a2 de a3,a4
      mesh.adjacency.get('a1').delete('a3');
      mesh.adjacency.get('a1').delete('a4');
      mesh.adjacency.get('a2').delete('a3');
      mesh.adjacency.get('a2').delete('a4');
      mesh.adjacency.get('a3').delete('a1');
      mesh.adjacency.get('a3').delete('a2');
      mesh.adjacency.get('a4').delete('a1');
      mesh.adjacency.get('a4').delete('a2');

      const partitions = mesh.detectPartitions();
      expect(partitions).toHaveLength(2);
    });

    test('deve emitir partition-detected quando ha split', () => {
      mesh.join('a1');
      mesh.join('a2');

      mesh.adjacency.get('a1').clear();
      mesh.adjacency.get('a2').clear();

      const handler = jest.fn();
      mesh.on(MeshEvent.PARTITION_DETECTED, handler);
      mesh.detectPartitions();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('nao deve emitir para rede conectada', () => {
      mesh.join('a1');
      mesh.join('a2');
      const handler = jest.fn();
      mesh.on(MeshEvent.PARTITION_DETECTED, handler);
      mesh.detectPartitions();
      expect(handler).not.toHaveBeenCalled();
    });

    test('deve retornar array vazio para mesh vazia', () => {
      expect(mesh.detectPartitions()).toEqual([]);
    });

    test('deve ignorar peers com timeout', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.TIMEOUT;
      const partitions = mesh.detectPartitions();
      expect(partitions).toHaveLength(1);
      expect(partitions[0]).toEqual(['a1']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       NETWORK HEALTH & STATS
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('getNetworkHealth()', () => {
    test('deve retornar saude 1.0 para rede vazia', () => {
      const health = mesh.getNetworkHealth();
      expect(health.healthScore).toBe(1.0);
      expect(health.totalPeers).toBe(0);
    });

    test('deve retornar saude 1.0 para rede saudavel', () => {
      mesh.join('a1');
      mesh.join('a2');
      const health = mesh.getNetworkHealth();
      expect(health.healthScore).toBe(1.0);
      expect(health.activePeers).toBe(2);
    });

    test('deve reduzir score com peers inativos', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.TIMEOUT;
      const health = mesh.getNetworkHealth();
      expect(health.healthScore).toBeLessThan(1.0);
      expect(health.inactivePeers).toBe(1);
    });

    test('deve incluir contagem de filas', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.peers.get('a2').state = PeerState.INACTIVE;
      mesh.send('a1', 'a2', 'queued');
      const health = mesh.getNetworkHealth();
      expect(health.totalQueuedMessages).toBe(1);
    });
  });

  describe('getMeshStats()', () => {
    test('deve retornar estatisticas completas', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.send('a1', 'a2', 'msg');
      mesh.subscribe('a1', 'topic1');

      const stats = mesh.getMeshStats();
      expect(stats.messagesSent).toBe(1);
      expect(stats.topology.peerCount).toBe(2);
      expect(stats.topics.count).toBe(1);
      expect(stats.topics.subscriptions).toBe(1);
      expect(stats.health).toBeDefined();
      expect(stats.queues).toBeDefined();
    });
  });

  describe('getStats()', () => {
    test('deve retornar estatisticas basicas', () => {
      mesh.join('a1');
      const stats = mesh.getStats();
      expect(stats.peerCount).toBe(1);
      expect(stats.topicCount).toBe(0);
      expect(stats.pendingRequests).toBe(0);
      expect(stats.timestamp).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('persistence', () => {
    test('save() deve criar arquivo de topologia', async () => {
      mesh.join('a1', { capabilities: ['coding'] });
      await mesh.save();

      const filePath = path.resolve(tmpDir, '.aiox/mesh/topology.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(data.schemaVersion).toBe('agent-mesh-v1');
      expect(data.peers).toHaveLength(1);
      expect(data.peers[0].id).toBe('a1');
    });

    test('load() deve restaurar topologia do disco', async () => {
      mesh.join('a1', { capabilities: ['coding'], topics: ['deploy'] });
      mesh.join('a2');
      await mesh.save();

      // Criar nova instancia e carregar
      const mesh2 = new AgentMeshNetwork(tmpDir, { autoStart: false });
      const loaded = await mesh2.load();
      expect(loaded).toBe(true);
      expect(mesh2.peers.size).toBe(2);

      const peer = mesh2.getPeer('a1');
      expect(peer.capabilities).toEqual(['coding']);
      expect(peer.topics).toContain('deploy');

      mesh2.destroy();
    });

    test('load() deve retornar false se arquivo nao existe', async () => {
      const ctx = createMesh();
      const loaded = await ctx.mesh.load();
      expect(loaded).toBe(false);
      ctx.mesh.destroy();
      cleanupDir(ctx.tmpDir);
    });

    test('load() deve retornar false para arquivo corrompido', async () => {
      const dir = path.resolve(tmpDir, '.aiox/mesh');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'topology.json'), 'INVALID JSON', 'utf-8');

      const loaded = await mesh.load();
      expect(loaded).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       ROUTING (MULTI-HOP)
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('message routing (multi-hop)', () => {
    test('deve rotear mensagem via peer intermediario', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.join('a3');

      // Remover adjacencia direta a1<->a3
      mesh.adjacency.get('a1').delete('a3');
      mesh.adjacency.get('a3').delete('a1');

      const handler = jest.fn();
      mesh.on(MeshEvent.ROUTE_FOUND, handler);

      mesh.send('a1', 'a3', 'routed-msg');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'a1',
          to: 'a3',
          hops: ['a2'],
        })
      );
      expect(mesh.getStats().messagesRouted).toBe(1);
    });

    test('deve enfileirar quando nao ha rota', () => {
      mesh.join('a1');
      mesh.join('a2');

      // Desconectar completamente
      mesh.adjacency.get('a1').clear();
      mesh.adjacency.get('a2').clear();

      mesh.send('a1', 'a2', 'no-route');
      expect(mesh.getQueueSize('a2')).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       DESTROY
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('destroy()', () => {
    test('deve limpar todos os recursos', () => {
      mesh.join('a1');
      mesh.join('a2');
      mesh.subscribe('a1', 'topic');
      mesh.startHeartbeat();

      mesh.destroy();

      expect(mesh.peers.size).toBe(0);
      expect(mesh.adjacency.size).toBe(0);
      expect(mesh.topics.size).toBe(0);
      expect(mesh.queues.size).toBe(0);
      expect(mesh._heartbeatTimer).toBeNull();
    });

    test('deve rejeitar pending requests', async () => {
      mesh.join('a1');
      mesh.join('a2');

      const promise = mesh.request('a1', 'a2', 'ping');
      mesh.destroy();

      await expect(promise).rejects.toThrow('destroyed');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  //                       SAFE EMIT
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('_emitSafe()', () => {
    test('nao deve lancar erro quando nao ha listener para error', () => {
      expect(() => {
        mesh._emitSafe('error', new Error('test'));
      }).not.toThrow();
    });

    test('deve emitir error quando ha listener', () => {
      const handler = jest.fn();
      mesh.on('error', handler);
      mesh._emitSafe('error', new Error('test'));
      expect(handler).toHaveBeenCalled();
    });

    test('deve emitir eventos normais', () => {
      const handler = jest.fn();
      mesh.on('custom-event', handler);
      mesh._emitSafe('custom-event', { data: 1 });
      expect(handler).toHaveBeenCalledWith({ data: 1 });
    });
  });
});
