<template>
  <div class="feedback-history">
    <h4>反馈历史</h4>
    <div class="feedback-list">
      <div v-for="feedback in feedbacks" :key="feedback.id" class="feedback-item">
        <div class="feedback-header">
          <span class="feedback-id">#{{ feedback.id }}</span>
          <span class="feedback-time">{{ formatTime(feedback.timestamp) }}</span>
        </div>
        <div class="feedback-content">{{ feedback.content }}</div>
      </div>
      <div v-if="feedbacks.length === 0" class="no-feedback">
        暂无反馈记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Feedback } from '../types'
import * as fs from 'fs'
import * as path from 'path'

const feedbacks = ref<Feedback[]>([])

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`
}

// 将反馈写入文件
const writeFeedbackToFile = (feedback: Feedback) => {
  try {
    // 确保 feedback 目录存在
    const feedbackDir = path.join(process.cwd(), 'src', 'feedback')
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true })
    }

    // 生成文件名
    const fileName = `${formatTime(feedback.timestamp)}.txt`
    const filePath = path.join(feedbackDir, fileName)
    
    // 写入文件内容
    fs.writeFileSync(filePath, feedback.content, 'utf-8')
    console.log('反馈已保存到文件:', filePath)
  } catch (error) {
    console.error('保存反馈文件失败:', error)
  }
}

// 从localStorage加载反馈
const loadFeedbacks = () => {
  const stored = localStorage.getItem('feedbacks')
  if (stored) {
    feedbacks.value = JSON.parse(stored)
  }
}

// 添加新反馈
const addFeedback = (content: string) => {
  const newFeedback: Feedback = {
    id: feedbacks.value.length > 0 ? Math.max(...feedbacks.value.map(f => f.id)) + 1 : 1,
    content,
    timestamp: new Date().toISOString()
  }
  feedbacks.value.push(newFeedback)
  localStorage.setItem('feedbacks', JSON.stringify(feedbacks.value))
  writeFeedbackToFile(newFeedback)
}

onMounted(() => {
  loadFeedbacks()
})

defineExpose({
  addFeedback
})
</script>

<style scoped>
.feedback-history {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-item {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.feedback-id {
  font-weight: bold;
  color: #3498db;
}

.feedback-content {
  white-space: pre-wrap;
  color: #2c3e50;
}

.no-feedback {
  text-align: center;
  color: #666;
  padding: 1rem;
}
</style> 