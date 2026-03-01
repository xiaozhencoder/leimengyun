<template>
  <div class="bind-page">
    <van-nav-bar title="绑定医生" left-arrow @click-left="$router.back()" />
    <van-search v-model="keyword" placeholder="搜索医生姓名/医院" @search="loadDoctors" />

    <van-cell-group v-if="myDoctors.length" inset title="已绑定医生" style="margin-top: 12px">
      <van-cell v-for="d in myDoctors" :key="d.bindId" :title="d.realName" :label="`${d.hospital} · ${d.department}`" is-link @click="goChat(d)">
        <template #icon>
          <div class="doc-avatar">{{ d.realName?.[0] || '医' }}</div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset :title="myDoctors.length ? '更多医生' : '推荐医生'" style="margin-top: 12px">
      <van-empty v-if="!doctorsToShow.length && !loading" description="暂无可绑定的医生" />
      <van-cell v-for="d in doctorsToShow" :key="d.user.id" :title="d.realName" :label="`${d.hospital} · ${d.department}`">
        <template #icon>
          <div class="doc-avatar">{{ d.realName?.[0] || '医' }}</div>
        </template>
        <template #right-icon>
          <van-button size="small" type="primary" :loading="bindingId === d.user.id" @click="handleBind(d.user.id)">绑定</van-button>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { searchDoctors, bindDoctor, getMyDoctors } from '@/api/user'

const router = useRouter()
const keyword = ref('')
const doctors = ref<any[]>([])
const myDoctors = ref<any[]>([])
const loading = ref(false)
const bindingId = ref('')

const doctorsToShow = computed(() => {
  const boundIds = new Set(myDoctors.value.map((m) => m.doctorUserId))
  return doctors.value.filter((d) => d.user?.id && !boundIds.has(d.user.id))
})

async function loadDoctors() {
  loading.value = true
  try {
    doctors.value = (await searchDoctors(keyword.value || undefined)) as any[]
  } catch { doctors.value = [] }
  finally { loading.value = false }
}

async function loadMyDoctors() {
  try { myDoctors.value = (await getMyDoctors()) as any[] } catch { myDoctors.value = [] }
}

async function handleBind(doctorUserId: string) {
  bindingId.value = doctorUserId
  try {
    await bindDoctor(doctorUserId)
    showSuccessToast('绑定申请已发送')
    await Promise.all([loadDoctors(), loadMyDoctors()])
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '绑定失败')
  } finally { bindingId.value = '' }
}

function goChat(d: { conversationId?: string | null }) {
  if (d.conversationId) {
    router.push('/chat/' + d.conversationId)
  } else {
    showFailToast('会话不存在')
  }
}

onMounted(() => { loadDoctors(); loadMyDoctors() })
</script>

<style scoped>
.doc-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: #E8F0FE; color: #3B82F6;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 16px; margin-right: 12px;
}
</style>
