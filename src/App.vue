<template>
  <div class="app">
    <header>
      <h1>选择恐惧症者的福音</h1>
      <div class="config-actions">
        <button @click="showSchemeList = true" class="switch-scheme-btn">切换转盘方案</button>
        <button @click="showSaveDialog" class="save-btn">保存当前方案</button>
        <button @click="resetWheel" class="reset-btn" title="清空当前转盘，重新设置">
          重置方案
        </button>
      </div>
    </header>

    <main>
      <div class="lottery-section">
        <LotteryWheel
          ref="wheelRef"
          :current-config-title="currentConfigTitle"
          @prize-selected="handlePrizeSelected"
        />
      </div>
      
      <div class="history-section">
        <LotteryHistory
          ref="historyRef"
          :current-config-id="currentConfigId"
          @load-config="loadConfig"
          @reinit-system="reinitializeSystemConfigs"
        />
      </div>
    </main>

    <footer>
      <button @click="showFeedbackOptions = true" class="feedback-btn">
        <span class="feedback-icon">💬</span>
        反馈
      </button>
      <div class="project-purpose">
        注：本项目的核心目的是帮助用户在多项选择中快速做决定，让选择变得轻松有趣。无论是日常生活的小决定，还是团队活动的抽签，都可以用这个转盘工具来解决。
      </div>
    </footer>

    <!-- 欢迎提示框 -->
    <div v-if="showWelcome" class="welcome-modal">
      <div class="welcome-content">
        <p class="welcome-text">你想得太多，不如试试交给一点随机。</p>
        <p class="welcome-text-en">Think less, let randomness guide you.</p>
        <button class="try-it-btn" @click="showWelcome = false">Try it!</button>
      </div>
    </div>

    <!-- 保存方案对话框 -->
    <div v-if="showSaveModal" class="modal" @click="showSaveModal = false">
      <div class="modal-content" @click.stop>
        <h3>保存方案</h3>
        <input 
          v-model="configTitle" 
          placeholder="请输入方案名称" 
          class="title-input"
          @keyup.enter="saveConfig"
        />
        <div class="modal-actions">
          <button @click="showSaveModal = false" class="cancel-btn">取消</button>
          <button @click="saveConfig" class="confirm-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 反馈选项弹窗 -->
    <div v-if="showFeedbackOptions" class="modal feedback-options-modal" @click="showFeedbackOptions = false">
      <div class="modal-content" @click.stop>
        <h3>请选择反馈方式</h3>
        <div class="feedback-options">
          <div class="feedback-option">
            <h4>直接反馈</h4>
            <textarea 
              v-model="feedbackContent" 
              placeholder="请输入您的反馈内容..."
              class="feedback-textarea"
            ></textarea>
            <button @click="submitFeedback" class="submit-btn" :disabled="!feedbackContent.trim()">
              提交反馈
            </button>
          </div>
          <div class="feedback-divider">或</div>
          <div class="feedback-option">
            <h4>联系作者</h4>
            <p class="qq-info">添加作者QQ：2094348228</p>
          </div>
        </div>
        <button class="close-btn" @click="showFeedbackOptions = false">×</button>
      </div>
    </div>

    <!-- 成功提示框 -->
    <div v-if="showSuccessMessage" class="success-message" :class="{ 'show': showSuccessMessage }">
      <div class="success-content">
        <span class="success-icon">✓</span>
        <span class="success-text">{{ successMessage }}</span>
      </div>
    </div>

    <!-- 清空转盘确认框 -->
    <div v-if="showResetConfirm" class="confirm-modal" @click="showResetConfirm = false">
      <div class="confirm-content" @click.stop>
        <h3>确认清空</h3>
        <p class="confirm-message">确定要清空当前转盘配置吗？</p>
        <div class="confirm-actions">
          <button @click="showResetConfirm = false" class="cancel-btn">取消</button>
          <button @click="confirmReset" class="confirm-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 反馈历史组件 -->
    <div class="feedback-dialog" v-if="showFeedback">
      <div class="feedback-content">
        <h3>意见反馈</h3>
        <div class="feedback-options">
          <div class="feedback-option">
            <h4>直接反馈</h4>
            <textarea v-model="feedbackText" placeholder="请输入您的反馈内容..." rows="4"></textarea>
            <button @click="submitFeedback">提交反馈</button>
          </div>
          <div class="divider"></div>
          <div class="feedback-option">
            <h4>联系客服</h4>
            <button @click="contactQQ">QQ联系</button>
          </div>
        </div>
        <FeedbackHistory ref="feedbackHistoryRef" />
      </div>
      <div class="close-btn" @click="showFeedback = false">×</div>
    </div>

    <!-- 转盘方案列表弹窗 -->
    <div v-if="showSchemeList" class="modal scheme-list-modal" @click="showSchemeList = false">
      <div class="modal-content" @click.stop>
        <h3>转盘方案列表</h3>
        <div class="scheme-list">
          <div v-for="config in historyRef?.configs" :key="config.id" class="scheme-item">
            <span class="scheme-name">{{ config.title }}</span>
            <div class="scheme-actions">
              <button @click="loadConfig(config)" class="select-btn">选择</button>
              <button 
                v-if="!config.isSystem" 
                @click="showDeleteConfirm(config)" 
                class="delete-btn"
                title="删除此方案"
              >删除</button>
            </div>
          </div>
        </div>
        <button @click="showSchemeList = false" class="close-btn">关闭</button>
      </div>
    </div>

    <!-- 删除方案确认框 -->
    <div v-if="showDeleteSchemeConfirm" class="modal" @click="showDeleteSchemeConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>确认删除</h3>
        <p class="confirm-message">确定要删除方案"{{ schemeToDelete?.title }}"吗？</p>
        <div class="modal-actions">
          <button @click="showDeleteSchemeConfirm = false" class="cancel-btn">取消</button>
          <button @click="confirmDeleteScheme" class="confirm-btn">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import LotteryWheel from './components/LotteryWheel.vue'
import LotteryHistory from './components/LotteryHistory.vue'
import FeedbackHistory from './components/FeedbackHistory.vue'
import type { Prize, LotteryConfig, LotteryRecord } from './types'

const wheelRef = ref<InstanceType<typeof LotteryWheel> | null>(null)
const historyRef = ref<InstanceType<typeof LotteryHistory> | null>(null)
const configTitle = ref('')
const currentConfigId = ref('')
const showFeedbackOptions = ref(false)
const showSaveModal = ref(false)
const showWelcome = ref(true)
const unnamedCounter = ref(1)
const feedbackContent = ref('')
const feedbackHistoryRef = ref<InstanceType<typeof FeedbackHistory> | null>(null)
const showFeedback = ref(false)
const feedbackText = ref('')
const showSuccessMessage = ref(false)
const showResetConfirm = ref(false)
const successMessage = ref('')
const showSchemeList = ref(false)
const showDeleteSchemeConfirm = ref(false)
const schemeToDelete = ref<LotteryConfig | null>(null)

// 系统预设方案
const systemConfigs: LotteryConfig[] = [
  {
    id: 'system-food',
    title: '今天吃什么',
    prizes: [
      { code: '川', name: '川菜', probability: 20 },
      { code: '粤', name: '粤菜', probability: 15 },
      { code: '湘', name: '湘菜', probability: 15 },
      { code: '苏', name: '江苏菜', probability: 15 },
      { code: '浙', name: '浙江菜', probability: 15 },
      { code: '西', name: '西餐', probability: 10 },
      { code: '日', name: '日料', probability: 10 }
    ],
    createdAt: new Date().toISOString(),
    isSystem: true
  },
  {
    id: 'system-weekend',
    title: '周末去哪玩',
    prizes: [
      { code: '电', name: '看电影', probability: 20 },
      { code: '逛', name: '逛商场', probability: 15 },
      { code: '公', name: '公园散步', probability: 15 },
      { code: '展', name: '看展览', probability: 15 },
      { code: '咖', name: '咖啡馆', probability: 15 },
      { code: '运', name: '运动健身', probability: 10 },
      { code: '宅', name: '宅家休息', probability: 10 }
    ],
    createdAt: new Date().toISOString(),
    isSystem: true
  },
  {
    id: 'system-clothes',
    title: '今天穿什么',
    prizes: [
      { code: '休', name: '休闲装', probability: 30 },
      { code: '运', name: '运动装', probability: 20 },
      { code: '正', name: '正装', probability: 15 },
      { code: '牛', name: '牛仔装', probability: 15 },
      { code: '民', name: '民族风', probability: 10 },
      { code: '复', name: '复古风', probability: 10 }
    ],
    createdAt: new Date().toISOString(),
    isSystem: true
  }
]

// 检查两个方案的内容是否相同
const isPrizesEqual = (prizes1: Prize[], prizes2: Prize[]) => {
  if (prizes1.length !== prizes2.length) return false
  
  return prizes1.every((prize1, index) => {
    const prize2 = prizes2[index]
    return prize1.code === prize2.code &&
           prize1.name === prize2.name &&
           prize1.probability === prize2.probability
  })
}

interface InitResult {
  addedCount: number
  updatedCount: number
}

// 初始化系统方案
const initSystemConfigs = (): InitResult => {
  if (!historyRef.value) return { addedCount: 0, updatedCount: 0 }
  
  let addedCount = 0
  let updatedCount = 0
  
  // 检查每个系统方案
  systemConfigs.forEach(systemConfig => {
    const existingConfig = historyRef.value?.configs.find(c => c.id === systemConfig.id)
    
    if (!existingConfig) {
      // 如果方案不存在，添加它
      historyRef.value?.addConfig({
        ...systemConfig,
        createdAt: new Date().toISOString()
      })
      addedCount++
    } else if (!isPrizesEqual(existingConfig.prizes, systemConfig.prizes)) {
      // 如果方案存在但内容不同，更新它
      historyRef.value?.addConfig({
        ...systemConfig,
        createdAt: existingConfig.createdAt // 保持原有的创建时间
      })
      updatedCount++
    }
  })
  
  return { addedCount, updatedCount }
}

// 在组件挂载后初始化系统方案
onMounted(() => {
  // 等待historyRef组件加载完成
  setTimeout(() => {
    initSystemConfigs()
  }, 500)
})

// 显示成功提示
const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

// 手动重新初始化系统方案
const reinitializeSystemConfigs = () => {
  if (!historyRef.value) return
  
  const { addedCount, updatedCount } = initSystemConfigs()
  
  if (addedCount > 0 || updatedCount > 0) {
    const messages = []
    if (addedCount > 0) {
      messages.push(`恢复了 ${addedCount} 个预设方案`)
    }
    if (updatedCount > 0) {
      messages.push(`更新了 ${updatedCount} 个预设方案内容`)
    }
    showSuccess(messages.join('，'))
  } else {
    showSuccess('所有预设方案都已存在且内容未被修改')
  }
}

// 计算当前显示的配置标题
const currentConfigTitle = computed(() => {
  if (!historyRef.value) return '暂时方案'
  
  const currentConfig = historyRef.value.configs.find(c => c.id === currentConfigId.value)
  return currentConfig ? currentConfig.title : '暂时方案'
})

// 获取下一个未命名方案的标题
const getNextUnnamedTitle = () => {
  if (!historyRef.value) return `未命名方案1`
  
  // 查找所有未命名方案
  const unnamedConfigs = historyRef.value.configs
    .filter(config => config.title.startsWith('未命名方案'))
    .map(config => {
      const num = parseInt(config.title.replace('未命名方案', ''))
      return isNaN(num) ? 0 : num
    })
    .sort((a, b) => a - b)

  // 找到第一个可用的编号
  let nextNum = 1
  for (const num of unnamedConfigs) {
    if (num !== nextNum) {
      break
    }
    nextNum++
  }
  
  return `未命名方案${nextNum}`
}

// 重置转盘
const resetWheel = () => {
  if (!wheelRef.value) return
  if (wheelRef.value.isSpinning) {
    alert('请等待当前抽奖结束')
    return
  }
  showResetConfirm.value = true
}

// 确认重置
const confirmReset = () => {
  if (!wheelRef.value) return
  wheelRef.value.prizes = []
  configTitle.value = ''
  currentConfigId.value = ''
  showResetConfirm.value = false
}

// 检查是否存在相同的配置
const findMatchingConfig = (prizes: Prize[]) => {
  if (!historyRef.value) return null
  
  return historyRef.value.configs.find(config => {
    if (config.prizes.length !== prizes.length) return false
    
    return config.prizes.every((prize, index) => {
      const currentPrize = prizes[index]
      return prize.code === currentPrize.code &&
             prize.name === currentPrize.name &&
             prize.probability === currentPrize.probability
    })
  })
}

// 显示保存对话框
const showSaveDialog = () => {
  if (!wheelRef.value?.prizes.length) {
    alert('请先添加方案内容')
    return
  }
  showSaveModal.value = true
}

// 保存当前配置
const saveConfig = () => {
  if (!wheelRef.value || !historyRef.value) return
  if (!configTitle.value.trim()) {
    alert('请输入方案名称')
    return
  }
  if (!wheelRef.value.prizes.length) {
    alert('请至少添加一个选项')
    return
  }

  // 查找是否存在原有配置
  const existingConfig = historyRef.value.configs.find(c => c.id === currentConfigId.value)
  
  // 检查是否存在同名方案（排除当前正在编辑的方案）
  const hasSameTitle = historyRef.value.configs.some(c => 
    c.title === configTitle.value && c.id !== currentConfigId.value
  )
  
  if (hasSameTitle) {
    alert('已存在同名方案，请使用其他名称')
    return
  }

  const config: LotteryConfig = {
    id: currentConfigId.value || uuidv4(),
    title: configTitle.value,
    prizes: wheelRef.value.prizes,
    createdAt: existingConfig?.createdAt || new Date().toISOString(),
    isSystem: existingConfig?.isSystem || false // 保持原有的isSystem标记，如果是新配置则为false
  }

  historyRef.value.addConfig(config)
  currentConfigId.value = config.id
  showSaveModal.value = false
  configTitle.value = '' // 清空输入框
  showSuccess('方案保存成功！')

  // 保存到 localStorage
  const configs = JSON.parse(localStorage.getItem('lottery_configs') || '[]')
  const index = configs.findIndex((c: LotteryConfig) => c.id === config.id)
  if (index !== -1) {
    configs[index] = config
  } else {
    configs.push(config)
  }
  localStorage.setItem('lottery_configs', JSON.stringify(configs))
}

// 加载配置
const loadConfig = (config: LotteryConfig) => {
  if (!wheelRef.value || !historyRef.value) return
  configTitle.value = config.title
  currentConfigId.value = config.id
  wheelRef.value.prizes = [...config.prizes]
  showSchemeList.value = false  // 选择方案后关闭弹窗
}

// 处理抽奖结果
const handlePrizeSelected = (prize: Prize) => {
  if (!historyRef.value || !wheelRef.value) return

  // 如果没有当前配置，检查是否存在匹配的配置
  if (!currentConfigId.value) {
    const matchingConfig = findMatchingConfig(wheelRef.value.prizes)
    
    if (matchingConfig) {
      // 如果找到匹配的配置，使用该配置
      currentConfigId.value = matchingConfig.id
    } else {
      // 如果没有匹配的配置，创建新的配置
      const newConfig: LotteryConfig = {
        id: uuidv4(),
        title: getNextUnnamedTitle(),
        prizes: wheelRef.value.prizes,
        createdAt: new Date().toISOString()
      }
      currentConfigId.value = newConfig.id
      historyRef.value.addConfig(newConfig)
      
      // 保存到 localStorage
      const configs = JSON.parse(localStorage.getItem('lottery_configs') || '[]')
      configs.push(newConfig)
      localStorage.setItem('lottery_configs', JSON.stringify(configs))
    }
  }

  // 找到选中选项在当前配置中的索引
  const prizeIndex = wheelRef.value.prizes.findIndex(p => p.name === prize.name)

  const record: LotteryRecord = {
    id: uuidv4(),
    configId: currentConfigId.value,
    prize: {
      ...prize,
      // 保存选项的原始索引，这样在历史记录中就能保持相同的颜色
      originalIndex: prizeIndex
    },
    timestamp: new Date().toISOString()
  }

  historyRef.value.addRecord(record)
}

// 提交反馈
const submitFeedback = () => {
  if (!feedbackContent.value.trim()) {
    alert('请输入反馈内容')
    return
  }
  feedbackHistoryRef.value?.addFeedback(feedbackContent.value)
  feedbackContent.value = ''
  showFeedbackOptions.value = false // 关闭反馈框
  showSuccess('反馈提交成功！') // 使用新的提示方式
}

// 联系客服
const contactQQ = () => {
  // 这里可以添加联系客服的逻辑
  alert('正在联系客服...')
}

// 显示删除确认框
const showDeleteConfirm = (config: LotteryConfig) => {
  schemeToDelete.value = config
  showDeleteSchemeConfirm.value = true
}

// 确认删除方案
const confirmDeleteScheme = () => {
  if (!historyRef.value || !schemeToDelete.value) return
  
  // 如果要删除的是当前正在使用的方案，先清空转盘
  if (currentConfigId.value === schemeToDelete.value.id) {
    if (wheelRef.value) {
      wheelRef.value.prizes = []
    }
    currentConfigId.value = ''
    configTitle.value = ''
  }
  
  historyRef.value.deleteConfig(schemeToDelete.value.id)
  showSuccess('方案删除成功！')
  showDeleteSchemeConfirm.value = false
  schemeToDelete.value = null
}
</script>

<style scoped>
.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0;
  font-weight: bold;
  background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.config-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.switch-scheme-btn,
.save-btn,
.reset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.switch-scheme-btn {
  background-color: #4CAF50;
  color: white;
}

.switch-scheme-btn:hover {
  background-color: #45a049;
}

.save-btn {
  background-color: #3498db;
  color: white;
}

.save-btn:hover {
  background-color: #2980b9;
}

.reset-btn {
  background-color: #e74c3c;
  color: white;
}

.reset-btn:hover {
  background-color: #c0392b;
}

.reset-icon {
  font-size: 1rem;
}

main {
  display: flex;
  gap: 2rem;
}

.lottery-section {
  flex: 2;
}

.history-section {
  flex: 1;
  min-width: 300px;
}

footer {
  display: block;
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100vw;
  background: transparent;
  z-index: 100;
  padding-bottom: 0;
}

.project-purpose {
  margin: 0 auto 8px auto;
  padding: 0 0 8px 0;
  color: #aaa;
  font-size: 0.95rem;
  text-align: center;
  font-weight: 400;
  letter-spacing: 0.01em;
  line-height: 1.5;
  background: none;
  border-radius: 0;
  max-width: 100vw;
  width: 100%;
  box-shadow: none;
  font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  display: block;
}

.feedback-btn {
  margin-left: 24px;
  margin-top: 8px;
}

.feedback-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #9b59b6;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.feedback-btn:hover {
  background: #8e44ad;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.feedback-icon {
  font-size: 1.2rem;
}

.feedback-options-modal {
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
  animation: fadeIn 0.3s ease;
}

.modal-content {
  position: relative;
  background: white;
  padding: 2rem 3rem;
  border-radius: 8px;
  font-size: 1.1rem;
  color: #2c3e50;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #95a5a6;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #2c3e50;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal {
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

.modal-content h3 {
  margin: 0 0 1.5rem;
  color: #2c3e50;
  text-align: center;
}

.modal-content .title-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn,
.confirm-btn {
  padding: 0.5rem 1.5rem;
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
  background: #27ae60;
  color: white;
}

.confirm-btn:hover {
  background: #219a52;
}

.welcome-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.welcome-content {
  position: relative;
  background: white;
  padding: 2.5rem 3rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.4s ease;
}

.welcome-text {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 0.5rem;
  font-weight: bold;
}

.welcome-text-en {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin: 0 0 2rem;
  font-style: italic;
}

.try-it-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.8rem 2.5rem;
  font-size: 1.2rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.try-it-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.try-it-btn:active {
  transform: translateY(0);
}

.feedback-options {
  display: flex;
  gap: 2rem;
  align-items: stretch;
  margin-top: 1.5rem;
  position: relative;
}

.feedback-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.9rem;
  position: relative;
  width: 40px;
}

.feedback-divider::before,
.feedback-divider::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 1px;
  height: 100px;
  background: #ddd;
  transform: translateX(-50%);
  }

.feedback-divider::before {
  bottom: 50%;
  margin-bottom: 10px;
}

.feedback-divider::after {
  top: 50%;
  margin-top: 10px;
}

.feedback-textarea {
  width: 100%;
  height: 120px;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-size: 0.9rem;
  font-family: inherit;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.submit-btn {
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.qq-info {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  color: #2c3e50;
  }

h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.feedback-dialog {
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

.feedback-content {
  position: relative;
  background: white;
  padding: 2rem 3rem;
  border-radius: 8px;
  font-size: 1.1rem;
  color: #2c3e50;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #95a5a6;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  transition: color 0.2s;
  }

.close-btn:hover {
  color: #2c3e50;
}

.divider {
  height: 1px;
  background: #ddd;
  margin: 1.5rem auto;
  width: 80%;
}

/* 成功提示框样式 */
.success-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  background: #2ecc71;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
  display: flex;
  align-items: center;
  z-index: 2000;
  opacity: 0;
  transition: all 0.3s ease;
}

.success-message.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.success-content {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.success-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.success-text {
  font-size: 1rem;
  font-weight: 500;
}

/* 确认框样式 */
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
  animation: fadeIn 0.3s ease;
}

.confirm-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 400px;
  animation: slideIn 0.3s ease;
}

.confirm-message {
  margin: 1.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  text-align: center;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn, .confirm-btn {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.scheme-list-modal .modal-content {
  min-width: 300px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.scheme-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.scheme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.scheme-name {
  font-size: 16px;
  color: #333;
}

.select-btn {
  padding: 6px 12px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.select-btn:hover {
  background-color: #1976D2;
}

.scheme-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.delete-btn {
  padding: 6px 10px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.delete-icon {
  font-size: 14px;
}
</style> 