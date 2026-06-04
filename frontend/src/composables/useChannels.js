import { ref } from 'vue'
import { useAppState } from './useAppState'

// ── 全局单例状态 ──
const channels = ref([])
const loading = ref(false)

export function useChannels() {
  const fetchChannels = async () => {
    loading.value = true
    try {
      const { token } = useAppState()
      const headers = {}
      if (token.value) {
        headers['Authorization'] = `Bearer ${token.value}`
      }
      const res = await fetch('/api/channels', { headers })
      if (res.ok) {
        channels.value = await res.json()
      }
    } catch (err) {
      console.error('获取频道列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  const createChannel = async (name) => {
    const { token } = useAppState()
    const headers = { 'Content-Type': 'application/json' }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      await fetchChannels()
      return true
    }
    return false
  }

  return { channels, loading, fetchChannels, createChannel }
}
