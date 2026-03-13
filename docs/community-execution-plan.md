# 糖友社区 — 分阶段执行计划

> 总工期：6 个阶段，预计 28 个工作日（约 6 周）
> 每个阶段结束时必须可独立构建、独立验证

---

## 阶段总览

```
阶段 1 ──→ 阶段 2 ──→ 阶段 3 ──→ 阶段 4 ──→ 阶段 5 ──→ 阶段 6
地基层      内容消费    内容生产    社交互动    打卡+医生   收尾上线
(4天)      (5天)      (5天)      (5天)      (5天)      (4天)
```

| 阶段 | 名称 | 核心交付 | 工作日 |
|------|------|---------|--------|
| 1 | 地基层 | Prisma Schema + 后端 Module 骨架 + 种子话题 + TabBar 改造 | 4 天 |
| 2 | 内容消费 | 社区首页信息流 + 帖子详情 + 话题广场/详情 | 5 天 |
| 3 | 内容生产 | 发帖（普通+血糖日记）+ 帖子管理（编辑/删除） | 5 天 |
| 4 | 社交互动 | 点赞/收藏/评论/关注 + 用户主页 + 我的社区 | 5 天 |
| 5 | 打卡 + 医生端 | 血糖打卡 + 医生发文章 + 医生端社区 Tab | 5 天 |
| 6 | 收尾上线 | 内容审核 + 搜索 + 种子数据 + 全链路测试 | 4 天 |

---

## 阶段 1：地基层（第 1-4 天）

**目标：** 所有后续阶段依赖的数据库模型、后端模块骨架和前端路由框架就位。

### 1.1 后端：Prisma Schema 扩展

**新增模型清单：**

| 模型 | 表名 | 核心字段 | 依赖 |
|------|------|---------|------|
| `Post` | `posts` | id, authorId, contentType, title, content, images[], topicId, bloodSugarData, likeCount, commentCount, collectCount, status, isTop, isAnonymous | User, Topic |
| `Comment` | `comments` | id, postId, authorId, content, parentId, replyToUserId, likeCount | Post, User |
| `Topic` | `topics` | id, name, description, icon, postCount, isHot, sortOrder | — |
| `PostLike` | `post_likes` | id, postId, userId | Post, User |
| `PostCollect` | `post_collects` | id, postId, userId | Post, User |
| `CommentLike` | `comment_likes` | id, commentId, userId | Comment, User |
| `UserFollow` | `user_follows` | id, followerId, followingId | User |
| `CheckIn` | `check_ins` | id, userId, date, bsInRange | User |

**新增枚举：**

| 枚举 | 值 |
|------|-----|
| `PostType` | NORMAL, BLOOD_SUGAR_DIARY, DOCTOR_ARTICLE |
| `PostStatus` | DRAFT, PUBLISHED, HIDDEN, DELETED |

**User 模型扩展关系：**
```
posts, comments, postLikes, postCollects, commentLikes,
followers(UserFollow), followings(UserFollow), checkIns
```

**执行步骤：**

```
步骤 1.1.1  修改 apps/server/prisma/schema.prisma
            - 新增上述 8 个 model + 2 个 enum
            - User 模型添加新关系字段
步骤 1.1.2  npx prisma migrate dev --name add_community_models
步骤 1.1.3  npx prisma generate
```

### 1.2 后端：Community Module 骨架

**新增文件结构：**
```
apps/server/src/modules/community/
├── community.module.ts         # 模块定义
├── community.controller.ts     # 所有社区 API 路由
├── community.service.ts        # 业务逻辑
├── dto/
│   ├── create-post.dto.ts      # 发帖 DTO
│   ├── create-comment.dto.ts   # 评论 DTO
│   └── query-post.dto.ts       # 帖子查询 DTO
└── community.seed.ts           # 种子话题数据
```

**本阶段只实现骨架**（空方法 + 正确注入），不实现具体逻辑：
- Controller 注册所有路由但返回 `{ message: 'TODO' }`
- Service 方法签名全部定义好
- Module 正确导入 PrismaService 和 JwtAuthGuard
- 在 `app.module.ts` 中导入 CommunityModule

**种子话题数据**（migrate 后自动插入）：

| name | icon | description |
|------|------|-------------|
| 控糖经验 | 📊 | 分享血糖管理心得和技巧 |
| 饮食交流 | 🍱 | 交流低碳水食谱和饮食搭配 |
| 运动打卡 | 🏃 | 分享运动记录和运动对血糖的影响 |
| 新人求助 | 🆕 | 新确诊患者提问交流 |
| 胰岛素泵 | 💉 | 泵友交流使用经验 |
| 心情树洞 | 🌳 | 匿名倾诉、情感互助 |
| 医生科普 | 👨‍⚕️ | 认证医生发布的科普文章 |
| 好物分享 | 🎁 | 分享实用的控糖好物 |

### 1.3 前端：路由和 TabBar 改造

**患者端：**

```
步骤 1.3.1  修改 apps/patient-h5/src/components/TabLayout.vue
            - Tab 由 4 个改为 5 个：首页 | 记录 | 社区 | 消息 | 我的
            - 社区 Tab icon: "cluster-o" (Vant)，route name: "Community"

步骤 1.3.2  修改 apps/patient-h5/src/router/index.ts
            - TabLayout children 新增:
              { path: 'community', name: 'Community', component: () => import('@/views/community/CommunityPage.vue') }
            - 新增子页面路由:
              /community/post/:id     → PostDetailPage.vue
              /community/publish      → PublishPage.vue
              /community/topic/:id    → TopicDetailPage.vue
              /community/topics       → TopicSquarePage.vue
              /community/user/:id     → UserProfilePage.vue
              /community/checkin      → (弹窗，无需独立路由)
              /community/my           → MyCommunityPage.vue

步骤 1.3.3  创建占位页面文件（仅含 <template>占位文字</template>）:
            apps/patient-h5/src/views/community/
            ├── CommunityPage.vue       # "社区首页开发中"
            ├── PostDetailPage.vue      # "帖子详情开发中"
            ├── PublishPage.vue         # "发帖页开发中"
            ├── TopicSquarePage.vue     # "话题广场开发中"
            ├── TopicDetailPage.vue     # "话题详情开发中"
            ├── UserProfilePage.vue     # "用户主页开发中"
            └── MyCommunityPage.vue     # "我的社区开发中"
```

**患者端 API 文件：**
```
步骤 1.3.4  创建 apps/patient-h5/src/api/community.ts
            - 定义所有 API 函数签名（暂时调用空端点）
```

**医生端：**
```
步骤 1.3.5  修改 apps/doctor-h5/src/components/TabLayout.vue
            - Tab 由 3 个改为 4 个：患者 | 社区 | 消息 | 我的
步骤 1.3.6  修改 apps/doctor-h5/src/router/index.ts
            - 新增社区相关路由
步骤 1.3.7  创建占位页面文件
步骤 1.3.8  创建 apps/doctor-h5/src/api/community.ts
```

### 1.4 阶段 1 验收标准

- [ ] `npx prisma migrate dev` 成功，数据库新增 8 张表
- [ ] `pnpm --filter @leimengyun/server build` 通过
- [ ] `pnpm --filter @leimengyun/patient-h5 build` 通过
- [ ] `pnpm --filter @leimengyun/doctor-h5 build` 通过
- [ ] 患者端 TabBar 显示 5 个 Tab，点击"社区"显示占位页
- [ ] 医生端 TabBar 显示 4 个 Tab，点击"社区"显示占位页
- [ ] `GET /api/community/topics` 返回 8 个种子话题
- [ ] 提交 commit: `feat(community): phase 1 - database models, module skeleton, tab bar`

---

## 阶段 2：内容消费（第 5-9 天）

**目标：** 用户能浏览信息流、查看帖子详情、浏览话题。这是社区的"读"端。

### 2.1 后端实现

**帖子查询 API：**

| 端点 | 功能 | 关键逻辑 |
|------|------|---------|
| `GET /api/community/posts` | 信息流 | 分页 (page, pageSize)；筛选 (tab: recommend/following/doctor)；话题筛选 (topicId)；排除 HIDDEN/DELETED/DRAFT；返回作者信息+是否已点赞/收藏 |
| `GET /api/community/posts/:id` | 帖子详情 | 返回完整内容 + 作者信息 + 是否已点赞/收藏/关注 |
| `GET /api/community/topics` | 话题列表 | 全部话题，按 sortOrder 排序，标记 isHot |
| `GET /api/community/topics/:id` | 话题详情 | 话题信息 + 该话题下的帖子列表(分页) |

**查询要点：**
```typescript
// 信息流核心查询
const posts = await prisma.post.findMany({
  where: {
    status: 'PUBLISHED',
    ...(tab === 'doctor' ? { contentType: 'DOCTOR_ARTICLE' } : {}),
    ...(tab === 'following' ? { authorId: { in: followingIds } } : {}),
    ...(topicId ? { topicId } : {}),
  },
  include: {
    author: {
      select: { id, avatarUrl, role, patientProfile: { select: { nickname, diabetesType } }, doctorProfile: { select: { realName, department, verifyStatus } } }
    },
    topic: { select: { id, name } },
  },
  orderBy: [{ isTop: 'desc' }, { createdAt: 'desc' }],
  skip, take,
})

// 批量查询当前用户是否点赞/收藏
const likedPostIds = await prisma.postLike.findMany({ where: { userId, postId: { in: postIds } } })
const collectedPostIds = await prisma.postCollect.findMany({ where: { userId, postId: { in: postIds } } })
```

**实现文件：**
```
步骤 2.1.1  community.service.ts — 实现 getPosts(), getPostById(), getTopics(), getTopicById()
步骤 2.1.2  community.controller.ts — 连接路由
步骤 2.1.3  query-post.dto.ts — page, pageSize, tab, topicId 参数校验
```

### 2.2 患者端前端实现

**CommunityPage.vue（社区首页）：**
```
步骤 2.2.1  布局结构:
            - 搜索栏（静态，点击跳转搜索页，本阶段不实现搜索）
            - 话题横向滚动条（TopicChips 组件）
            - 打卡卡片（静态展示，本阶段不实现打卡逻辑）
            - Feed Tab（推荐 | 关注 | 医生专栏）
            - 帖子列表（PostCard 组件 × N）
            - FAB 发帖按钮（本阶段点击 Toast "开发中"）
            - van-list 无限滚动加载

步骤 2.2.2  提取 PostCard.vue 组件:
            apps/patient-h5/src/components/PostCard.vue
            - 作者行（头像+昵称+标签+时间+关注按钮）
            - 内容区（文字截断3行 + "展开全文"）
            - 图片区（1/2/3+张不同布局）
            - 血糖日记卡片（BsDiaryCard 子组件）
            - 医生文章标题
            - 话题标签
            - 操作栏（点赞/评论/收藏，本阶段点击 Toast）

步骤 2.2.3  提取 BsDiaryCard.vue 组件:
            apps/patient-h5/src/components/BsDiaryCard.vue
            - 日期 + 均值 + 记录次数 + 达标率
            - 血糖数据点列表（颜色编码）
```

**PostDetailPage.vue（帖子详情）：**
```
步骤 2.2.4  布局结构:
            - 作者信息 + 关注按钮
            - 完整正文（不截断）
            - 图片（支持点击预览大图）
            - 话题标签
            - 操作栏（点赞/评论/收藏）
            - 评论区（本阶段静态占位，不接 API）
            - 底部评论输入框（本阶段点击 Toast）
```

**TopicSquarePage.vue（话题广场）：**
```
步骤 2.2.5  布局结构:
            - 热门话题网格（3列）
            - 全部话题列表
            - 点击话题进入 TopicDetailPage
```

**TopicDetailPage.vue（话题详情）：**
```
步骤 2.2.6  布局结构:
            - 话题头部（名称+描述+帖子数）
            - 帖子列表（复用 PostCard）
            - van-list 无限滚动
```

### 2.3 API 文件实现

```
步骤 2.3.1  apps/patient-h5/src/api/community.ts 实现:
            - getPosts(params: { page, pageSize, tab, topicId })
            - getPostById(id)
            - getTopics()
            - getTopicDetail(id, params)
```

### 2.4 阶段 2 验收标准

- [ ] 社区首页显示信息流，支持"推荐/关注/医生专栏"切换
- [ ] 帖子卡片正确展示普通帖子、血糖日记、医生文章三种样式
- [ ] 点击帖子进入详情页，显示完整内容和图片
- [ ] 话题广场展示所有话题，点击话题显示该话题下的帖子
- [ ] 列表支持下拉刷新 + 上拉加载更多
- [ ] `pnpm build` 全部通过
- [ ] 提交 commit: `feat(community): phase 2 - feed, post detail, topics`

---

## 阶段 3：内容生产（第 10-14 天）

**目标：** 用户能发布帖子（普通帖子 + 血糖日记），并管理自己的帖子。

### 3.1 后端实现

| 端点 | 功能 | 关键逻辑 |
|------|------|---------|
| `POST /api/community/posts` | 发布帖子 | 校验 contentType；DOCTOR_ARTICLE 需验证医生角色且已认证；关联 topicId 时更新 topic.postCount；血糖日记自动拉取当日数据 |
| `PUT /api/community/posts/:id` | 编辑帖子 | 仅作者可编辑；不可修改 contentType |
| `DELETE /api/community/posts/:id` | 删除帖子 | 作者或管理员；软删除(status→DELETED)；减少 topic.postCount |
| `GET /api/community/posts/my` | 我的帖子 | 当前用户发布的帖子列表 |

**create-post.dto.ts：**
```typescript
export class CreatePostDto {
  @IsEnum(PostType) contentType: PostType
  @IsOptional() @IsString() @MaxLength(100) title?: string
  @IsString() @MinLength(1) @MaxLength(2000) content: string
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(9) images?: string[]
  @IsOptional() @IsUUID() topicId?: string
  @IsOptional() @IsObject() bloodSugarData?: any
  @IsOptional() @IsBoolean() isAnonymous?: boolean
}
```

**血糖日记自动数据拉取：**
```typescript
// 当 contentType === BLOOD_SUGAR_DIARY 且未传 bloodSugarData 时
// 自动查询当日血糖记录填充
async function autoFillBloodSugarData(userId: string) {
  const profile = await prisma.patientProfile.findUnique({ where: { userId } })
  if (!profile) return null
  const today = getLocalDayRange()
  const records = await prisma.bloodSugarRecord.findMany({
    where: { patientId: profile.id, recordedAt: { gte: today.start, lte: today.end } },
    orderBy: { recordedAt: 'asc' },
  })
  // 组装 { date, records, average, inRangeRate }
}
```

### 3.2 患者端前端实现

**PublishPage.vue（发帖页）：**
```
步骤 3.2.1  布局结构:
            - 顶部：× 关闭 | 发布帖子 | [发布] 按钮
            - 帖子类型切换（普通帖子 | 血糖日记）
            - 血糖日记模式：自动拉取当日数据展示 BsDiaryCard
            - 文本输入区（textarea, 2000字限制, show-word-limit）
            - 图片上传区（van-uploader, 最多9张, 10MB）
            - 话题选择（点击弹出话题列表 popup）
            - 匿名开关（仅患者可见）
            - 发布 loading + 成功跳转到帖子详情

步骤 3.2.2  话题选择 Popup 组件:
            apps/patient-h5/src/components/TopicPicker.vue
            - 话题列表，带搜索过滤
            - 点击选中，关闭 popup
```

**帖子管理（在 PostDetailPage 和 MyCommunityPage）：**
```
步骤 3.2.3  PostDetailPage.vue 头部右侧 "⋯" 按钮:
            - 自己的帖子：编辑 / 删除（van-action-sheet）
            - 他人帖子：举报（Toast "已收到举报"）

步骤 3.2.4  MyCommunityPage.vue（我的社区）:
            - Tab: 我的帖子 | 我的收藏 | 我的评论
            - 我的帖子列表（复用 PostCard），长按支持删除
```

### 3.3 API 文件补充

```
步骤 3.3.1  community.ts 新增:
            - createPost(data)
            - updatePost(id, data)
            - deletePost(id)
            - getMyPosts(params)
            - getCollectedPosts(params)  // 为阶段4准备
```

### 3.4 阶段 3 验收标准

- [ ] 点击 FAB 进入发帖页，选择"普通帖子"可发布图文帖子
- [ ] 选择"血糖日记"自动拉取当日血糖数据，显示数据卡片
- [ ] 发布成功后跳转到帖子详情页，信息流刷新可见新帖
- [ ] 话题选择弹窗正常工作
- [ ] 帖子详情页"⋯"菜单：自己的帖子可编辑/删除
- [ ] "我的社区"页显示"我的帖子"列表
- [ ] 匿名发布后显示"匿名糖友"
- [ ] 提交 commit: `feat(community): phase 3 - publish post, blood sugar diary, post management`

---

## 阶段 4：社交互动（第 15-19 天）

**目标：** 完成点赞、收藏、评论、关注的完整闭环，以及用户主页。

### 4.1 后端实现

**点赞/收藏 API（toggle 模式）：**

| 端点 | 逻辑 |
|------|------|
| `POST /api/community/posts/:id/like` | 已点赞→取消(delete+decrement)，未点赞→点赞(create+increment)，返回 `{ liked: boolean, likeCount }` |
| `POST /api/community/posts/:id/collect` | 同上，操作 PostCollect + collectCount |
| `POST /api/community/comments/:id/like` | 同上，操作 CommentLike + comment.likeCount |

**评论 API：**

| 端点 | 逻辑 |
|------|------|
| `GET /api/community/posts/:postId/comments` | 分页；只取顶级评论(parentId IS NULL)；每条顶级评论附带最多 3 条子评论；返回作者信息 |
| `POST /api/community/posts/:postId/comments` | 创建评论；post.commentCount++；如果是回复则设置 parentId 和 replyToUserId |
| `DELETE /api/community/comments/:id` | 作者或管理员；如果是顶级评论则级联删除子评论；post.commentCount-- |

**关注 API：**

| 端点 | 逻辑 |
|------|------|
| `POST /api/community/users/:id/follow` | toggle 关注/取消 |
| `GET /api/community/users/:id/followers` | 粉丝列表(分页) |
| `GET /api/community/users/:id/followings` | 关注列表(分页) |
| `GET /api/community/users/:id/profile` | 社区主页信息(帖子数/粉丝数/关注数/是否已关注) |
| `GET /api/community/users/:id/posts` | 该用户的帖子列表(分页) |

**我的收藏/评论 API：**

| 端点 | 逻辑 |
|------|------|
| `GET /api/community/posts/collected` | 当前用户收藏的帖子 |
| `GET /api/community/posts/following` | 关注的人的帖子（信息流"关注"Tab） |

### 4.2 患者端前端实现

**PostCard.vue 交互激活：**
```
步骤 4.2.1  点赞按钮:
            - 点击调用 toggleLike API
            - 乐观更新：立即切换图标和计数
            - 失败时回滚
            - 动画: scale(1.2) → scale(1) 弹跳效果

步骤 4.2.2  收藏按钮: 同上

步骤 4.2.3  评论按钮: 点击跳转到帖子详情页评论区
```

**PostDetailPage.vue 评论区接入：**
```
步骤 4.2.4  评论列表:
            - 调用 getComments API
            - 顶级评论 + 展开子评论（最多显示3条，超过显示"查看更多回复"）
            - 每条评论显示：头像+昵称+标签+时间+点赞+回复按钮
            - 医生评论显示认证标识

步骤 4.2.5  评论输入:
            - 底部输入框，点击"发送"调用 createComment
            - 回复某人时输入框 placeholder 变为"回复 @xxx"
            - 发送成功后刷新评论列表
            - 乐观更新评论计数

步骤 4.2.6  关注按钮:
            - PostCard 和 PostDetail 中的关注按钮接入 toggleFollow API
            - 已关注→"已关注"(灰色)，未关注→"+ 关注"(主色)
```

**UserProfilePage.vue（用户主页）：**
```
步骤 4.2.7  布局实现:
            - 头像 + 昵称 + 糖尿病类型+治疗方案 + 管理天数
            - 帖子数 | 粉丝数 | 关注数
            - 关注/取消关注按钮
            - Tab: 帖子 | 血糖日记
            - 帖子列表（复用 PostCard，无作者行）
```

**MyCommunityPage.vue 完善：**
```
步骤 4.2.8  补充"我的收藏"和"我的评论" Tab
            - 我的收藏：调用 getCollectedPosts
            - 我的评论：显示我评论过的帖子列表
```

**患者端 ProfilePage.vue 入口：**
```
步骤 4.2.9  在"我的"Tab 新增入口:
            <van-cell title="我的社区" icon="cluster-o" is-link to="/community/my" />
```

### 4.3 阶段 4 验收标准

- [ ] 点赞/取消点赞有动画反馈，计数实时更新
- [ ] 收藏/取消收藏正常工作
- [ ] 评论可发表，支持回复他人评论（两级）
- [ ] 评论区医生显示认证标识
- [ ] 关注/取消关注用户，信息流"关注"Tab 筛选正确
- [ ] 用户主页显示帖子数/粉丝/关注和帖子列表
- [ ] "我的社区"显示我的帖子/收藏/评论
- [ ] 提交 commit: `feat(community): phase 4 - like, collect, comment, follow, user profile`

---

## 阶段 5：打卡 + 医生端（第 20-24 天）

**目标：** 实现每日血糖打卡系统，以及医生端社区功能。

### 5.1 后端：打卡 API

| 端点 | 逻辑 |
|------|------|
| `POST /api/community/check-in` | 计算当日本地日期；判断是否已打卡(@@unique userId+date)；查询当日血糖记录判断达标；创建 CheckIn 记录 |
| `GET /api/community/check-in/status` | 返回 { checkedInToday, consecutiveDays, totalDays, todayBsInRange, todayBsCount } |
| `GET /api/community/check-in/history` | 返回近 N 天的打卡日历数据 [{date, checked, bsInRange}] |

**连续天数计算逻辑：**
```typescript
async function getConsecutiveDays(userId: string): Promise<number> {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 365,
  })
  let count = 0
  const today = getLocalDateString(new Date())
  let expected = today
  for (const ci of checkIns) {
    if (ci.date === expected) {
      count++
      // 计算前一天
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = formatDate(d)
    } else {
      break
    }
  }
  return count
}
```

### 5.2 患者端：打卡功能

**CommunityPage.vue 打卡卡片激活：**
```
步骤 5.2.1  页面加载时调用 getCheckInStatus
            - 未打卡: 显示"立即打卡"按钮 + 连续天数
            - 已打卡: 显示"✓ 已打卡" + 连续天数 + 今日达标状态

步骤 5.2.2  点击打卡触发 van-popup 弹窗:
            CheckInPopup.vue 组件:
            - 打卡成功动画（🏆 + 连续天数）
            - 今日血糖摘要（记录次数 + 达标状态）
            - 日历视图（近30天，绿色=已打卡，灰色=未打卡）
            - "分享到社区"按钮 → 自动创建一条血糖日记帖子

步骤 5.2.3  调用 getCheckInHistory 渲染日历
```

### 5.3 医生端：社区功能

**医生端社区首页（复用患者端设计）：**
```
步骤 5.3.1  apps/doctor-h5/src/views/community/CommunityPage.vue
            - 与患者端社区首页相似
            - Feed Tab: 全部 | 医生专栏
            - 无打卡卡片
            - FAB 按钮 → 发布文章（DOCTOR_ARTICLE 类型）

步骤 5.3.2  apps/doctor-h5/src/views/community/PublishArticlePage.vue
            - 标题输入（必填，100字）
            - 正文编辑（2000字）
            - 图片上传
            - 话题选择（默认"医生科普"）
            - 需验证 verifyStatus === APPROVED

步骤 5.3.3  帖子详情/评论功能
            - 复用患者端组件逻辑
            - 医生回复自动带认证标识
```

**医生端社区 API 和组件：**
```
步骤 5.3.4  apps/doctor-h5/src/api/community.ts
            - 复用与患者端相同的 API 端点
步骤 5.3.5  apps/doctor-h5/src/components/PostCard.vue
            - 复制患者端 PostCard，调整主题色
```

### 5.4 阶段 5 验收标准

- [ ] 患者每日可打卡一次，打卡成功弹窗显示连续天数和日历
- [ ] 打卡自动关联当日血糖记录，判断达标状态
- [ ] 打卡后可"分享到社区"生成血糖日记帖子
- [ ] 重复打卡提示"今日已打卡"
- [ ] 医生端社区可浏览信息流
- [ ] 认证医生可发布科普文章（DOCTOR_ARTICLE）
- [ ] 未认证医生发文章提示"请先通过资质认证"
- [ ] 提交 commit: `feat(community): phase 5 - daily check-in, doctor articles`

---

## 阶段 6：收尾上线（第 25-28 天）

**目标：** 内容安全、搜索、种子数据、全链路测试、体验打磨。

### 6.1 内容审核（基础版）

```
步骤 6.1.1  后端敏感词过滤:
            apps/server/src/modules/community/sensitive-words.ts
            - 维护敏感词列表（广告/色情/政治相关）
            - 发帖/评论时检查，命中则返回 400 "内容包含违规信息"

步骤 6.1.2  举报 API:
            POST /api/community/report
            - body: { targetType: 'POST'|'COMMENT', targetId, reason }
            - 存入 reports 表（简单实现）

步骤 6.1.3  管理员操作:
            - 复用现有 AdminGuard
            - PUT /api/community/posts/:id/hide → status = HIDDEN
            - 在管理员端（或现有 pending-doctors 页面旁）增加举报列表入口
```

### 6.2 搜索功能

```
步骤 6.2.1  后端搜索 API:
            GET /api/community/search?keyword=xxx&type=post|topic|user
            - 帖子: content ILIKE '%keyword%' OR title ILIKE '%keyword%'
            - 话题: name ILIKE '%keyword%'
            - 用户: nickname ILIKE '%keyword%' OR realName ILIKE '%keyword%'
            - 分页返回

步骤 6.2.2  患者端搜索页:
            apps/patient-h5/src/views/community/SearchPage.vue
            - 搜索框 + Tab(帖子/话题/用户)
            - 搜索结果列表
            - 搜索历史（localStorage）
```

### 6.3 种子数据填充

```
步骤 6.3.1  编写种子脚本: apps/server/prisma/seed-community.ts
            - 创建 3-5 个虚拟患者账号
            - 创建 1-2 个虚拟医生账号（已认证）
            - 每个话题下发布 3-5 条帖子（图文混合）
            - 部分帖子添加评论
            - 创建一些点赞/收藏数据

步骤 6.3.2  package.json 添加 seed 脚本:
            "db:seed-community": "ts-node prisma/seed-community.ts"
```

### 6.4 体验打磨

```
步骤 6.4.1  Loading 状态:
            - 所有列表页: van-loading + van-empty 空状态
            - 发帖/评论: 按钮 loading 防重复提交

步骤 6.4.2  错误处理:
            - API 失败统一 showFailToast
            - 网络异常重试引导

步骤 6.4.3  动画:
            - 点赞心跳动画 (CSS @keyframes)
            - 打卡成功弹窗进入动画
            - FAB 按钮按下缩放

步骤 6.4.4  性能:
            - PostCard 图片 loading="lazy"
            - 信息流使用 van-list 虚拟滚动
            - 帖子详情图片预加载
```

### 6.5 全链路测试

```
步骤 6.5.1  后端单元测试:
            apps/server/src/modules/community/__tests__/
            ├── community.service.spec.ts
            - 帖子 CRUD
            - 点赞 toggle 逻辑
            - 评论层级
            - 打卡连续天数计算
            - 权限校验（只有作者能删帖等）

步骤 6.5.2  端到端验证流程:
            1. 患者登录 → 进入社区 → 浏览信息流
            2. 发布普通帖子（含图片+话题）→ 信息流可见
            3. 发布血糖日记 → 数据卡片正确
            4. 点赞/收藏帖子 → 计数更新
            5. 发表评论 → 回复评论 → 评论区显示
            6. 关注用户 → "关注"Tab 显示其帖子
            7. 打卡 → 弹窗显示 → 连续天数正确
            8. 医生登录 → 浏览社区 → 发布科普文章
            9. 搜索帖子/话题/用户 → 结果正确
            10. 匿名发帖 → 显示"匿名糖友"
```

### 6.6 阶段 6 验收标准

- [ ] 发帖/评论含敏感词时拒绝发布并提示
- [ ] 搜索可搜到帖子、话题、用户
- [ ] 种子数据使社区看起来有内容（不是空荡荡）
- [ ] 所有列表正确处理空状态和加载状态
- [ ] 端到端 10 步流程全部通过
- [ ] `pnpm build` 全部通过，`pnpm lint` 无新增错误
- [ ] 提交 commit: `feat(community): phase 6 - search, content moderation, seed data, final polish`

---

## 依赖关系图

```
阶段 1 (地基)
  │
  ├──→ 阶段 2 (内容消费) ──→ 阶段 3 (内容生产)
  │                              │
  │                              ├──→ 阶段 4 (社交互动)
  │                              │        │
  │                              │        ├──→ 阶段 5 (打卡+医生)
  │                              │        │        │
  │                              │        │        └──→ 阶段 6 (收尾)
  │                              │        │
  │                              │        └──→ 阶段 6 (收尾)
  │                              │
  │                              └──→ 阶段 6 (收尾)
  │
  └──→ 阶段 5 (医生端骨架依赖阶段1的 TabBar)
```

**关键路径：** 1 → 2 → 3 → 4 → 5 → 6

阶段 5 的医生端 TabBar 改造依赖阶段 1，但医生端社区功能实现依赖阶段 2-4 的组件。

---

## 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 信息流查询性能（N+1问题） | 高 | 页面加载慢 | 使用 Prisma include 预加载 + 批量查询点赞/收藏状态 |
| 评论层级过深 | 中 | 复杂度高 | P1 限制两级（评论+回复），不支持无限嵌套 |
| 图片上传体验 | 中 | 发帖体验差 | 使用 van-uploader 预览 + 压缩；上传失败重试 |
| 医生端和患者端组件重复 | 高 | 维护成本 | 关键组件（PostCard、BsDiaryCard）提取到 packages/shared 或各端独立维护，样式通过 CSS 变量区分主题色 |
| 种子数据不够真实 | 中 | 社区看起来空 | 用真实的控糖经验文案，模拟真实用户行为模式 |
