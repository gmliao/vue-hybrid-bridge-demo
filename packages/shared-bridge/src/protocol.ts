/**
 * 使用者資訊型別
 */
export interface User {
  id: string | number
  name: string
  email?: string
  [key: string]: unknown
}

/**
 * Bridge 訊息類型定義
 * 
 * - READY: Vue2 Legacy App 啟動完成
 * - AUTH_READY: Vue2 已完成登入，包含使用者資訊
 * - NAVIGATE: Vue3 → Vue2 路由導向
 * - STATE_SYNC: 狀態同步
 * - EVENT: 通用事件
 */
export type BridgeMessage =
  | { type: 'READY' }
  | { type: 'AUTH_READY'; user: User }
  | { type: 'NAVIGATE'; route: string }
  | { type: 'STATE_SYNC'; key: string; value: unknown }
  | { type: 'EVENT'; name: string; payload?: unknown }

/**
 * 訊息類型字串
 */
export type BridgeMessageType = BridgeMessage['type']

/**
 * 訊息處理器型別
 */
export type MessageHandler<T extends BridgeMessage = BridgeMessage> = (message: T) => void

/**
 * Bridge 設定選項
 */
export interface BridgeOptions {
  /** 目標 origin，預設為 '*' */
  targetOrigin?: string
  /** 允許接收的來源 origin 清單（未設定時會嘗試使用 targetOrigin，若仍為空則拒收） */
  allowedOrigins?: string[]
  /** 是否啟用除錯模式 */
  debug?: boolean
}

/**
 * 驗證訊息格式是否正確
 */
export function isValidBridgeMessage(data: unknown): data is BridgeMessage {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  
  const msg = data as Record<string, unknown>
  
  if (typeof msg.type !== 'string') {
    return false
  }
  
  switch (msg.type) {
    case 'READY':
      return true
    case 'AUTH_READY':
      return typeof msg.user === 'object' && msg.user !== null
    case 'NAVIGATE':
      return typeof msg.route === 'string'
    case 'STATE_SYNC':
      return typeof msg.key === 'string'
    case 'EVENT':
      return typeof msg.name === 'string'
    default:
      return false
  }
}
