<template>
  <div class="drawer lg:drawer-open h-screen">
    <input id="sidebar-toggle" type="checkbox" class="drawer-toggle" />

    <!-- 主内容区 -->
    <div class="drawer-content flex flex-col overflow-hidden">
      <!-- 移动端顶部栏 -->
      <div class="flex items-center gap-3 px-4 py-3 bg-base-200/80 border-b border-base-300 lg:hidden">
        <label for="sidebar-toggle" class="btn btn-ghost btn-sm btn-square drawer-button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </label>
        <span class="font-bold text-base"># {{ currentChannel }}</span>
      </div>

      <ChatHeader />
      <div v-if="isGuest" class="alert alert-warning rounded-none border-0 px-4 py-2 text-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span>你正在以访客身份体验，账号和消息将在 24 小时后自动清除。</span>
      </div>
      <MessageList />
      <MessageInput />
    </div>

    <!-- 侧边栏 -->
    <div class="drawer-side z-40">
      <label for="sidebar-toggle" class="drawer-overlay"></label>
      <Sidebar />
    </div>

    <CreateChannelModal :show="showCreateModal" @close="showCreateModal = false" @created="showCreateModal = false" />
  </div>
</template>

<script setup>
import { useAppState } from '../composables/useAppState'
import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import Sidebar from './Sidebar.vue'
import CreateChannelModal from './CreateChannelModal.vue'

const { currentChannel, showCreateModal, isGuest } = useAppState()
</script>
