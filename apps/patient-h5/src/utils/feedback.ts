import { showNotify } from 'vant'

/**
 * 记录页等场景使用 Notify 展示错误，顶部全宽通知条，比 Toast 更醒目
 */
export function showError(message: string) {
  showNotify({
    type: 'danger',
    message,
    duration: 4000,
    background: '#EE0A24',
    color: '#fff',
  })
}

/**
 * 记录页等场景使用 Notify 展示成功，顶部全宽通知条，比 Toast 更醒目
 */
export function showSuccess(message: string) {
  showNotify({
    type: 'success',
    message,
    duration: 2500,
    background: '#1AAD6E',
    color: '#fff',
  })
}
