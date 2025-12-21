import { BridgeMessage, BridgeMessageType, BridgeOptions, MessageHandler, isValidBridgeMessage } from './protocol'

/**
 * Host Bridge - for Vue3 Host
 *
 * Responsibilities:
 * - listen to messages from iframe (Vue2)
 * - send messages to iframe (e.g. NAVIGATE)
 */
export class HostBridge {
  private iframe: HTMLIFrameElement | null = null
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
   * Connect to iframe
   */
  connect(iframe: HTMLIFrameElement): void {
    this.iframe = iframe
    window.addEventListener('message', this.boundMessageHandler)
    this.log('HostBridge connected')
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    window.removeEventListener('message', this.boundMessageHandler)
    this.iframe = null
    this.handlers.clear()
    this.log('HostBridge disconnected')
  }

  /**
   * Send message to iframe
   */
  send(message: BridgeMessage): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[HostBridge] iframe not connected')
      return
    }

    this.log('Sending message:', message)
    this.iframe.contentWindow.postMessage(message, this.options.targetOrigin)
  }

  /**
   * Navigate to route
   */
  navigate(route: string): void {
    this.send({ type: 'NAVIGATE', route })
  }

  /**
   * Sync state
   */
  syncState(key: string, value: unknown): void {
    this.send({ type: 'STATE_SYNC', key, value })
  }

  /**
   * Emit event
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
          console.error('[HostBridge] Handler error:', error)
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
    if (!this.iframe?.contentWindow) {
      return false
    }

    return source === this.iframe.contentWindow
  }

  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log('[HostBridge]', ...args)
    }
  }
}
