import { ref, watch } from 'vue'
import { useAppState } from './useAppState'
import { useChannels } from './useChannels'

// ── 全局单例状态 ──
const messages = ref([])
const connected = ref(false)
let socket = null
let retryCount = 0
let retryTimer = null
let heartbeatTimer = null
let manualDisconnect = false

const { currentChannel, isJoined } = useAppState()
const { fetchChannels } = useChannels()

const clearTimers = () => {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

const startHeartbeat = () => {
  clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }))
    }
  }, 30000) // 每30秒发一次心跳
}

const scheduleReconnect = () => {
  clearTimers()
  if (!isJoined.value || manualDisconnect) return

  // 指数退避: 1s → 2s → 4s → 8s → 16s → 最大30s
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
  retryCount++
  console.log(`WebSocket 将在 ${delay / 1000}s 后重连 (第${retryCount}次)`)
  retryTimer = setTimeout(() => {
    retryTimer = null
    connect()
  }, delay)
}

const connect = () => {
  disconnect(true)
  messages.value = []
  if (!isJoined.value) return

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = protocol + '//' + location.host + '/ws/' + currentChannel.value
  const ws = new WebSocket(url)
  socket = ws
  manualDisconnect = false

  ws.onopen = () => {
    connected.value = true
    retryCount = 0
    fetchChannels()
    startHeartbeat()
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      // 忽略服务端心跳回包
      if (msg.type === 'pong') return
      messages.value.push(msg)
    } catch (e) {
      console.error('消息解析失败:', e)
    }
  }

  ws.onclose = () => {
    if (socket === ws) socket = null
    connected.value = false
    clearTimers()
    if (!manualDisconnect) {
      scheduleReconnect()
    }
  }

  ws.onerror = () => {
    if (socket === ws) socket = null
    connected.value = false
    clearTimers()
    if (!manualDisconnect) {
      scheduleReconnect()
    }
  }
}

const disconnect = (isInternal = false) => {
  clearTimers()
  if (socket) {
    if (!isInternal) {
      manualDisconnect = true
    }
    socket.close()
    socket = null
  }
  if (!isInternal) {
    retryCount = 0
  }
  connected.value = false
}

// ── 模块级 watcher ──
watch(currentChannel, () => {
  messages.value = []
  retryCount = 0
  if (isJoined.value) {
    connect()
  }
})

watch(isJoined, (joined) => {
  if (joined) {
    manualDisconnect = false
    retryCount = 0
    connect()
  } else {
    disconnect()
    messages.value = []
  }
})

if (isJoined.value) {
  connect()
}

export function useWebSocket() {
  const sendMessage = (content) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !content.trim()) return
    const { username } = useAppState()
    socket.send(JSON.stringify({
      channel: currentChannel.value,
      username: username.value,
      content: content.trim(),
    }))
  }

  return { messages, connected, sendMessage, connect, disconnect }
}
