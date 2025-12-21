/**
 * User info type
 */
export interface User {
  id: string | number
  name: string
  email?: string
  [key: string]: unknown
}

/**
 * Bridge message types
 *
 * - READY: Vue2 legacy app booted
 * - AUTH_READY: Vue2 login completed with user payload
 * - NAVIGATE: Vue3 -> Vue2 route navigation
 * - STATE_SYNC: state sync payload
 * - EVENT: generic event payload
 */
export type BridgeMessage =
  | { type: 'READY' }
  | { type: 'AUTH_READY'; user: User }
  | { type: 'NAVIGATE'; route: string }
  | { type: 'STATE_SYNC'; key: string; value: unknown }
  | { type: 'EVENT'; name: string; payload?: unknown }

/**
 * Message type union
 */
export type BridgeMessageType = BridgeMessage['type']

/**
 * Message handler type
 */
export type MessageHandler<T extends BridgeMessage = BridgeMessage> = (message: T) => void

/**
 * Bridge options
 */
export interface BridgeOptions {
  /** target origin, defaults to '*' */
  targetOrigin?: string
  /** allowed origin list (falls back to targetOrigin when provided; empty means reject) */
  allowedOrigins?: string[]
  /** enable debug logging */
  debug?: boolean
}

/**
 * Validate message shape
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
