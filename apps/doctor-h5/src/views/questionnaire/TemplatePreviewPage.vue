<template>
  <div class="template-preview">
    <van-nav-bar title="问卷预览" left-arrow @click-left="router.back()" />
    <van-loading v-if="loading" class="page-loading" />
    <template v-else-if="template">
      <div class="preview-header">
        <div class="preview-title">{{ template.title }}</div>
        <div class="preview-desc">{{ template.description }}</div>
        <div class="preview-meta">
          <van-tag type="primary">{{ questions.length }}题</van-tag>
          <van-tag plain>约{{ template.estimatedTime }}分钟</van-tag>
          <van-tag v-if="template.totalScore" plain color="#1AAD6E">满分{{ template.totalScore }}</van-tag>
        </div>
      </div>
      <div class="preview-questions">
        <div v-for="(q, idx) in questions" :key="q.id" class="preview-q">
          <div class="preview-q__header">
            <span class="preview-q__num">{{ idx + 1 }}.</span>
            <van-tag :type="qTypeTag(q.type)">{{ qTypeLabel(q.type) }}</van-tag>
            <van-tag v-if="q.required" type="danger" plain>必填</van-tag>
          </div>
          <div class="preview-q__title">{{ q.title }}</div>
          <div v-if="q.options" class="preview-q__options">
            <div v-for="opt in q.options" :key="opt.value" class="preview-q__option">
              {{ opt.label }}
              <span v-if="opt.score !== undefined" class="preview-q__score">{{ opt.score }}分</span>
            </div>
          </div>
          <div v-if="q.type === 'rating'" class="preview-q__rating">
            {{ q.minLabel || q.min }} — {{ q.maxLabel || q.max }}
          </div>
          <div v-if="q.type === 'number'" class="preview-q__number">
            范围: {{ q.min }} - {{ q.max }} {{ q.unit || '' }}
          </div>
          <div v-if="q.type === 'text'" class="preview-q__text">
            文本输入（最多{{ q.maxLength || 200 }}字）
          </div>
        </div>
      </div>
      <div class="preview-footer">
        <van-button type="primary" block round @click="router.push(`/questionnaire/send?templateId=${template.id}`)">
          发送此问卷
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTemplateById } from '@/api/questionnaire'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const template = ref<any>(null)

const questions = computed(() => {
  if (!template.value?.questions) return []
  return Array.isArray(template.value.questions) ? template.value.questions : []
})

function qTypeLabel(type: string) {
  const map: Record<string, string> = {
    single_choice: '单选',
    multiple_choice: '多选',
    rating: '评分',
    number: '数值',
    text: '文本',
  }
  return map[type] || type
}

function qTypeTag(type: string): 'primary' | 'success' | 'warning' | 'danger' | 'default' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
    single_choice: 'primary',
    multiple_choice: 'success',
    rating: 'warning',
    number: 'default',
    text: 'default',
  }
  return map[type] || 'default'
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    template.value = await getTemplateById(id)
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.template-preview {
  min-height: 100vh;
  background: #F7F8FA;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.preview-header {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.preview-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.preview-desc {
  font-size: 13px;
  color: #999;
  margin-top: 6px;
  line-height: 1.5;
}

.preview-meta {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.preview-questions {
  padding: 0 12px 12px;
}

.preview-q {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.preview-q__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.preview-q__num {
  font-weight: 700;
  color: #3B82F6;
  font-size: 14px;
}

.preview-q__title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
}

.preview-q__options {
  margin-top: 8px;
  padding-left: 4px;
}

.preview-q__option {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  margin-top: 4px;
  background: #F7F8FA;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
}

.preview-q__score {
  color: #1AAD6E;
  font-weight: 600;
}

.preview-q__rating,
.preview-q__number,
.preview-q__text {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  padding: 6px 10px;
  background: #F7F8FA;
  border-radius: 6px;
}

.preview-footer {
  padding: 16px 12px 24px;
}
</style>
