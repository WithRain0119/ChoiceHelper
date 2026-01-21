<template>
  <div class="lottery-wheel">
    <div class="wheel-container">
      <div class="pointer">▼</div>
      <canvas ref="wheelCanvas" :width="canvasSize" :height="canvasSize"></canvas>
      <button class="spin-button" @click="spin" :disabled="isSpinning">{{ isSpinning ? '抽奖中...' : '启动转盘' }}</button>
      <div v-if="showResult" class="result-popup" :class="{ 'show': showResult }">
        <div class="result-content">
          <h3>建议您选择：</h3>
          <div class="prize-result">
            <span class="prize-code">{{ currentPrize?.code }}</span>
            <span class="prize-name">{{ currentPrize?.name }}</span>
          </div>
          <button @click="closeResult" class="close-btn">确定</button>
        </div>
      </div>
    </div>
    <div class="prize-list">
      <div class="prize-list-header">
        <div class="current-config-name">当前：{{ currentConfigTitle }}</div>
        <button class="toggle-btn" @click="isSettingExpanded = !isSettingExpanded">
          {{ isSettingExpanded ? '收起' : '展开' }}
          <span class="toggle-icon" :class="{ 'expanded': isSettingExpanded }">▼</span>
        </button>
      </div>
      <div class="prize-list-content" :class="{ 'expanded': isSettingExpanded }">
        <h3>当前方案设置</h3>
        <div class="prize-inputs">
          <div v-for="(prize, index) in prizes" :key="index" class="prize-item">
            <input 
              :value="getCode(prize.name)"
              class="code-input" 
              readonly 
              :title="'自动使用选项名称的第一个字符'"
            />
            <input
              v-model="prize.name"
              placeholder="选项名称"
              class="name-input"
              @input="prize.code = getCode(prize.name)"
            />
            <input
              v-model.number="prize.probability"
              type="number"
              min="0"
              max="100"
              placeholder="概率"
              class="probability-input"
            />
            <button @click="removePrize(index)" class="remove-btn">删除</button>
          </div>
        </div>
        <button @click="addPrize" class="add-btn">添加选项</button>
      </div>
    </div>
    <div v-if="showProbabilityError" class="confirm-modal" @click="closeProbabilityError">
      <div class="confirm-content" @click.stop>
        <h3>概率校验失败</h3>
        <p class="confirm-message">概率之和必须为100%，请调整各项概率！<br><span style="color:#e74c3c;font-size:1.1em;">当前概率之和：{{ currentTotalProbability }}%</span></p>
        <div class="confirm-actions">
          <button class="confirm-btn" @click="closeProbabilityError">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { Prize } from '../types'

const props = defineProps<{
  currentConfigTitle?: string
}>()

const emit = defineEmits<{
  (e: 'prize-selected', prize: Prize): void
}>()

const wheelCanvas = ref<HTMLCanvasElement | null>(null)
const canvasSize = 400
const isSpinning = ref(false)
const showResult = ref(false)
const currentPrize = ref<Prize | null>(null)
const showProbabilityError = ref(false)
const currentTotalProbability = computed(() => prizes.value.reduce((sum, prize) => sum + (prize.probability || 0), 0))

const prizes = ref<Prize[]>([])

const totalProbability = computed(() => {
  return prizes.value.reduce((sum, prize) => sum + prize.probability, 0)
})

const isSettingExpanded = ref(true) // 默认展开

const sectorAngles = ref<{start: number, end: number}[]>([])

// 获取选项的代号（使用名称的第一个字符）
const getCode = (name: string) => {
  if (!name) return '?'
  // 获取第一个字符，如果是空格则继续往后找
  const firstChar = [...name.trim()][0]
  return firstChar || '?'
}

// 监听每个选项名称的变化，自动更新代号
watch(prizes, () => {
  prizes.value.forEach(prize => {
    prize.code = getCode(prize.name)
  })
}, { deep: true })

const addPrize = () => {
  prizes.value.push({
    code: '?',
    name: '',
    probability: 0
  })
}

const removePrize = (index: number) => {
  prizes.value.splice(index, 1)
}

const drawWheel = () => {
  const canvas = wheelCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const centerX = canvasSize / 2
  const centerY = canvasSize / 2
  const radius = canvasSize / 2 - 20

  // 定义鲜艳的颜色数组
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
  ]

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  const total = prizes.value.reduce((sum, prize) => sum + (prize.probability || 0), 0)
  const isEqualDistribution = total === 0

  let startAngle = -Math.PI / 2
  sectorAngles.value = []

  prizes.value.forEach((prize, index) => {
    let angle
    if (isEqualDistribution) {
      angle = 2 * Math.PI / prizes.value.length
    } else {
      angle = 2 * Math.PI * (prize.probability / total)
    }
    const endAngle = startAngle + angle
    sectorAngles.value.push({ start: startAngle, end: endAngle })

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = colors[index % colors.length]
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.save()
    ctx.translate(centerX, centerY)
    const textAngle = startAngle + angle / 2
    ctx.rotate(textAngle)
    ctx.textAlign = 'right'
    ctx.fillStyle = 'white'
    ctx.font = 'bold 20px sans-serif'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    if (textAngle > Math.PI / 2 && textAngle < Math.PI * 1.5) {
      ctx.rotate(Math.PI)
      ctx.textAlign = 'left'
      ctx.fillText(prize.code, -radius + 30, 0)
    } else {
      ctx.fillText(prize.code, radius - 30, 0)
    }
    ctx.restore()
    startAngle = endAngle
  })

  ctx.beginPath()
  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2)
  ctx.fillStyle = '#2c3e50'
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2)
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 10
  ctx.stroke()
}

const closeResult = () => {
  showResult.value = false
  currentPrize.value = null
}

const closeProbabilityError = () => {
  showProbabilityError.value = false
}

const getPrizeIndexByAngle = (angle: number) => {
  // angle: 以0度为0点，顺时针为正
  let normAngle = (angle + 2 * Math.PI) % (2 * Math.PI)
  for (let i = 0; i < sectorAngles.value.length; i++) {
    const sector = sectorAngles.value[i]
    let start = (sector.start + Math.PI/2 + 2 * Math.PI) % (2 * Math.PI)
    let end = (sector.end + Math.PI/2 + 2 * Math.PI) % (2 * Math.PI)
    // 处理跨0点的情况
    if (end < start) end += 2 * Math.PI
    if (normAngle >= start && normAngle < end) {
      return i
    }
  }
  return 0 // 兜底
}

const spin = () => {
  if (isSpinning.value) return
  if (prizes.value.length === 0) {
    showProbabilityError.value = false
    alert('请先添加奖项')
    return
  }
  const totalProbability = prizes.value.reduce((sum, prize) => sum + (prize.probability || 0), 0)
  if (totalProbability !== 100) {
    showProbabilityError.value = true
    return
  } else {
    showProbabilityError.value = false
  }
  const allZeroProbability = prizes.value.every(prize => prize.probability === 0)
  if (allZeroProbability) {
    const averageProbability = Math.floor(100 / prizes.value.length)
    const remainder = 100 - (averageProbability * prizes.value.length)
    prizes.value.forEach((prize, index) => {
      prize.probability = index === prizes.value.length - 1 
        ? averageProbability + remainder 
        : averageProbability
    })
  }
  isSpinning.value = true
  showResult.value = false

  // 计算概率分布区间
  const total = prizes.value.reduce((sum, prize) => sum + (prize.probability || 0), 0)
  let ranges = []
  let acc = 0
  for (let i = 0; i < prizes.value.length; i++) {
    const p = total === 0 ? 1 / prizes.value.length : prizes.value[i].probability / total
    ranges.push({
      start: acc,
      end: acc + p,
      index: i
    })
    acc += p
  }
  // 随机数决定落在哪个奖项
  const rand = Math.random()
  let selectedIndex = 0
  for (let i = 0; i < ranges.length; i++) {
    if (rand >= ranges[i].start && rand < ranges[i].end) {
      selectedIndex = ranges[i].index
      break
    }
  }

  // 中奖项的中心角度
  const sector = sectorAngles.value[selectedIndex]
  const targetAngle = (sector.start + sector.end) / 2
  const targetDeg = (targetAngle * 180 / Math.PI)
  const extraSpins = 5 + Math.floor(Math.random() * 2)
  const totalAngle = -targetDeg + 360 * extraSpins

  const canvas = wheelCanvas.value
  if (!canvas) return

  let currentAngle = 0
  let startTime = performance.now()
  const duration = 5000

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    currentAngle = easeOut(progress) * totalAngle
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.translate(canvasSize / 2, canvasSize / 2)
    ctx.rotate((currentAngle * Math.PI) / 180)
    ctx.translate(-canvasSize / 2, -canvasSize / 2)
    drawWheel()
    ctx.restore()
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      isSpinning.value = false
      // 反推当前指针所指扇区
      let finalRad = ((-currentAngle % 360 + 360) % 360) * Math.PI / 180 - 0.0001
      if (finalRad < 0) finalRad += 2 * Math.PI
      let idx = getPrizeIndexByAngle(finalRad)
      currentPrize.value = prizes.value[idx]
      showResult.value = true
      emit('prize-selected', prizes.value[idx])
    }
  }
  requestAnimationFrame(animate)
}

// 监听奖项变化，重绘转盘
watch(prizes, drawWheel, { deep: true })

onMounted(() => {
  drawWheel()
})

defineExpose({
  prizes,
  isSpinning
})
</script>

<style scoped>
.lottery-wheel {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.wheel-container {
  position: relative;
  width: v-bind(canvasSize + 'px');
  height: v-bind(canvasSize + 'px');
}

.pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32px;
  color: #2c3e50;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.spin-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem 2rem;
  border: none;
  border-radius: 2rem;
  background: #2c3e50;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.spin-button:hover:not(:disabled) {
  background: #1a2634;
}

.spin-button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.prize-list {
  flex: 1;
  max-width: 500px;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.prize-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

.toggle-btn:active {
  transform: translateY(0px);
}

.toggle-icon {
  display: inline-block;
  transition: transform 0.3s ease;
  font-size: 0.8em;
  margin-top: 2px;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.prize-list-content {
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: 1;
  transform-origin: top;
  transform: scaleY(1);
  visibility: visible;
}

.prize-list-content:not(.expanded) {
  transform: scaleY(0);
  opacity: 0;
  margin-top: -20px;
  visibility: hidden;
}

.prize-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.prize-item {
  display: grid;
  grid-template-columns: 80px 1fr 100px 60px;
  gap: 0.5rem;
  align-items: center;
}

.code-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: #f8f9fa;
  cursor: not-allowed;
  text-align: center;
  font-weight: bold;
}

.name-input,
.probability-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.remove-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background: #e74c3c;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
}

.add-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.result-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 9999;
}

.result-popup.show {
  opacity: 1;
  visibility: visible;
}

.result-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  z-index: 10000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

@keyframes popIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.result-content h3 {
  color: #2c3e50;
  margin: 0 0 1rem;
  font-size: 1.5rem;
}

.prize-result {
  margin: 1.5rem 0;
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.prize-result .prize-code {
  font-size: 2rem;
  font-weight: bold;
  color: #e74c3c;
}

.prize-result .prize-name {
  font-size: 1.5rem;
  color: #2c3e50;
}

.close-btn {
  padding: 0.5rem 2rem;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #2980b9;
}

.spin-button {
  min-width: 120px;
}

.current-config-name {
  text-align: center;
  color: #2c3e50;
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
  font-weight: bold;
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

.confirm-btn {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  background: #e74c3c;
  color: white;
  transition: all 0.2s ease;
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
</style> 