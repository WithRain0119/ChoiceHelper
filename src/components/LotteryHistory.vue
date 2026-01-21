<template>
  <div class="lottery-history">
    <div class="records-section">
      <div class="section-header">
        <h3>建议记录</h3>
        <button @click="showClearConfirm = true" class="clear-btn" title="清除所有建议选择记录">
          清除记录
        </button>
      </div>
      <div class="records-list">
        <div class="records-items">
          <div v-if="sortedRecords.length === 0" class="empty-state">
            暂无建议选择记录
          </div>
          <div v-else v-for="(record, index) in sortedRecords" :key="record.id" class="record-item">
            <div class="record-prize">
              <span class="prize-code" :style="{ background: getPrizeColor(record) }">{{ record.prize.code }}</span>
              <span class="prize-name">{{ record.prize.name }}</span>
            </div>
            <div class="record-info">
              <span class="record-time">{{ formatTime(record.timestamp) }}</span>
              <span class="record-config">{{ getConfigTitle(record.configId) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 清除记录确认框 -->
    <div v-if="showClearConfirm" class="confirm-modal" @click="showClearConfirm = false">
      <div class="confirm-content" @click.stop>
        <h3>确认清除</h3>
        <p class="confirm-message">确定要清除所有抽奖记录吗？</p>
        <div class="confirm-actions">
          <button @click="showClearConfirm = false" class="cancel-btn">取消</button>
          <button @click="confirmClear" class="confirm-btn">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { LotteryConfig, LotteryRecord } from '../types'

const props = defineProps<{
  currentConfigId?: string
}>()

const emit = defineEmits<{
  (e: 'load-config', config: LotteryConfig): void
  (e: 'reinit-system'): void
}>()

const records = ref<LotteryRecord[]>([])
const configs = ref<LotteryConfig[]>([])
const showClearConfirm = ref(false)

// 从localStorage加载记录
const loadRecords = () => {
  const stored = localStorage.getItem('lottery_records')
  if (stored) {
    records.value = JSON.parse(stored)
  }
}

// 从localStorage加载配置
const loadConfigs = () => {
  const stored = localStorage.getItem('lottery_configs')
  if (stored) {
    configs.value = JSON.parse(stored)
  }
}

// 添加新配置
const addConfig = (config: LotteryConfig) => {
  const index = configs.value.findIndex(c => c.id === config.id)
  if (index !== -1) {
    configs.value[index] = config
  } else {
    configs.value.push(config)
  }
  localStorage.setItem('lottery_configs', JSON.stringify(configs.value))
}

// 监听localStorage变化
window.addEventListener('storage', (e) => {
  if (e.key === 'lottery_configs') {
    loadConfigs()
  } else if (e.key === 'lottery_records') {
    loadRecords()
  }
})

// 按时间排序的记录
const sortedRecords = computed(() => {
  return [...records.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

// 获取配置标题
const getConfigTitle = (configId: string) => {
  const config = configs.value.find(c => c.id === configId)
  return config ? config.title : '已删除的方案'
}

// 获取奖项颜色
const getPrizeColor = (record: LotteryRecord) => {
  // 如果记录中有原始索引，直接使用
  if (typeof record.prize.originalIndex === 'number') {
    return getColorByIndex(record.prize.originalIndex)
  }

  // 如果没有原始索引，尝试从配置中找到对应的选项
  const config = configs.value.find(c => c.id === record.configId)
  if (config) {
    const index = config.prizes.findIndex(p => p.name === record.prize.name)
    if (index !== -1) {
      return getColorByIndex(index)
    }
  }

  // 如果都找不到，返回默认颜色
  return '#3498db'
}

// 根据索引获取颜色
const getColorByIndex = (index: number) => {
  const colors = [
    '#3498db', // 蓝色
    '#e74c3c', // 红色
    '#2ecc71', // 绿色
    '#f1c40f', // 黄色
    '#9b59b6', // 紫色
    '#1abc9c', // 青色
    '#e67e22', // 橙色
    '#34495e', // 深灰色
    '#7f8c8d', // 灰色
    '#16a085', // 深青色
    '#d35400', // 深橙色
    '#c0392b', // 深红色
    '#2980b9', // 深蓝色
    '#8e44ad', // 深紫色
    '#27ae60', // 深绿色
  ]
  return colors[index % colors.length]
}

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadRecords()
  loadConfigs()
})

// 清除历史记录
const clearRecords = () => {
  records.value = []
  localStorage.setItem('lottery_records', '[]')
  showClearConfirm.value = false
}

// 添加新记录
const addRecord = (record: LotteryRecord) => {
  records.value.push(record)
  localStorage.setItem('lottery_records', JSON.stringify(records.value))
}

// 确认清除
const confirmClear = () => {
  clearRecords()
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载配置
const loadConfig = (config: LotteryConfig) => {
  emit('load-config', config)
}

// 删除配置
const deleteConfig = (configId: string) => {
  const config = configs.value.find(c => c.id === configId)
  if (config?.isSystem) {
    alert('系统预设方案不能删除')
    return
  }
  configs.value = configs.value.filter(config => config.id !== configId)
  localStorage.setItem('lottery_configs', JSON.stringify(configs.value))
}

// 导出方法供父组件使用
defineExpose({
  addRecord,
  clearRecords,
  configs,
  addConfig,
  deleteConfig
})
</script>

<style scoped>
.lottery-history {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.clear-btn,
.reinit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #e74c3c;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.clear-btn:hover,
.reinit-btn:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

.clear-btn:active,
.reinit-btn:active {
  transform: translateY(0px);
}

.clear-icon,
.reinit-icon {
  font-size: 1.1em;
}

.records-list,
.config-list {
  overflow-y: auto;
  max-height: 400px;
}

.records-items,
.config-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  color: #95a5a6;
  padding: 2rem;
  font-size: 1.1rem;
}

.record-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.record-item:hover {
  border-color: #ddd;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.record-prize {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.prize-code {
  padding: 0.5rem;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  min-width: 2rem;
  text-align: center;
}

.prize-name {
  font-size: 1.1rem;
  color: #2c3e50;
}

.record-info {
  display: flex;
  justify-content: space-between;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  min-width: 300px;
}

.confirm-content h3 {
  margin: 0 0 1rem;
  color: #2c3e50;
}

.confirm-message {
  margin-bottom: 2rem;
  color: #34495e;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cancel-btn,
.confirm-btn {
  padding: 0.5rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

.confirm-btn {
  background: #e74c3c;
  color: white;
}

.confirm-btn:hover {
  background: #c0392b;
}
</style> 