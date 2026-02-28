import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { connectSocket, disconnectSocket } from './api/socket'
import 'vant/lib/index.css'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

router.afterEach((to) => {
  const token = localStorage.getItem('doc_token')
  if (token && to.meta.auth !== false) {
    connectSocket(token)
  }
  if (to.path === '/login') {
    disconnectSocket()
  }
})

app.mount('#app')
