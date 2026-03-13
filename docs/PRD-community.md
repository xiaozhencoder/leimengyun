# 雷檬云 — 糖友社区 产品需求文档（PRD）

> 版本：v1.0 | 阶段：P1 | 更新日期：2026-03-13

---

## 一、功能概述

### 1.1 功能定位

在雷檬云现有「工具 + 医患沟通」体系基础上，新增 **糖友社区** 模块，构建以 **UGC 内容 + 同伴互助 + 专业科普** 为核心的患者交流平台，实现从「单人管理工具」到「社交化健康管理生态」的升级。

### 1.2 核心价值

| 用户角色 | 价值 |
|---------|------|
| 患者 | 获得同伴支持和情感共鸣；学习他人控糖经验；通过打卡获得持续激励 |
| 医生 | 发布科普内容建立个人品牌；触达更多潜在患者；了解患者群体关注热点 |
| 平台 | 提升用户粘性和留存率；积累 UGC 内容资产；为后续知识付费铺路 |

### 1.3 竞品对标

| 维度 | 糖糖圈 | 雷檬云社区（规划） | 差异化 |
|------|--------|------------------|--------|
| 社区形态 | 传统论坛式 | 信息流 + 话题圈 + 打卡 | 更现代的信息流体验 |
| 内容类型 | 图文帖子 | 图文 + 血糖日记 + 饮食打卡 | 与健康数据深度打通 |
| 互动形式 | 评论、点赞 | 评论、点赞、收藏、关注 | 标准社交功能闭环 |
| 医生参与 | 线上讲堂 | 医生专栏 + 帖子内答疑 | 医生直接参与社区互动 |
| 激励体系 | 打卡 | 血糖达标打卡 + 积分 + 徽章 | 与健康数据联动的游戏化 |

### 1.4 P1 范围

| 包含 | 不包含（后续迭代） |
|------|------------------|
| 信息流（发帖/浏览/点赞/评论/收藏） | 推荐算法、个性化信息流 |
| 话题标签与话题广场 | 话题运营后台 |
| 血糖日记（一键分享当日血糖数据到社区） | 饮食日记自动生成 |
| 医生专栏（认证医生发布科普文章） | 付费专栏、直播课程 |
| 血糖打卡（每日打卡 + 连续天数） | 积分商城、徽章系统 |
| 用户关注体系 | 粉丝排行、推荐关注 |
| 基础内容审核（敏感词过滤） | AI 内容审核、人工审核后台 |

---

## 二、信息架构

### 2.1 患者端新增页面

当前患者端底部 Tab 为：首页 | 记录 | 消息 | 我的

新增后调整为：**首页 | 记录 | 社区 | 消息 | 我的**

| 页面 | 入口 | 核心功能 |
|------|------|---------|
| 社区首页 | Tab-3 | 信息流浏览、话题入口、打卡入口、发帖入口 |
| 帖子详情 | 信息流/搜索 | 查看帖子全文、评论列表、点赞/收藏/分享 |
| 发布帖子 | 社区首页 FAB | 编辑图文帖子、选择话题、关联血糖数据 |
| 话题广场 | 社区首页 | 话题分类列表、热门话题 |
| 话题详情 | 话题广场 | 话题下的帖子列表 |
| 搜索 | 社区首页 | 搜索帖子/话题/用户 |
| 用户主页 | 帖子/评论 | 查看用户发布的帖子列表、关注/取消关注 |
| 血糖打卡 | 社区首页 | 每日打卡、连续天数、打卡动态 |
| 我的社区 | 我的 Tab | 我的帖子/评论/收藏/关注 |

### 2.2 医生端新增页面

当前医生端底部 Tab 为：患者 | 消息 | 我的

新增后调整为：**患者 | 社区 | 消息 | 我的**

| 页面 | 入口 | 核心功能 |
|------|------|---------|
| 社区首页 | Tab-2 | 浏览信息流（可筛选"全部/医生专栏"） |
| 发布文章 | 社区首页 FAB | 编辑科普文章（支持富文本） |
| 帖子/文章详情 | 信息流 | 查看、评论、点赞 |

---

## 三、数据模型

### 3.1 新增数据库模型

```
model Post {
  id          String    @id @default(uuid())
  authorId    String    @map("author_id")
  author      User      @relation(fields: [authorId], references: [id])
  contentType PostType  @default(NORMAL) @map("content_type")
  title       String?
  content     String    @db.Text
  images      String[]  @default([])
  topicId     String?   @map("topic_id")
  topic       Topic?    @relation(fields: [topicId], references: [id])
  // 血糖日记关联字段
  bloodSugarData Json?  @map("blood_sugar_data")
  likeCount   Int       @default(0) @map("like_count")
  commentCount Int      @default(0) @map("comment_count")
  collectCount Int      @default(0) @map("collect_count")
  status      PostStatus @default(PUBLISHED)
  isTop       Boolean   @default(false) @map("is_top")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  comments    Comment[]
  likes       PostLike[]
  collects    PostCollect[]

  @@map("posts")
}

model Comment {
  id          String   @id @default(uuid())
  postId      String   @map("post_id")
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId    String   @map("author_id")
  author      User     @relation(fields: [authorId], references: [id])
  content     String   @db.VarChar(500)
  parentId    String?  @map("parent_id")
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  replyToUserId String? @map("reply_to_user_id")
  likeCount   Int      @default(0) @map("like_count")
  createdAt   DateTime @default(now()) @map("created_at")
  likes       CommentLike[]

  @@map("comments")
}

model Topic {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  icon        String?
  postCount   Int      @default(0) @map("post_count")
  isHot       Boolean  @default(false) @map("is_hot")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  posts       Post[]

  @@map("topics")
}

model PostLike {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([postId, userId])
  @@map("post_likes")
}

model CommentLike {
  id        String   @id @default(uuid())
  commentId String   @map("comment_id")
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([commentId, userId])
  @@map("comment_likes")
}

model PostCollect {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([postId, userId])
  @@map("post_collects")
}

model UserFollow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id")
  follower    User     @relation("Followers", fields: [followerId], references: [id])
  followingId String   @map("following_id")
  following   User     @relation("Followings", fields: [followingId], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")

  @@unique([followerId, followingId])
  @@map("user_follows")
}

model CheckIn {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  date      String   // YYYY-MM-DD 格式，防止时区问题
  bsInRange Boolean  @default(false) @map("bs_in_range")
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([userId, date])
  @@map("check_ins")
}

enum PostType {
  NORMAL        // 普通帖子
  BLOOD_SUGAR_DIARY  // 血糖日记
  DOCTOR_ARTICLE    // 医生科普文章
}

enum PostStatus {
  DRAFT
  PUBLISHED
  HIDDEN      // 审核隐藏
  DELETED
}
```

### 3.2 User 模型扩展

在现有 User 模型上新增以下关系（无需修改字段）：

```
model User {
  // ... 现有字段保持不变
  posts       Post[]
  comments    Comment[]
  postLikes   PostLike[]
  postCollects PostCollect[]
  followers   UserFollow[] @relation("Followings")
  followings  UserFollow[] @relation("Followers")
  checkIns    CheckIn[]
}
```

---

## 四、API 设计

### 4.1 帖子模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/community/posts` | 帖子信息流（分页，支持话题筛选） | 登录 |
| GET | `/api/community/posts/:id` | 帖子详情 | 登录 |
| POST | `/api/community/posts` | 发布帖子 | 登录 |
| PUT | `/api/community/posts/:id` | 编辑帖子（仅作者） | 登录 |
| DELETE | `/api/community/posts/:id` | 删除帖子（作者或管理员） | 登录 |
| POST | `/api/community/posts/:id/like` | 点赞/取消点赞 | 登录 |
| POST | `/api/community/posts/:id/collect` | 收藏/取消收藏 | 登录 |
| GET | `/api/community/posts/my` | 我的帖子 | 登录 |
| GET | `/api/community/posts/collected` | 我的收藏 | 登录 |
| GET | `/api/community/posts/following` | 关注的人的帖子 | 登录 |

**发帖请求体：**
```json
{
  "contentType": "NORMAL | BLOOD_SUGAR_DIARY | DOCTOR_ARTICLE",
  "title": "（可选，文章类型必填）",
  "content": "帖子正文，限2000字",
  "images": ["image_url_1", "image_url_2"],
  "topicId": "（可选）话题ID",
  "bloodSugarData": {
    "date": "2026-03-13",
    "records": [
      { "time": "07:00", "value": 5.2, "measureTime": "FASTING" },
      { "time": "12:30", "value": 8.5, "measureTime": "AFTER_LUNCH" }
    ],
    "average": 6.5,
    "inRangeRate": 80
  }
}
```

**帖子列表响应：**
```json
{
  "list": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "nickname": "糖友小明",
        "avatarUrl": null,
        "role": "PATIENT",
        "diabetesType": "TYPE_1",
        "isFollowed": false,
        "isDoctor": false
      },
      "contentType": "NORMAL",
      "title": null,
      "content": "今天空腹血糖终于降到了5.8...",
      "images": [],
      "topic": { "id": "uuid", "name": "控糖经验" },
      "bloodSugarData": null,
      "likeCount": 12,
      "commentCount": 3,
      "collectCount": 2,
      "isLiked": false,
      "isCollected": false,
      "createdAt": "2026-03-13T08:00:00Z"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

### 4.2 评论模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/community/posts/:postId/comments` | 评论列表（分页，含子评论） |
| POST | `/api/community/posts/:postId/comments` | 发表评论 |
| DELETE | `/api/community/comments/:id` | 删除评论（作者或管理员） |
| POST | `/api/community/comments/:id/like` | 评论点赞/取消 |

**评论请求体：**
```json
{
  "content": "评论内容，限500字",
  "parentId": "（可选）父评论ID，回复时使用",
  "replyToUserId": "（可选）被回复的用户ID"
}
```

### 4.3 话题模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/community/topics` | 话题列表（热门 + 全部） |
| GET | `/api/community/topics/:id` | 话题详情 + 帖子列表 |

**预设话题（种子数据）：**

| 话题名称 | 图标 | 说明 |
|---------|------|------|
| 控糖经验 | 📊 | 分享血糖管理心得和技巧 |
| 饮食交流 | 🍱 | 交流低碳水食谱和饮食搭配 |
| 运动打卡 | 🏃 | 分享运动记录和运动对血糖的影响 |
| 新人求助 | 🆕 | 新确诊患者提问交流 |
| 胰岛素泵 | 💉 | 泵友交流使用经验 |
| 心情树洞 | 🌳 | 匿名倾诉、情感互助 |
| 医生科普 | 👨‍⚕️ | 认证医生发布的科普文章 |
| 好物分享 | 🎁 | 分享实用的控糖好物 |

### 4.4 用户社交模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/community/users/:id/follow` | 关注/取消关注用户 |
| GET | `/api/community/users/:id/followers` | 用户的粉丝列表 |
| GET | `/api/community/users/:id/followings` | 用户关注列表 |
| GET | `/api/community/users/:id/posts` | 用户的帖子列表 |
| GET | `/api/community/users/:id/profile` | 用户社区主页信息 |

### 4.5 打卡模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/community/check-in` | 今日打卡 |
| GET | `/api/community/check-in/status` | 打卡状态（今日是否已打卡 + 连续天数） |
| GET | `/api/community/check-in/history` | 打卡日历（近30/90天） |

**打卡逻辑：**
- 每日首次调用即打卡成功，重复调用返回已打卡
- 自动关联当日血糖记录，判断是否达标（`bsInRange`）
- 连续天数计算：从今日往前连续有打卡记录的天数

**打卡状态响应：**
```json
{
  "checkedInToday": true,
  "consecutiveDays": 7,
  "totalDays": 45,
  "todayBsInRange": true,
  "todayBsCount": 3
}
```

---

## 五、页面详细设计

### 5.1 社区首页

**布局结构：**
```
┌─────────────────────────────┐
│  🔍 搜索帖子、话题、用户...    │  ← 搜索栏
├─────────────────────────────┤
│ 🔥热门话题  控糖经验 饮食交流  │  ← 话题横向滚动
│            运动打卡 新人求助 > │
├─────────────────────────────┤
│ ┌─打卡卡片──────────────────┐│
│ │ 🏆 已连续打卡 7 天         ││
│ │ 今日血糖达标 ✓  [打卡]    ││  ← 打卡入口（未打卡显示按钮）
│ └───────────────────────────┘│
├──────┬──────┬───────────────┤
│ 推荐 │ 关注 │ 医生专栏       │  ← 信息流 Tab 切换
├──────┴──────┴───────────────┤
│ ┌─帖子卡片──────────────────┐│
│ │ [头像] 糖友小明 · 1型 · 3h││
│ │ 今天空腹血糖终于降到了      ││
│ │ 5.8！分享一下我最近的...    ││
│ │ [图片] [图片]              ││
│ │ #控糖经验                  ││
│ │ ♡ 12  💬 3  ⭐ 2          ││  ← 点赞/评论/收藏
│ └───────────────────────────┘│
│ ┌─血糖日记卡片────────────── ┐│
│ │ [头像] 甜蜜战士 · 2型 · 5h││
│ │ 📊 今日血糖日记             ││
│ │ ┌──────────────────────┐  ││
│ │ │ 均值 6.2  达标率 80%  │  ││  ← 血糖数据卡片
│ │ │ ● 5.2 ● 6.8 ● 8.5   │  ││
│ │ └──────────────────────┘  ││
│ │ 今天整体控制还不错...       ││
│ │ ♡ 8  💬 5  ⭐ 1           ││
│ └───────────────────────────┘│
│ ┌─医生文章卡片──────────────┐│
│ │ [头像] 李医生 ✓已认证 · 1d ││
│ │ 📝 空腹血糖高？这5个原因... ││
│ │ 很多糖友反映早起空腹血糖    ││
│ │ 偏高，这种现象叫做...       ││
│ │ ♡ 56  💬 12  ⭐ 28        ││
│ └───────────────────────────┘│
│         ...更多帖子...        │
├─────────────────────────────┤
│  🏠  📋  🌐  💬  👤         │  ← 底部 Tab（社区为第3项）
└─────────────────────────────┘
        ＋  ← 右下角 FAB 发帖按钮
```

**交互说明：**
- 搜索栏点击后进入搜索页面，支持搜索帖子内容、话题、用户昵称
- 话题行横向滚动，点击话题进入话题详情页
- 打卡卡片：今日未打卡显示"立即打卡"按钮；已打卡显示连续天数和今日血糖达标状态
- 信息流三个 Tab：
  - **推荐**：按时间倒序显示所有帖子（后续可接入推荐算法）
  - **关注**：仅显示已关注用户的帖子
  - **医生专栏**：仅显示 `DOCTOR_ARTICLE` 类型的帖子
- 下拉刷新 + 上拉加载更多
- 右下角 FAB 按钮展开为发帖选项（普通帖子 / 血糖日记）

### 5.2 帖子详情

**布局结构：**
```
┌─────────────────────────────┐
│  ← 帖子详情                  │
├─────────────────────────────┤
│ [头像] 糖友小明               │
│ 1型 · 胰岛素泵 · 3小时前      │
│                   [+ 关注]   │
├─────────────────────────────┤
│ 今天空腹血糖终于降到了5.8！   │
│ 分享一下我最近的控糖方法：     │
│                              │
│ 1. 晚餐减少了碳水摄入        │
│ 2. 睡前加了一次基础率        │
│ 3. 每天坚持饭后散步30分钟    │
│                              │
│ [图片1]  [图片2]             │
│                              │
│ #控糖经验                    │
├─────────────────────────────┤
│ ♡ 12 点赞  💬 3 评论  ⭐ 2   │
├─────────────────────────────┤
│ 评论 (3)                     │
├─────────────────────────────┤
│ [头像] 甜蜜战士 · 2小时前     │
│ 学到了！我也试试减少晚餐碳水  │
│ ♡ 2                 [回复]   │
│                              │
│ [头像] 糖妈妈 · 1小时前       │
│ 请问基础率怎么调的？          │
│ ♡ 0                 [回复]   │
│   └ [头像] 糖友小明 回复 糖妈妈│
│     我是调高了0.05U/h...      │
│     ♡ 1              [回复]  │
├─────────────────────────────┤
│ [输入框: 写评论...]    [发送] │
└─────────────────────────────┘
```

**交互说明：**
- 点击作者头像/昵称进入用户主页
- 点击"关注"按钮切换关注状态
- 图片支持点击预览大图（左右滑动）
- 点赞/收藏为 toggle 操作，有动画反馈
- 评论支持两级回复（评论 → 回复评论）
- 底部评论输入框常驻，点击后弹起键盘

### 5.3 发布帖子

**布局结构：**
```
┌─────────────────────────────┐
│  × 发布帖子           [发布] │
├─────────────────────────────┤
│ ┌ 普通帖子 ┐ ┌ 血糖日记 ┐    │  ← 帖子类型切换
│ └──────────┘ └──────────┘    │
├─────────────────────────────┤
│                              │
│ 分享你的控糖故事...           │  ← 多行文本输入框
│                              │
│                              │
│                         0/2000│
├─────────────────────────────┤
│ [📷+] [📷+] [📷+]           │  ← 图片上传（最多9张）
├─────────────────────────────┤
│ 📌 选择话题        控糖经验 > │  ← 话题选择
├─────────────────────────────┤
│ 🔒 匿名发布            [○]  │  ← 匿名开关
└─────────────────────────────┘
```

**血糖日记模式：**
```
┌─────────────────────────────┐
│  × 发布帖子            [发布]│
├─────────────────────────────┤
│ ┌ 普通帖子 ┐ ┌ 血糖日记 ┐    │
│ └──────────┘ └──────────┘    │
├─────────────────────────────┤
│ 📊 今日血糖数据               │
│ ┌────────────────────────── ┐│
│ │ 2026-03-13                ││
│ │ 均值 6.2  记录 5次         ││
│ │ 达标率 80%                 ││
│ │ ● 5.2(空腹) ● 6.8(早餐后) ││
│ │ ● 5.8(午餐前) ● 8.5(午餐后)││
│ │ ● 6.2(晚餐前)             ││
│ └───────────────────────────┘│
│                              │
│ 说说今天的控糖心得...         │  ← 文本输入
│                         0/2000│
├─────────────────────────────┤
│ 📌 选择话题        控糖经验 > │
└─────────────────────────────┘
```

**交互说明：**
- 切换"血糖日记"自动拉取当日血糖数据，生成数据卡片
- 如果当日无血糖记录，提示"今日暂无血糖记录，请先记录血糖"
- 图片上传最多 9 张，每张最大 10MB
- 话题非必选，但推荐选择（提升帖子曝光）
- 匿名发布：发帖后其他用户看到"匿名糖友"而非真实昵称
- 发布后跳转到帖子详情页

### 5.4 话题广场

**布局结构：**
```
┌─────────────────────────────┐
│  ← 话题广场                  │
├─────────────────────────────┤
│ 🔥 热门话题                  │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ 📊   │ │ 🍱   │ │ 🏃   │ │
│ │控糖经验│ │饮食交流│ │运动打卡│ │
│ │128帖子│ │95帖子 │ │76帖子 │ │
│ └──────┘ └──────┘ └──────┘ │
├─────────────────────────────┤
│ 全部话题                     │
├─────────────────────────────┤
│ 📊 控糖经验    128篇帖子    >│
│ 🍱 饮食交流     95篇帖子    >│
│ 🏃 运动打卡     76篇帖子    >│
│ 🆕 新人求助     64篇帖子    >│
│ 💉 胰岛素泵     42篇帖子    >│
│ 🌳 心情树洞     38篇帖子    >│
│ 👨‍⚕️ 医生科普     89篇帖子    >│
│ 🎁 好物分享     31篇帖子    >│
└─────────────────────────────┘
```

### 5.5 用户主页

**布局结构：**
```
┌─────────────────────────────┐
│  ←                          │
├─────────────────────────────┤
│         [头像]               │
│       糖友小明               │
│   1型 · 胰岛素泵 · 已管理328天│
│                              │
│  12 帖子  |  56 粉丝  |  23 关注│
│                              │
│         [+ 关注]             │
├──────┬──────────────────────┤
│ 帖子 │ 血糖日记              │  ← Tab 切换
├──────┴──────────────────────┤
│   ... 帖子列表 ...           │
└─────────────────────────────┘
```

### 5.6 血糖打卡

**打卡弹窗：**
```
┌─────────────────────────────┐
│                    ×         │
│         🏆                   │
│    已连续打卡 7 天！          │
│                              │
│  今日血糖：3 次记录            │
│  均值 6.2 mmol/L  ✓ 达标      │
│                              │
│  ┌─日历──────────────────── ┐│
│  │ 一 二 三 四 五 六 日       ││
│  │  3  4  5  6  7  8  9     ││
│  │  ✓  ✓  ✓  ✓  ✓  ✓  ●    ││
│  │ 10 11 12 13              ││
│  │  ✓  ✓  ✓  ★              ││  ← ★ 今日打卡
│  └──────────────────────────┘│
│                              │
│     [分享到社区]              │  ← 打卡后可选分享
└─────────────────────────────┘
```

---

## 六、业务规则

### 6.1 内容发布规则

| 规则 | 说明 |
|------|------|
| 帖子字数 | 正文 1-2000 字 |
| 帖子图片 | 最多 9 张，每张 ≤ 10MB |
| 评论字数 | 1-500 字 |
| 医生文章 | 仅认证通过的医生可发布 `DOCTOR_ARTICLE` 类型 |
| 发帖频率 | 每用户每天最多 20 帖（防刷） |
| 匿名发布 | 仅患者可匿名，医生不可匿名 |

### 6.2 内容审核规则（基础版）

| 规则 | 说明 |
|------|------|
| 敏感词过滤 | 发帖/评论时自动检测，命中则拒绝发布并提示 |
| 举报机制 | 帖子详情页长按可举报，管理员后台审核 |
| 内容下架 | 管理员可将帖子状态设为 HIDDEN |
| 用户禁言 | 管理员可将用户状态设为 BANNED，禁止发帖/评论 |

### 6.3 打卡规则

| 规则 | 说明 |
|------|------|
| 打卡时间 | 每日 00:00 - 23:59 可打卡一次 |
| 血糖达标 | 当日有 ≥1 条血糖记录且所有记录在正常范围内 |
| 连续天数 | 从今日起往前连续打卡的天数，断一天重新计算 |
| 补签 | P1 不支持，后续迭代考虑 |

### 6.4 关注规则

| 规则 | 说明 |
|------|------|
| 关注上限 | 每用户最多关注 500 人 |
| 互关 | 双方互相关注后标记为"互相关注" |
| 取消关注 | 立即生效，不通知对方 |

---

## 七、设计规范（延续现有规范）

### 7.1 社区专属色彩

| 用途 | 色值 | 说明 |
|------|------|------|
| 点赞激活 | #FF4D4F | 红心 |
| 收藏激活 | #FFB020 | 黄星 |
| 话题标签背景 | #E8F8F0 | 主色浅色 |
| 话题标签文字 | #1AAD6E | 主色 |
| 打卡成功 | #1AAD6E | 主色 |
| 打卡日历-已打卡 | #1AAD6E | 绿色圆点 |
| 打卡日历-未打卡 | #EBEDF0 | 灰色 |
| 医生认证标识 | #3B82F6 | 蓝色对勾 |
| 匿名用户背景 | #F5F5F5 | 浅灰 |

### 7.2 帖子卡片规范

- 卡片圆角 12px，卡片间距 12px
- 作者行：头像 36px + 昵称 15px bold + 标签 11px + 时间 12px gray
- 正文：14px，最多显示 3 行，超出显示"展开全文"
- 图片区域：1 张满宽，2 张各 50%，3+ 张九宫格（每张 1:1）
- 操作栏：点赞/评论/收藏 等间距排列，14px，未激活 #969799，激活使用对应色

---

## 八、冷启动策略

### 8.1 种子内容

| 类型 | 数量 | 来源 |
|------|------|------|
| 医生科普文章 | 20 篇 | 平台邀请医生撰写/授权转载 |
| 控糖经验帖 | 30 篇 | 团队模拟真实用户创建 |
| 饮食分享帖 | 20 篇 | 低碳水食谱整理 |
| 话题讨论帖 | 10 篇 | 每个话题下 1-2 篇引导帖 |

### 8.2 运营活动

| 活动 | 说明 |
|------|------|
| 连续打卡 7 天挑战 | 完成后弹窗庆祝，鼓励分享到社区 |
| 每周精选 | 管理员置顶 3-5 篇优质帖子 |
| 新人欢迎 | 新用户首次进入社区，弹窗引导完成首帖 |
| 医生入驻 | 邀请绑定的医生发布科普文章，标记认证 |

---

## 九、数据埋点

### 9.1 关键指标

| 指标 | 计算方式 | 目标 |
|------|---------|------|
| 社区 DAU | 每日访问社区首页的独立用户数 | ≥ 全站 DAU 的 40% |
| 发帖率 | 每日发帖用户数 / 社区 DAU | ≥ 5% |
| 互动率 | (点赞+评论+收藏) / 帖子浏览 | ≥ 10% |
| 打卡率 | 每日打卡用户数 / 全站 DAU | ≥ 30% |
| 次日留存 | 今日访问社区且明日再次访问的比例 | ≥ 40% |

### 9.2 事件埋点清单

| 事件 | 参数 |
|------|------|
| `community_view` | tab(推荐/关注/医生专栏) |
| `post_view` | postId, contentType, source(feed/topic/search) |
| `post_create` | contentType, hasImages, hasTopic, isAnonymous |
| `post_like` | postId, action(like/unlike) |
| `post_collect` | postId, action(collect/uncollect) |
| `comment_create` | postId, isReply |
| `check_in` | consecutiveDays, bsInRange, bsCount |
| `user_follow` | targetUserId, action(follow/unfollow) |
| `topic_view` | topicId |
| `community_search` | keyword, resultCount |

---

## 十、开发排期建议

| 阶段 | 任务 | 预估工时 |
|------|------|---------|
| 第 1 周 | 数据库模型设计 + Prisma 迁移 + 后端 CRUD API（帖子/评论/话题） | 5 天 |
| 第 2 周 | 后端社交 API（点赞/收藏/关注/打卡）+ 患者端社区首页 + 信息流 | 5 天 |
| 第 3 周 | 患者端发帖页 + 帖子详情 + 评论功能 + 话题广场 | 5 天 |
| 第 4 周 | 血糖日记 + 打卡功能 + 用户主页 + 搜索 | 5 天 |
| 第 5 周 | 医生端社区（浏览+发文章）+ TabBar 调整 + 基础内容审核 | 4 天 |
| 第 6 周 | 联调测试 + 种子数据 + 体验打磨 + 上线 | 4 天 |

**总计：约 4-6 周**
