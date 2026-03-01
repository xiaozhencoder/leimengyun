import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Notify, setToastDefaultOptions } from 'vant'
import App from './App.vue'
import router from './router'
import { connectSocket, disconnectSocket } from './api/socket'
import 'vant/lib/index.css'
import './styles/global.css'

// 失败 Toast 优化（通用场景）
setToastDefaultOptions('fail', {
  position: 'top',
  duration: 3500,
  overlay: true,
  className: 'toast-fail-enhanced',
})

const app = createApp(App)
app.use(Notify)
const pinia = createPinia()
app.use(pinia)
app.use(router)

router.afterEach((to) => {
  const token = localStorage.getItem('token')
  if (token && to.meta.auth !== false) {
    connectSocket(token)
  }
  if (to.path === '/login') {
    disconnectSocket()
  }
})

app.mount('#app')
