<template>
  <div class="doctor-info-page">
    <van-nav-bar
      title="专业信息"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <span v-if="!editing" class="edit-btn" @click="startEdit">编辑</span>
        <span v-else class="edit-btn" @click="cancelEdit">取消</span>
      </template>
    </van-nav-bar>

    <!-- View Mode -->
    <div v-if="!editing" class="page-content">
      <van-cell-group inset title="基本信息">
        <van-cell title="姓名" :value="profile?.realName || '—'" />
        <van-cell title="医院" :value="profile?.hospital || '—'" />
        <van-cell title="科室" :value="profile?.department || '—'" />
        <van-cell title="职称" :value="titleLabel" />
        <van-cell title="执业编号" :value="profile?.licenseNo || '—'" />
      </van-cell-group>

      <van-cell-group inset title="擅长领域" style="margin-top: 12px">
        <div class="text-block">{{ profile?.specialties || '未填写' }}</div>
      </van-cell-group>

      <van-cell-group inset title="个人简介" style="margin-top: 12px">
        <div class="text-block">{{ profile?.bio || '未填写' }}</div>
      </van-cell-group>

      <div class="verify-section">
        <van-tag v-if="verifyStatus === 'APPROVED'" type="success" size="large">✓ 已认证</van-tag>
        <van-tag v-else-if="verifyStatus === 'PENDING'" type="warning" size="large">审核中</van-tag>
        <template v-else-if="verifyStatus === 'REJECTED'">
          <van-tag type="danger" size="large">审核未通过</van-tag>
          <p v-if="rejectReason" class="verify-reject-reason">拒绝原因：{{ rejectReason }}</p>
          <van-button size="small" type="primary" class="verify-reapply" @click="startEdit">重新申请</van-button>
        </template>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="page-content">
      <van-form @submit="onSave">
        <van-cell-group inset title="基本信息">
          <van-field
            v-model="form.hospital"
            label="医院"
            placeholder="请输入医院名称"
            :rules="[{ required: true, message: '请填写医院' }]"
          />
          <van-field
            label="科室"
            :model-value="departmentLabel"
            is-link
            readonly
            placeholder="请选择科室"
            @click="showDept = true"
          />
          <van-field
            label="职称"
            :model-value="editTitleLabel"
            is-link
            readonly
            placeholder="请选择职称"
            @click="showTitle = true"
          />
        </van-cell-group>

        <van-cell-group inset title="擅长领域（选填）" style="margin-top: 12px">
          <van-field
            v-model="form.specialties"
            type="textarea"
            placeholder="请描述您的擅长领域"
            rows="3"
            maxlength="200"
            show-word-limit
          />
        </van-cell-group>

        <van-cell-group inset title="个人简介（选填）" style="margin-top: 12px">
          <van-field
            v-model="form.bio"
            type="textarea"
            placeholder="请简要介绍自己"
            rows="4"
            maxlength="500"
            show-word-limit
          />
        </van-cell-group>

        <div style="padding: 24px 16px">
          <van-button round block type="primary" native-type="submit" :loading="saving">
            保存修改
          </van-button>
        </div>
      </van-form>
    </div>

    <van-action-sheet v-model:show="showDept" :actions="deptActions" @select="onDeptSelect" />
    <van-action-sheet v-model:show="showTitle" :actions="titleActions" @select="onTitleSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { updateDoctorProfile } from '@/api/user'

const userStore = useUserStore()
const editing = ref(false)
const saving = ref(false)
const showDept = ref(false)
const showTitle = ref(false)

const profile = computed(() => userStore.profile)
const verifyStatus = computed(() => (userStore.profile as any)?.verifyStatus ?? '')
const rejectReason = computed(() => (userStore.profile as any)?.rejectReason ?? '')

const titleActions = [
  { name: '主任医师', value: 'CHIEF' },
  { name: '副主任医师', value: 'ASSOCIATE_CHIEF' },
  { name: '主治医师', value: 'ATTENDING' },
  { name: '住院医师', value: 'RESIDENT' },
]

const deptActions = [
  { name: '内分泌科', value: '内分泌科' },
  { name: '营养科', value: '营养科' },
  { name: '全科医学科', value: '全科医学科' },
  { name: '其他', value: '其他' },
]

const TITLE_LABELS: Record<string, string> = {
  CHIEF: '主任医师',
  ASSOCIATE_CHIEF: '副主任医师',
  ATTENDING: '主治医师',
  RESIDENT: '住院医师',
}

const titleLabel = computed(() => profile.value ? (TITLE_LABELS[profile.value.title] || profile.value.title) : '—')

const form = ref({
  hospital: '',
  department: '',
  title: '',
  specialties: '',
  bio: '',
})

const departmentLabel = computed(() => form.value.department || '请选择')
const editTitleLabel = computed(() => titleActions.find((a) => a.value === form.value.title)?.name || '请选择')

function onDeptSelect(action: any) { form.value.department = action.value; showDept.value = false }
function onTitleSelect(action: any) { form.value.title = action.value; showTitle.value = false }

function startEdit() {
  const p = profile.value
  if (p) {
    form.value.hospital = p.hospital || ''
    form.value.department = p.department || ''
    form.value.title = p.title || ''
    form.value.specialties = p.specialties || ''
    form.value.bio = p.bio || ''
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function onSave() {
  saving.value = true
  try {
    await updateDoctorProfile({
      hospital: form.value.hospital || undefined,
      department: form.value.department || undefined,
      title: form.value.title || undefined,
      specialties: form.value.specialties || undefined,
      bio: form.value.bio || undefined,
    })
    await userStore.fetchUser()
    showSuccessToast('保存成功')
    editing.value = false
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (!userStore.userInfo) userStore.fetchUser()
})
</script>

<style scoped>
.doctor-info-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.page-content {
  padding: 12px 0;
}
.edit-btn {
  font-size: 14px;
  color: #3b82f6;
  cursor: pointer;
}
.text-block {
  padding: 12px 16px;
  font-size: 14px;
  color: #323233;
  line-height: 1.6;
  min-height: 48px;
}
.verify-section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.verify-reject-reason {
  font-size: 13px;
  color: #cf1322;
  margin: 4px 0 0;
  text-align: center;
}
.verify-reapply { margin-top: 8px; }
</style>
