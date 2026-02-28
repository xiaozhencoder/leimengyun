<template>
  <div class="bind-doctor-page">
    <van-nav-bar title="绑定医生" left-arrow @click-left="$router.back()" />

    <van-search
      v-model="searchText"
      placeholder="搜索医生姓名或科室"
      show-action
      @search="handleSearch"
      @cancel="handleCancel"
    />

    <div class="search-results">
      <van-empty v-if="searched && doctors.length === 0" description="未找到医生" />

      <van-cell
        v-for="doc in doctors"
        :key="doc.id"
        :title="doc.name"
        :label="`${doc.hospital} · ${doc.department}`"
        is-link
      >
        <template #right-icon>
          <van-button size="small" type="primary" plain @click="handleBind(doc)">
            绑定
          </van-button>
        </template>
      </van-cell>
    </div>

    <div v-if="!searched" class="tips">
      <van-icon name="info-o" />
      <span>搜索并绑定您的主治医生，便于在线沟通</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast, showDialog } from 'vant'
import client from '@/api/client'

const searchText = ref('')
const searched = ref(false)

interface Doctor {
  id: string
  name: string
  hospital: string
  department: string
  title: string
}
const doctors = ref<Doctor[]>([])

function handleSearch() {
  if (!searchText.value.trim()) {
    showToast('请输入搜索关键词')
    return
  }
  searched.value = true
  client
    .get('/user/doctors/search', { params: { keyword: searchText.value } })
    .then((res) => {
      doctors.value = res.data || []
    })
    .catch(() => {
      showToast('搜索失败')
    })
}

function handleCancel() {
  searchText.value = ''
  searched.value = false
  doctors.value = []
}

function handleBind(doc: Doctor) {
  showDialog({
    title: '确认绑定',
    message: `确定绑定 ${doc.name} 医生吗？`,
    showCancelButton: true,
  }).then(() => {
    client
      .post('/user/doctors/bind', { doctorId: doc.id })
      .then(() => {
        showToast('绑定请求已发送')
      })
      .catch(() => {
        showToast('绑定失败，请重试')
      })
  })
}
</script>

<style scoped>
.bind-doctor-page {
  min-height: 100vh;
  background: var(--bg);
}

.tips {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
