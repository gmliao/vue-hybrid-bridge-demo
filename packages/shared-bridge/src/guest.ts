import { BridgeMessage, BridgeMessageType, BridgeOptions, MessageHandler, User, isValidBridgeMessage } from './protocol'

/**
 * Guest Bridge - 用於 Vue2 Legacy 端（iframe 內）
 * 
 * 負責：
 * - 向父視窗 (Vue3) 發送訊息
 * - 監聽來自父視窗的訊息（如 NAVIGATE）
 */
export class GuestBridge {
  private handlers: Map<BridgeMessageType, Set<MessageHandler>> = new Map()
  private options: Required<BridgeOptions>
  private boundMessageHandler: (event: MessageEvent) => void

  constructor(options: BridgeOptions = {}) {
    this.options = {
      targetOrigin: options.targetOrigin ?? '*',
      debug: options.debug ?? false
    }
    this.boundMessageHandler = this.handleMessage.bind(this)
  }

  /**
   * 初始化連接
   */
  connect(): void {
    window.addEventListener('message', this.boundMessageHandler)
    this.log('GuestBridge connected')
  }

  /**
   * 斷開連接
   */
  disconnect(): void {
    window.removeEventListener('message', this.boundMessageHandler)
    this.handlers.clear()
    this.log('GuestBridge disconnected')
  }

  /**
   * 發送訊息到父視窗
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
   * 通知父視窗 Legacy App 已準備就緒
   */
  ready(): void {
    this.send({ type: 'READY' })
  }

  /**
   * 通知父視窗登入已完成
   */
  authReady(user: User): void {
    this.send({ type: 'AUTH_READY', user })
  }

  /**
   * 同步狀態到父視窗
   */
  syncState(key: string, value: unknown): void {
    this.send({ type: 'STATE_SYNC', key, value })
  }

  /**
   * 發送事件到父視窗
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
    
    // 返回取消監聯的函式
    return () => {
      handlers.delete(handler as MessageHandler)
    }
  }

  /**
   * 處理收到的訊息
   */
  private handleMessage(event: MessageEvent): void {
    // 驗證訊息格式
    if (!isValidBridgeMessage(event.data)) {
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
          console.error('[GuestBridge] Handler error:', error)
        }
      })
    }
  }

  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log('[GuestBridge]', ...args)
    }
  }
}

