import { showToast, showNotify } from 'vant'

/**
 * 记录页等场景使用 Toast 展示错误，居中大字号，更易辨认
 */
export function showError(message: string) {
  showToast({
    message,
    type: 'fail',
    duration: 3000,
    overlay: true,
    overlayClass: 'feedback-overlay',
    className: 'feedback-toast feedback-toast--fail',
  })
}

/**
 * 记录页等场景使用 Toast 展示成功，居中大字号带勾选图标
 */
export function showSuccess(message: string) {
  showToast({
    message,
    type: 'success',
    duration: 2000,
    overlay: true,
    overlayClass: 'feedback-overlay',
    className: 'feedback-toast feedback-toast--success',
  })
}
