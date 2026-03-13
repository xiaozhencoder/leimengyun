import client from './client'

export function getTopics() {
  return client.get('/community/topics')
}

export function getPosts(params: { page?: number; pageSize?: number; tab?: string; topicId?: string }) {
  return client.get('/community/posts', { params })
}

export function getPostById(id: string) {
  return client.get(`/community/posts/${id}`)
}

export function createPost(data: {
  contentType: string
  content: string
  title?: string
  images?: string[]
  topicId?: string
  bloodSugarData?: any
  isAnonymous?: boolean
}) {
  return client.post('/community/posts', data)
}

export function updatePost(id: string, data: any) {
  return client.put(`/community/posts/${id}`, data)
}

export function deletePost(id: string) {
  return client.delete(`/community/posts/${id}`)
}

export function togglePostLike(id: string) {
  return client.post(`/community/posts/${id}/like`)
}

export function togglePostCollect(id: string) {
  return client.post(`/community/posts/${id}/collect`)
}

export function getComments(postId: string, params?: { page?: number; pageSize?: number }) {
  return client.get(`/community/posts/${postId}/comments`, { params })
}

export function createComment(postId: string, data: { content: string; parentId?: string; replyToUserId?: string }) {
  return client.post(`/community/posts/${postId}/comments`, data)
}

export function deleteComment(id: string) {
  return client.delete(`/community/comments/${id}`)
}

export function toggleCommentLike(id: string) {
  return client.post(`/community/comments/${id}/like`)
}

export function toggleFollow(userId: string) {
  return client.post(`/community/users/${userId}/follow`)
}

export function getUserProfile(userId: string) {
  return client.get(`/community/users/${userId}/profile`)
}

export function getUserPosts(userId: string, params?: { page?: number; pageSize?: number }) {
  return client.get(`/community/users/${userId}/posts`, { params })
}

export function getMyPosts(params?: { page?: number; pageSize?: number }) {
  return client.get('/community/posts/my', { params })
}

export function getCollectedPosts(params?: { page?: number; pageSize?: number }) {
  return client.get('/community/posts/collected', { params })
}

export function getFollowingPosts(params?: { page?: number; pageSize?: number }) {
  return client.get('/community/posts/following', { params })
}

export function checkIn() {
  return client.post('/community/check-in')
}

export function getCheckInStatus() {
  return client.get('/community/check-in/status')
}

export function getCheckInHistory(days?: number) {
  return client.get('/community/check-in/history', { params: { days } })
}

export function searchCommunity(params: { keyword: string; type?: string; page?: number; pageSize?: number }) {
  return client.get('/community/search', { params })
}
