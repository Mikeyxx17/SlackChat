import { ref, watch } from 'vue'
import { useAppState } from './useAppState'
import { useChannels } from './useChannels'

// ── 全局单例状态 ──
const messages = ref([])
const connected = ref(false)
let socket = null

const { currentChannel, isJoined } = useAppState()
const { fetchChannels } = useChannels()

const connect = () => {
  disconnect()
  messages.value = []
  if (!isJoined.value) return

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = protocol + '//' + location.host + '/ws/' + currentChannel.value
  const ws = new WebSocket(url)
  socket = ws

  ws.onopen = () => {
    connected.value = true
    fetchChannels()
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      messages.value.push(msg)
    } catch (e) {
      console.error('消息解析失败:', e)
    }
  }

  ws.onclose = () => {
    if (socket === ws) socket = null
    connected.value = false
  }

  ws.onerror = () => {
    if (socket === ws) socket = null
    connected.value = false
  }
}

const disconnect = () => {
  if (socket) {
    socket.close()
    socket = null
  }
  connected.value = false
}

// ── 模块级 watcher（不绑定组件生命周期，v-if 卸载不会杀死）──
watch(currentChannel, () => {
  messages.value = []
  if (isJoined.value) {
    connect()
  }
})

watch(isJoined, (joined) => {
  if (joined) {
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
