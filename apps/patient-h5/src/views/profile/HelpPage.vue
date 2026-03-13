<template>
  <div class="help-page">
    <van-nav-bar title="帮助与反馈" left-arrow @click-left="$router.back()" />
    <van-cell-group inset title="常见问题" style="margin-top: 12px">
      <van-cell title="如何记录血糖？" is-link @click="toggleFaq(0)">
        <template v-if="openFaq === 0" #label>
          <p class="faq-answer">点击首页"记录血糖"按钮，输入血糖值、选择测量时段和时间，点击保存即可。</p>
        </template>
      </van-cell>
      <van-cell title="如何绑定医生？" is-link @click="toggleFaq(1)">
        <template v-if="openFaq === 1" #label>
          <p class="faq-answer">进入"我的"页面，点击"我的医生"，搜索医生姓名并发起绑定申请，等待医生确认即可。</p>
        </template>
      </van-cell>
      <van-cell title="血糖正常范围是多少？" is-link @click="toggleFaq(2)">
        <template v-if="openFaq === 2" #label>
          <p class="faq-answer">空腹血糖正常范围：3.9-6.1 mmol/L；餐后2小时血糖正常范围：3.9-7.8 mmol/L。</p>
        </template>
      </van-cell>
      <van-cell title="如何查看健康报告？" is-link @click="toggleFaq(3)">
        <template v-if="openFaq === 3" #label>
          <p class="faq-answer">进入"我的"页面，点击"健康报告"，可查看近7天或30天的血糖、饮食和用药统计。</p>
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
