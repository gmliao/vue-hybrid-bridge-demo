import { BridgeMessage, BridgeMessageType, BridgeOptions, MessageHandler, User, isValidBridgeMessage } from './protocol'

/**
 * Guest Bridge - for Vue2 Legacy (inside iframe)
 *
 * Responsibilities:
 * - send messages to parent (Vue3)
 * - listen to messages from parent (e.g. NAVIGATE)
 */
export class GuestBridge {
  private handlers: Map<BridgeMessageType, Set<MessageHandler>> = new Map()
  private options: Required<BridgeOptions>
  private boundMessageHandler: (event: MessageEvent) => void

  constructor(options: BridgeOptions = {}) {
    this.options = {
      targetOrigin: options.targetOrigin ?? '*',
      allowedOrigins: options.allowedOrigins ?? (options.targetOrigin && options.targetOrigin !== '*' ? [options.targetOrigin] : []),
      debug: options.debug ?? false
    }
    this.boundMessageHandler = this.handleMessage.bind(this)
  }

  /**
   * Initialize connection
   */
  connect(): void {
    window.addEventListener('message', this.boundMessageHandler)
    this.log('GuestBridge connected')
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    window.removeEventListener('message', this.boundMessageHandler)
    this.handlers.clear()
    this.log('GuestBridge disconnected')
  }

  /**
   * Send message to parent
   */
  send(message: BridgeMessage): void {
    if (!window.parent || window.parent === window) {
      this.log('Not in iframe, skipping message:', message)
      return
    }

    this.log('Sending message:', message)
    window.parent.postMessage(message, this.options.targetOrigin)
  }

  /**
   * Notify parent that legacy app is ready
   */
  ready(): void {
    this.send({ type: 'READY' })
  }

  /**
   * Notify parent that auth is ready
   */
  authReady(user: User): void {
    this.send({ type: 'AUTH_READY', user })
  }

  /**
   * Sync state to parent
   */
  syncState(key: string, value: unknown): void {
    this.send({ type: 'STATE_SYNC', key, value })
  }

  /**
   * Emit event to parent
   */
  emit(name: string, payload?: unknown): void {
    this.send({ type: 'EVENT', name, payload })
  }

  /**
   * Listen to specific message type
   */
  on<T extends BridgeMessageType>(
    type: T,
    handler: MessageHandler<Extract<BridgeMessage, { type: T }>>
  ): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    
    const handlers = this.handlers.get(type)!
    handlers.add(handler as MessageHandler)
    
    // Return unsubscribe function
    return () => {
      handlers.delete(handler as MessageHandler)
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    if (!this.isAllowedOrigin(event.origin)) {
      this.log('Blocked message from origin:', event.origin)
      return
    }

    if (!this.isAllowedSource(event.source)) {
      this.log('Blocked message from unexpected source')
      return
    }

    // Validate message shape
    if (!isValidBridgeMessage(event.data)) {
      this.log('Blocked invalid message:', event.data)
      return
    }

    const message = event.data
    this.log('Received message:', message)

    // Trigger handlers
    const handlers = this.handlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          console.error('[GuestBridge] Handler error:', error)
        }
      })
    }
  }

  private isAllowedOrigin(origin: string): boolean {
    if (this.options.allowedOrigins.length === 0) {
      return false
    }

    return this.options.allowedOrigins.includes(origin)
  }

  private isAllowedSource(source: MessageEvent['source']): boolean {
    if (!window.parent || window.parent === window) {
      return false
    }

    return source === window.parent
  }

  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log('[GuestBridge]', ...args)
    }
  }
}
