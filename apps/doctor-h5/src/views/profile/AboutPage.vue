<template>
  <div class="about-page">
    <van-nav-bar title="关于雷檬云" left-arrow @click-left="$router.back()" />
    <div class="about-header">
      <div class="about-logo">🍋</div>
      <h2 class="about-name">雷檬云 · 医生版</h2>
      <p class="about-desc">专业糖尿病患者管理平台</p>
      <p class="about-version">版本 v0.1.0</p>
    </div>
    <van-cell-group inset>
      <van-cell title="功能介绍" value="管理患者、查看数据、实时沟通" />
      <van-cell title="隐私政策" is-link />
      <van-cell title="用户协议" is-link />
    </van-cell-group>
    <div class="about-footer">
      <p>© 2026 雷檬云 LeiMengYun</p>
      <p>专业糖尿病患者管理平台</p>
    </div>
  </div>
</template>

<style scoped>
.about-header {
  text-align: center;
  padding: 40px 16px 32px;
}
.about-logo {
  font-size: 64px;
}
.about-name {
  font-size: 22px;
  font-weight: 700;
  color: #3B82F6;
  margin-top: 8px;
}
.about-desc {
  font-size: 14px;
  color: #646566;
  margin-top: 4px;
}
.about-version {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}
.about-footer {
  text-align: center;
  padding: 40px 16px;
  color: #969799;
  font-size: 12px;
  line-height: 1.8;
}
</style>
