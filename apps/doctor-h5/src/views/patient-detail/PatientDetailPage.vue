<template>
  <div class="detail-page">
    <van-nav-bar title="患者详情" left-arrow @click-left="$router.back()" />
    <div class="detail-header">
      <div class="detail-avatar">明</div>
      <div class="detail-info">
        <h3>糖友小明</h3>
        <p>男 · 35岁 · 1型糖尿病 · CSII</p>
      </div>
    </div>
    <van-cell-group inset title="今日数据">
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-value" style="color:#1AAD6E;">6.2</span><span class="stat-label">平均血糖</span></div>
        <div class="stat-item"><span class="stat-value">5</span><span class="stat-label">记录次数</span></div>
        <div class="stat-item"><span class="stat-value" style="color:#1AAD6E;">80%</span><span class="stat-label">达标率</span></div>
      </div>
    </van-cell-group>
    <van-cell-group inset title="最近记录" style="margin-top:12px;">
      <van-cell title="午餐后血糖" label="今天 12:30" value="8.5" />
      <van-cell title="午餐 · 米饭+青菜" label="今天 12:00 · 碳水 65g" />
      <van-cell title="诺和锐 · 8U · 腹部" label="今天 11:55" />
      <van-cell title="空腹血糖" label="今天 07:00" value="5.2" />
    </van-cell-group>
    <div style="padding: 16px;">
      <van-button round block type="primary" @click="$router.push('/chat/1')">发送消息</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.detail-header {
  background: #3B82F6; padding: 16px; display: flex; align-items: center; gap: 12px; color: #fff;
}
.detail-avatar {
  width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600;
}
.detail-info h3 { font-size: 18px; }
.detail-info p { font-size: 12px; opacity: 0.85; margin-top: 4px; }
.stats-grid { display: flex; padding: 12px 0; }
.stat-item { flex: 1; text-align: center; }
.stat-item + .stat-item { border-left: 1px solid #ebedf0; }
.stat-value { font-size: 22px; font-weight: 700; display: block; }
.stat-label { font-size: 11px; color: #969799; display: block; margin-top: 2px; }
</style>
