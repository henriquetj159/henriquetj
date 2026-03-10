/**
 * Agent Mesh Network - Rede P2P Descentralizada entre Agentes
 *
 * Comunicacao peer-to-peer descentralizada. Agentes se descobrem,
 * formam grupos ad-hoc, transmitem mensagens e roteiam atraves
 * da mesh. Como uma rede neural de agentes.
 *
 * Features:
 * - Peer Discovery: registro e descoberta automatica
 * - Direct Messaging: agente A para agente B
 * - Broadcast & Topics: pub/sub com grupos por topico
 * - Message Routing: multi-hop via BFS shortest path
 * - Heartbeat & Pruning: deteccao de peers desconectados
 * - Message Queue: buffer para peers offline com TTL
 * - Rate Limiting: token bucket por agente
 * - Network Partitioning: deteccao de splits via DFS
 * - Mesh Topology: grafo de adjacencia com metricas
 *
 * @module core/communication/agent-mesh-network
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════════
//                              CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════════

const DEFAULT_OPTIONS = {
  heartbeatInterval: 30000,
  peerTimeout: 90000,
  maxQueueSize: 100,
  messageTTL: 300000,
  requestTimeout: 10000,
  rateLimit: {
    tokensPerInterval: 50,
    interval: 60000,
  },
  persistenceDir: '.aiox/mesh',
  autoStart: true,
};

const MessageType = {
  DIRECT: 'direct',
  BROADCAST: 'broadcast',
  REQUEST: 'request',
  RESPONSE: 'response',
  PUBSUB: 'pubsub',
};

const PeerState = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TIMEOUT: 'timeout',
};

const MeshEvent = {
  PEER_JOINED: 'peer-joined',
  PEER_LEFT: 'peer-left',
  PEER_TIMEOUT: 'peer-timeout',
  MESSAGE_SENT: 'message-sent',
  MESSAGE_RECEIVED: 'message-received',
  BROADCAST: 'broadcast',
  ROUTE_FOUND: 'route-found',
  PARTITION_DETECTED: 'partition-detected',
  QUEUE_OVERFLOW: 'queue-overflow',
};

// ═══════════════════════════════════════════════════════════════════════════════════
//                              AGENT MESH NETWORK
// ═══════════════════════════════════════════════════════════════════════════════════

class AgentMeshNetwork extends EventEmitter {
  /**
   * @param {string} projectRoot - Diretorio raiz do projeto
   * @param {Object} [options] - Opcoes de configuracao
   * @param {number} [options.heartbeatInterval=30000] - Intervalo do heartbeat em ms
   * @param {number} [options.peerTimeout=90000] - Timeout para pruning de peers em ms
   * @param {number} [options.maxQueueSize=100] - Tamanho maximo da fila por peer
   * @param {number} [options.messageTTL=300000] - TTL de mensagens na fila em ms
   * @param {number} [options.requestTimeout=10000] - Timeout para request/response em ms
   * @param {Object} [options.rateLimit] - Configuracao de rate limiting
   * @param {string} [options.persistenceDir='.aiox/mesh'] - Diretorio de persistencia
   * @param {boolean} [options.autoStart=true] - Iniciar heartbeat automaticamente
   */
  constructor(projectRoot, options = {}) {
    super();

    this.projectRoot = projectRoot ?? process.cwd();
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      rateLimit: {
        ...DEFAULT_OPTIONS.rateLimit,
        ...(options.rateLimit ?? {}),
      },
    };

    /** @type {Map<string, Object>} Mapa de peers registrados */
    this.peers = new Map();

    /** @type {Map<string, Set<string>>} Lista de adjacencia do grafo */
    this.adjacency = new Map();

    /** @type {Map<string, Set<string>>} Mapa de topico -> subscribers */
    this.topics = new Map();

    /** @type {Map<string, Array>} Fila de mensagens por peer */
    this.queues = new Map();

    /** @type {Map<string, Object>} Token buckets para rate limiting */
    this.rateLimiters = new Map();

    /** @type {Map<string, Object>} Pending requests aguardando resposta */
    this.pendingRequests = new Map();

    /** @type {Object} Estatisticas da rede */
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDropped: 0,
      messagesBroadcast: 0,
      messagesRouted: 0,
      messagesQueued: 0,
      peersJoined: 0,
      peersLeft: 0,
      peersTimedOut: 0,
      partitionsDetected: 0,
    };

    /** @type {number|null} Referencia do intervalo de heartbeat */
    this._heartbeatTimer = null;

    /** @type {Promise} Cadeia de persistencia serializada */
    this._writeChain = Promise.resolve();

    this._started = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           PEER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Registra um agente na mesh network
   * @param {string} agentId - Identificador unico do agente
   * @param {Object} [meta] - Metadados do agente
   * @param {string[]} [meta.capabilities] - Capacidades do agente
   * @param {string[]} [meta.topics] - Topicos para inscrever automaticamente
   * @returns {Object} Dados do peer registrado
   */
  join(agentId, meta = {}) {
    if (!agentId || typeof agentId !== 'string') {
      throw new Error('agentId is required and must be a string');
    }

    if (this.peers.has(agentId)) {
      throw new Error(`Peer "${agentId}" already exists in the mesh`);
    }

    const peer = {
      id: agentId,
      capabilities: meta.capabilities ?? [],
      topics: new Set(meta.topics ?? []),
      state: PeerState.ACTIVE,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      messageCount: 0,
    };

    this.peers.set(agentId, peer);
    this.adjacency.set(agentId, new Set());
    this.queues.set(agentId, []);
    this._initRateLimiter(agentId);

    // Auto-subscribe aos topicos
    for (const topic of peer.topics) {
      this._addToTopic(agentId, topic);
    }

    // Conectar ao mesh — adicionar adjacencia bidirecional com todos os peers ativos
    for (const [existingId, existingPeer] of this.peers) {
      if (existingId !== agentId && existingPeer.state === PeerState.ACTIVE) {
        this.adjacency.get(agentId).add(existingId);
        this.adjacency.get(existingId).add(agentId);
      }
    }

    this.stats.peersJoined++;
    this._emitSafe(MeshEvent.PEER_JOINED, { agentId, capabilities: peer.capabilities });
    this._schedulePersist();

    return this._serializePeer(peer);
  }

  /**
   * Remove um agente da mesh network
   * @param {string} agentId - Identificador do agente
   * @returns {boolean} true se removido com sucesso
   */
  leave(agentId) {
    const peer = this.peers.get(agentId);
    if (!peer) return false;

    // Remover de todos os topicos
    for (const topic of peer.topics) {
      this._removeFromTopic(agentId, topic);
    }

    // Remover adjacencias
    const neighbors = this.adjacency.get(agentId);
    if (neighbors) {
      for (const neighborId of neighbors) {
        const neighborAdj = this.adjacency.get(neighborId);
        if (neighborAdj) neighborAdj.delete(agentId);
      }
    }

    this.adjacency.delete(agentId);
    this.peers.delete(agentId);
    this.queues.delete(agentId);
    this.rateLimiters.delete(agentId);

    this.stats.peersLeft++;
    this._emitSafe(MeshEvent.PEER_LEFT, { agentId });
    this._schedulePersist();

    return true;
  }

  /**
   * Retorna dados de um peer especifico
   * @param {string} agentId - Identificador do agente
   * @returns {Object|null} Dados do peer ou null
   */
  getPeer(agentId) {
    const peer = this.peers.get(agentId);
    return peer ? this._serializePeer(peer) : null;
  }

  /**
   * Lista peers com filtros opcionais
   * @param {Object} [filters] - Filtros de busca
   * @param {string} [filters.topic] - Filtrar por topico
   * @param {string} [filters.capability] - Filtrar por capacidade
   * @returns {Object[]} Lista de peers
   */
  listPeers(filters = {}) {
    let peers = Array.from(this.peers.values());

    if (filters.topic) {
      const subscribers = this.topics.get(filters.topic);
      if (subscribers) {
        peers = peers.filter(p => subscribers.has(p.id));
      } else {
        peers = [];
      }
    }

    if (filters.capability) {
      peers = peers.filter(p => p.capabilities.includes(filters.capability));
    }

    return peers.map(p => this._serializePeer(p));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           MESSAGING
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Envia uma mensagem direta de um agente para outro
   * @param {string} fromId - Remetente
   * @param {string} toId - Destinatario
   * @param {*} message - Conteudo da mensagem
   * @param {Object} [opts] - Opcoes
   * @param {string} [opts.type='direct'] - Tipo da mensagem
   * @param {number} [opts.ttl] - Time-to-live em ms
   * @returns {Object} Mensagem enviada
   */
  send(fromId, toId, message, opts = {}) {
    this._validatePeer(fromId);
    this._checkRateLimit(fromId);

    const type = opts.type ?? MessageType.DIRECT;
    const ttl = opts.ttl ?? this.options.messageTTL;

    const msg = {
      id: randomUUID(),
      from: fromId,
      to: toId,
      type,
      payload: this._deepClone(message),
      ttl,
      createdAt: Date.now(),
      hops: [],
    };

    const toPeer = this.peers.get(toId);

    // Peer nao existe
    if (!toPeer) {
      throw new Error(`Peer "${toId}" not found in the mesh`);
    }

    // Peer esta ativo e adjacente — entrega direta
    if (toPeer.state === PeerState.ACTIVE && this._isAdjacent(fromId, toId)) {
      this._deliverMessage(msg);
    } else if (toPeer.state === PeerState.ACTIVE) {
      // Tenta rotear via mesh
      const route = this.getShortestPath(fromId, toId);
      if (route) {
        msg.hops = route.slice(1, -1);
        this.stats.messagesRouted++;
        this._emitSafe(MeshEvent.ROUTE_FOUND, { from: fromId, to: toId, hops: msg.hops });
        this._deliverMessage(msg);
      } else {
        // Sem rota — enfileirar
        this._enqueueMessage(toId, msg);
      }
    } else {
      // Peer offline — enfileirar
      this._enqueueMessage(toId, msg);
    }

    this.stats.messagesSent++;
    this._updateLastSeen(fromId);
    this._emitSafe(MeshEvent.MESSAGE_SENT, { messageId: msg.id, from: fromId, to: toId, type });

    return { id: msg.id, from: fromId, to: toId, type, createdAt: msg.createdAt };
  }

  /**
   * Envia broadcast para todos os peers ou para um topico
   * @param {string} fromId - Remetente
   * @param {*} message - Conteudo da mensagem
   * @param {Object} [opts] - Opcoes
   * @param {string} [opts.topic] - Topico alvo (se omitido, todos os peers)
   * @param {boolean} [opts.excludeSelf=true] - Excluir remetente
   * @returns {Object} Resumo do broadcast
   */
  broadcast(fromId, message, opts = {}) {
    this._validatePeer(fromId);
    this._checkRateLimit(fromId);

    const excludeSelf = opts.excludeSelf ?? true;
    let targets;

    if (opts.topic) {
      const subscribers = this.topics.get(opts.topic);
      targets = subscribers ? Array.from(subscribers) : [];
    } else {
      targets = Array.from(this.peers.keys());
    }

    if (excludeSelf) {
      targets = targets.filter(id => id !== fromId);
    }

    const msgId = randomUUID();
    const delivered = [];

    for (const toId of targets) {
      const toPeer = this.peers.get(toId);
      if (!toPeer) continue;

      const msg = {
        id: randomUUID(),
        broadcastId: msgId,
        from: fromId,
        to: toId,
        type: MessageType.BROADCAST,
        topic: opts.topic ?? null,
        payload: this._deepClone(message),
        ttl: this.options.messageTTL,
        createdAt: Date.now(),
        hops: [],
      };

      if (toPeer.state === PeerState.ACTIVE) {
        this._deliverMessage(msg);
        delivered.push(toId);
      } else {
        this._enqueueMessage(toId, msg);
      }
    }

    this.stats.messagesBroadcast++;
    this._updateLastSeen(fromId);
    this._emitSafe(MeshEvent.BROADCAST, {
      broadcastId: msgId,
      from: fromId,
      topic: opts.topic ?? null,
      deliveredTo: delivered,
      totalTargets: targets.length,
    });

    return {
      broadcastId: msgId,
      from: fromId,
      topic: opts.topic ?? null,
      delivered: delivered.length,
      queued: targets.length - delivered.length,
      totalTargets: targets.length,
    };
  }

  /**
   * Envia uma request e aguarda response
   * @param {string} fromId - Remetente
   * @param {string} toId - Destinatario
   * @param {*} message - Conteudo da request
   * @param {Object} [opts] - Opcoes
   * @param {number} [opts.timeout] - Timeout da request em ms
   * @returns {Promise<Object>} Response do destinatario
   */
  request(fromId, toId, message, opts = {}) {
    const timeout = opts.timeout ?? this.options.requestTimeout;

    const sent = this.send(fromId, toId, message, { type: MessageType.REQUEST });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(sent.id);
        reject(new Error(`Request to "${toId}" timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(sent.id, {
        resolve: (response) => {
          clearTimeout(timer);
          this.pendingRequests.delete(sent.id);
          resolve(response);
        },
        reject: (err) => {
          clearTimeout(timer);
          this.pendingRequests.delete(sent.id);
          reject(err);
        },
        timer,
      });
    });
  }

  /**
   * Responde a uma request
   * @param {string} fromId - Remetente da resposta
   * @param {string} originalMessageId - ID da mensagem original
   * @param {*} response - Conteudo da resposta
   * @returns {boolean} true se a resposta foi entregue
   */
  reply(fromId, originalMessageId, response) {
    this._validatePeer(fromId);

    const pending = this.pendingRequests.get(originalMessageId);
    if (!pending) return false;

    pending.resolve({
      from: fromId,
      originalMessageId,
      payload: this._deepClone(response),
      respondedAt: Date.now(),
    });

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           TOPICS / PUB-SUB
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Inscreve um agente em um topico
   * @param {string} agentId - Identificador do agente
   * @param {string} topic - Nome do topico
   * @returns {boolean} true se inscrito com sucesso
   */
  subscribe(agentId, topic) {
    this._validatePeer(agentId);
    if (!topic || typeof topic !== 'string') {
      throw new Error('topic is required and must be a string');
    }

    const peer = this.peers.get(agentId);
    peer.topics.add(topic);
    this._addToTopic(agentId, topic);

    return true;
  }

  /**
   * Remove inscricao de um agente em um topico
   * @param {string} agentId - Identificador do agente
   * @param {string} topic - Nome do topico
   * @returns {boolean} true se removido com sucesso
   */
  unsubscribe(agentId, topic) {
    this._validatePeer(agentId);

    const peer = this.peers.get(agentId);
    peer.topics.delete(topic);
    this._removeFromTopic(agentId, topic);

    return true;
  }

  /**
   * Retorna subscribers de um topico
   * @param {string} topic - Nome do topico
   * @returns {string[]} Lista de agentIds inscritos
   */
  getTopicSubscribers(topic) {
    const subscribers = this.topics.get(topic);
    return subscribers ? Array.from(subscribers) : [];
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           ROUTING & TOPOLOGY
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Retorna a rota entre dois peers (alias para getShortestPath)
   * @param {string} fromId - Origem
   * @param {string} toId - Destino
   * @returns {string[]|null} Rota ou null se nao encontrada
   */
  getRoute(fromId, toId) {
    return this.getShortestPath(fromId, toId);
  }

  /**
   * Calcula o menor caminho entre dois peers via BFS
   * @param {string} fromId - Origem
   * @param {string} toId - Destino
   * @returns {string[]|null} Caminho mais curto ou null
   */
  getShortestPath(fromId, toId) {
    if (!this.peers.has(fromId) || !this.peers.has(toId)) return null;
    if (fromId === toId) return [fromId];

    const visited = new Set();
    const queue = [[fromId]];
    visited.add(fromId);

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const currentNode = currentPath[currentPath.length - 1];

      const neighbors = this.adjacency.get(currentNode);
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (neighbor === toId) {
          return [...currentPath, neighbor];
        }
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...currentPath, neighbor]);
        }
      }
    }

    return null;
  }

  /**
   * Retorna a topologia atual da mesh
   * @returns {Object} Topologia com peers e conexoes
   */
  getTopology() {
    const nodes = [];
    const edges = [];
    const edgeSet = new Set();

    for (const [id, peer] of this.peers) {
      nodes.push(this._serializePeer(peer));

      const neighbors = this.adjacency.get(id);
      if (neighbors) {
        for (const neighborId of neighbors) {
          const edgeKey = [id, neighborId].sort().join('::');
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({ from: id, to: neighborId });
          }
        }
      }
    }

    return {
      nodes,
      edges,
      peerCount: this.peers.size,
      edgeCount: edges.length,
      timestamp: Date.now(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           MESSAGE QUEUE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Retorna mensagens enfileiradas para um peer
   * @param {string} agentId - Identificador do agente
   * @returns {Object[]} Mensagens na fila
   */
  getQueuedMessages(agentId) {
    const queue = this.queues.get(agentId);
    if (!queue) return [];
    return queue.map(msg => ({
      id: msg.id,
      from: msg.from,
      type: msg.type,
      payload: msg.payload,
      createdAt: msg.createdAt,
      ttl: msg.ttl,
    }));
  }

  /**
   * Retorna o tamanho da fila de um peer
   * @param {string} agentId - Identificador do agente
   * @returns {number} Numero de mensagens na fila
   */
  getQueueSize(agentId) {
    const queue = this.queues.get(agentId);
    return queue ? queue.length : 0;
  }

  /**
   * Limpa a fila de mensagens de um peer
   * @param {string} agentId - Identificador do agente
   * @returns {number} Numero de mensagens removidas
   */
  purgeQueue(agentId) {
    const queue = this.queues.get(agentId);
    if (!queue) return 0;
    const count = queue.length;
    this.queues.set(agentId, []);
    return count;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           HEALTH & PARTITIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Retorna saude geral da rede
   * @returns {Object} Indicadores de saude
   */
  getNetworkHealth() {
    const totalPeers = this.peers.size;
    const activePeers = Array.from(this.peers.values())
      .filter(p => p.state === PeerState.ACTIVE).length;
    const partitions = this.detectPartitions();
    const totalQueuedMessages = Array.from(this.queues.values())
      .reduce((sum, q) => sum + q.length, 0);

    const healthScore = totalPeers === 0 ? 1.0 :
      (activePeers / totalPeers) * (partitions.length <= 1 ? 1.0 : 0.5);

    return {
      totalPeers,
      activePeers,
      inactivePeers: totalPeers - activePeers,
      partitionCount: partitions.length,
      partitions,
      totalQueuedMessages,
      healthScore: Math.round(healthScore * 100) / 100,
      timestamp: Date.now(),
    };
  }

  /**
   * Detecta particoes na rede usando DFS para componentes conexos
   * @returns {string[][]} Array de particoes (cada uma e um array de agentIds)
   */
  detectPartitions() {
    const visited = new Set();
    const partitions = [];

    const activePeers = Array.from(this.peers.entries())
      .filter(([, p]) => p.state === PeerState.ACTIVE)
      .map(([id]) => id);

    for (const peerId of activePeers) {
      if (visited.has(peerId)) continue;

      const component = [];
      const stack = [peerId];

      while (stack.length > 0) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        component.push(current);

        const neighbors = this.adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              const neighborPeer = this.peers.get(neighbor);
              if (neighborPeer && neighborPeer.state === PeerState.ACTIVE) {
                stack.push(neighbor);
              }
            }
          }
        }
      }

      if (component.length > 0) {
        partitions.push(component.sort());
      }
    }

    if (partitions.length > 1) {
      this.stats.partitionsDetected++;
      this._emitSafe(MeshEvent.PARTITION_DETECTED, { partitions });
    }

    return partitions;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Retorna estatisticas detalhadas da mesh
   * @returns {Object} Estatisticas
   */
  getMeshStats() {
    const topology = this.getTopology();
    const health = this.getNetworkHealth();

    return {
      ...this.stats,
      topology: {
        peerCount: topology.peerCount,
        edgeCount: topology.edgeCount,
      },
      health: {
        score: health.healthScore,
        activePeers: health.activePeers,
        partitions: health.partitionCount,
      },
      queues: {
        totalQueued: health.totalQueuedMessages,
        peersWithQueue: Array.from(this.queues.values()).filter(q => q.length > 0).length,
      },
      topics: {
        count: this.topics.size,
        subscriptions: Array.from(this.topics.values()).reduce((sum, s) => sum + s.size, 0),
      },
      pendingRequests: this.pendingRequests.size,
      timestamp: Date.now(),
    };
  }

  /**
   * Retorna estatisticas basicas (alias compacto)
   * @returns {Object} Estatisticas basicas
   */
  getStats() {
    return {
      ...this.stats,
      peerCount: this.peers.size,
      topicCount: this.topics.size,
      pendingRequests: this.pendingRequests.size,
      timestamp: Date.now(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           HEARTBEAT & LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Inicia o heartbeat da mesh
   */
  startHeartbeat() {
    if (this._heartbeatTimer) return;

    this._heartbeatTimer = setInterval(() => {
      this._runHeartbeat();
    }, this.options.heartbeatInterval);

    // Nao segurar o processo
    if (this._heartbeatTimer.unref) {
      this._heartbeatTimer.unref();
    }

    this._started = true;
  }

  /**
   * Para o heartbeat da mesh
   */
  stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
    this._started = false;
  }

  /**
   * Destroi a mesh e limpa todos os recursos
   */
  destroy() {
    this.stopHeartbeat();

    // Limpar pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Mesh network destroyed'));
    }
    this.pendingRequests.clear();

    this.peers.clear();
    this.adjacency.clear();
    this.topics.clear();
    this.queues.clear();
    this.rateLimiters.clear();
    this.removeAllListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Carrega topologia do disco
   * @returns {Promise<boolean>} true se carregado com sucesso
   */
  async load() {
    const filePath = this._getTopologyPath();
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);

        if (data.schemaVersion === 'agent-mesh-v1' && Array.isArray(data.peers)) {
          for (const peerData of data.peers) {
            if (!this.peers.has(peerData.id)) {
              this.join(peerData.id, {
                capabilities: peerData.capabilities ?? [],
                topics: peerData.topics ?? [],
              });
            }
          }
          return true;
        }
      }
    } catch {
      // Arquivo corrompido — iniciar do zero
    }
    return false;
  }

  /**
   * Salva topologia no disco (serializado via promise chain)
   * @returns {Promise<void>}
   */
  async save() {
    const filePath = this._getTopologyPath();
    const dir = path.dirname(filePath);

    const data = {
      schemaVersion: 'agent-mesh-v1',
      version: '1.0.0',
      savedAt: new Date().toISOString(),
      peers: Array.from(this.peers.values()).map(p => ({
        id: p.id,
        capabilities: p.capabilities,
        topics: Array.from(p.topics),
        state: p.state,
        joinedAt: p.joinedAt,
      })),
      stats: this.stats,
    };

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //                           INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════════

  /** @private */
  _validatePeer(agentId) {
    if (!this.peers.has(agentId)) {
      throw new Error(`Peer "${agentId}" not found in the mesh`);
    }
  }

  /** @private */
  _isAdjacent(fromId, toId) {
    const neighbors = this.adjacency.get(fromId);
    return neighbors ? neighbors.has(toId) : false;
  }

  /** @private */
  _deliverMessage(msg) {
    const toPeer = this.peers.get(msg.to);
    if (toPeer) {
      toPeer.messageCount++;
    }

    this.stats.messagesReceived++;
    this._emitSafe(MeshEvent.MESSAGE_RECEIVED, {
      messageId: msg.id,
      from: msg.from,
      to: msg.to,
      type: msg.type,
      payload: msg.payload,
    });
  }

  /** @private */
  _enqueueMessage(peerId, msg) {
    const queue = this.queues.get(peerId);
    if (!queue) return;

    if (queue.length >= this.options.maxQueueSize) {
      this.stats.messagesDropped++;
      this._emitSafe(MeshEvent.QUEUE_OVERFLOW, {
        peerId,
        queueSize: queue.length,
        droppedMessageId: msg.id,
      });
      return;
    }

    queue.push(msg);
    this.stats.messagesQueued++;
  }

  /** @private */
  _drainQueue(agentId) {
    const queue = this.queues.get(agentId);
    if (!queue || queue.length === 0) return;

    const now = Date.now();
    const validMessages = [];

    for (const msg of queue) {
      if (now - msg.createdAt < msg.ttl) {
        validMessages.push(msg);
      }
    }

    this.queues.set(agentId, []);

    for (const msg of validMessages) {
      this._deliverMessage(msg);
    }
  }

  /** @private */
  _addToTopic(agentId, topic) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }
    this.topics.get(topic).add(agentId);
  }

  /** @private */
  _removeFromTopic(agentId, topic) {
    const subscribers = this.topics.get(topic);
    if (subscribers) {
      subscribers.delete(agentId);
      if (subscribers.size === 0) {
        this.topics.delete(topic);
      }
    }
  }

  /** @private */
  _updateLastSeen(agentId) {
    const peer = this.peers.get(agentId);
    if (peer) {
      peer.lastSeen = Date.now();
      peer.state = PeerState.ACTIVE;
    }
  }

  /** @private */
  _initRateLimiter(agentId) {
    this.rateLimiters.set(agentId, {
      tokens: this.options.rateLimit.tokensPerInterval,
      lastRefill: Date.now(),
    });
  }

  /** @private */
  _checkRateLimit(agentId) {
    const limiter = this.rateLimiters.get(agentId);
    if (!limiter) return;

    const now = Date.now();
    const elapsed = now - limiter.lastRefill;
    const { tokensPerInterval, interval } = this.options.rateLimit;

    // Refill tokens proporcionalmente ao tempo
    const refill = Math.floor((elapsed / interval) * tokensPerInterval);
    if (refill > 0) {
      limiter.tokens = Math.min(tokensPerInterval, limiter.tokens + refill);
      limiter.lastRefill = now;
    }

    if (limiter.tokens <= 0) {
      throw new Error(`Rate limit exceeded for peer "${agentId}"`);
    }

    limiter.tokens--;
  }

  /** @private */
  _runHeartbeat() {
    const now = Date.now();
    const timeout = this.options.peerTimeout;

    for (const [id, peer] of this.peers) {
      if (peer.state === PeerState.ACTIVE && (now - peer.lastSeen) > timeout) {
        peer.state = PeerState.TIMEOUT;
        this.stats.peersTimedOut++;
        this._emitSafe(MeshEvent.PEER_TIMEOUT, { agentId: id, lastSeen: peer.lastSeen });

        // Remover adjacencias do peer timeout
        const neighbors = this.adjacency.get(id);
        if (neighbors) {
          for (const neighborId of neighbors) {
            const neighborAdj = this.adjacency.get(neighborId);
            if (neighborAdj) neighborAdj.delete(id);
          }
          neighbors.clear();
        }
      }
    }

    // Purge mensagens expiradas das filas
    for (const [peerId, queue] of this.queues) {
      const valid = queue.filter(msg => (now - msg.createdAt) < msg.ttl);
      if (valid.length !== queue.length) {
        this.stats.messagesDropped += (queue.length - valid.length);
        this.queues.set(peerId, valid);
      }
    }
  }

  /** @private */
  _schedulePersist() {
    this._writeChain = this._writeChain.then(() => this.save()).catch(() => {
      // Falha silenciosa na persistencia
    });
  }

  /** @private */
  _getTopologyPath() {
    return path.resolve(this.projectRoot, this.options.persistenceDir, 'topology.json');
  }

  /** @private */
  _serializePeer(peer) {
    return {
      id: peer.id,
      capabilities: [...peer.capabilities],
      topics: Array.from(peer.topics),
      state: peer.state,
      joinedAt: peer.joinedAt,
      lastSeen: peer.lastSeen,
      messageCount: peer.messageCount,
    };
  }

  /** @private */
  _deepClone(obj) {
    try {
      return structuredClone(obj);
    } catch {
      return JSON.parse(JSON.stringify(obj));
    }
  }

  /**
   * Emite evento com guarda para 'error'
   * @private
   * @param {string} event - Nome do evento
   * @param {*} data - Dados do evento
   */
  _emitSafe(event, data) {
    if (event === 'error' && this.listenerCount('error') === 0) {
      return;
    }
    this.emit(event, data);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
//                              EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════════

module.exports = AgentMeshNetwork;
module.exports.AgentMeshNetwork = AgentMeshNetwork;
module.exports.MessageType = MessageType;
module.exports.PeerState = PeerState;
module.exports.MeshEvent = MeshEvent;
module.exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
