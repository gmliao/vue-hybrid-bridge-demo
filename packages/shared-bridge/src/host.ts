import { BridgeMessage, BridgeMessageType, BridgeOptions, MessageHandler, isValidBridgeMessage } from './protocol'

/**
 * Host Bridge - 用於 Vue3 Host 端
 * 
 * 負責：
 * - 監聽來自 iframe (Vue2) 的訊息
 * - 向 iframe 發送訊息（如 NAVIGATE）
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
   * 連接到 iframe
   */
  connect(iframe: HTMLIFrameElement): void {
    this.iframe = iframe
    window.addEventListener('message', this.boundMessageHandler)
    this.log('HostBridge connected')
  }

  /**
   * 斷開連接
   */
  disconnect(): void {
    window.removeEventListener('message', this.boundMessageHandler)
    this.iframe = null
    this.handlers.clear()
    this.log('HostBridge disconnected')
  }

  /**
   * 發送訊息到 iframe
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
   * 導航到指定路由
   */
  navigate(route: string): void {
    this.send({ type: 'NAVIGATE', route })
  }

  /**
   * 同步狀態
   */
  syncState(key: string, value: unknown): void {
    this.send({ type: 'STATE_SYNC', key, value })
  }

  /**
   * 發送事件
   */
  emit(name: string, payload?: unknown): void {
    this.send({ type: 'EVENT', name, payload })
  }

  /**
   * 監聽特定類型的訊息
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
    
    // 返回取消監聽的函式
    return () => {
      handlers.delete(handler as MessageHandler)
    }
  }

  /**
   * 處理收到的訊息
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

    // 驗證訊息格式
    if (!isValidBridgeMessage(event.data)) {
      this.log('Blocked invalid message:', event.data)
      return
    }

    const message = event.data
    this.log('Received message:', message)

    // 觸發對應的處理器
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
