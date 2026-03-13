<template>
  <div class="help-page">
    <van-nav-bar title="帮助与反馈" left-arrow @click-left="$router.back()" />
    <van-cell-group inset title="常见问题" style="margin-top: 12px">
      <van-cell title="如何管理患者？" is-link @click="toggleFaq(0)">
        <template v-if="openFaq === 0" #label>
          <p class="faq-answer">患者发起绑定申请后，在"患者"页面的待处理区域可以通过或拒绝申请。通过后即可查看患者的健康数据。</p>
        </template>
      </van-cell>
      <van-cell title="如何查看患者血糖数据？" is-link @click="toggleFaq(1)">
        <template v-if="openFaq === 1" #label>
          <p class="faq-answer">在患者列表中点击患者进入详情页，可查看该患者的血糖趋势图和最近记录。</p>
        </template>
      </van-cell>
      <van-cell title="如何完成医生认证？" is-link @click="toggleFaq(2)">
        <template v-if="openFaq === 2" #label>
          <p class="faq-answer">首次登录后填写专业信息（医院、科室、职称、执业编号等），提交后等待管理员审核通过。</p>
        </template>
      </van-cell>
      <van-cell title="审核不通过怎么办？" is-link @click="toggleFaq(3)">
        <template v-if="openFaq === 3" #label>
          <p class="faq-answer">请根据拒绝原因修改信息后重新提交审核，或联系客服咨询。</p>
        </template>
      </van-cell>
    </van-cell-group>
    <van-cell-group inset title="联系我们" style="margin-top: 12px">
      <van-cell title="客服邮箱" value="support@leimengyun.com" />
      <van-cell title="客服电话" value="400-888-0000" />
    </van-cell-group>
    <div style="padding: 24px 16px">
      <van-button block type="primary" plain @click="showFeedback = true">提交反馈</van-button>
    </div>
    <van-dialog v-model:show="showFeedback" title="提交反馈" show-cancel-button @confirm="submitFeedback">
      <div style="padding: 16px">
        <van-field v-model="feedbackText" type="textarea" placeholder="请描述您的问题或建议..." rows="4" maxlength="500" show-word-limit />
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showSuccessToast } from 'vant'

const openFaq = ref(-1)
const showFeedback = ref(false)
const feedbackText = ref('')

function toggleFaq(idx: number) {
  openFaq.value = openFaq.value === idx ? -1 : idx
}

function submitFeedback() {
  if (feedbackText.value.trim()) {
    showSuccessToast('感谢您的反馈')
    feedbackText.value = ''
  }
}
</script>

<style scoped>
.faq-answer {
  font-size: 13px;
  color: #646566;
  line-height: 1.6;
  margin-top: 8px;
}
</style>
