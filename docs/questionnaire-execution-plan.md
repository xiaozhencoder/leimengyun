# 雷檬云 — 问卷管理功能 执行计划与实施方案

> 版本：v1.0 | 更新日期：2026-03-13

---

## 总览

### 开发阶段划分

| 阶段 | 名称 | 工时 | 核心产出 | 里程碑验收标准 |
|------|------|------|---------|--------------|
| Phase 1 | 数据基础层 | 3天 | DB模型 + 种子数据 + 共享类型 | Prisma migrate 通过，种子脚本可运行 |
| Phase 2 | 后端核心 API | 4天 | 模板/发送/提交/结果/统计 API | Swagger 所有接口可调通，评分逻辑正确 |
| Phase 3 | 医生端前端 | 5天 | 问卷中心 + 发送 + 结果 + 患者详情Tab | 医生可完成发送→查看结果完整流程 |
| Phase 4 | 患者端前端 | 4天 | 问卷列表 + 逐题填写 + 结果查看 | 患者可完成收到→填写→查看结果完整流程 |
| Phase 5 | 通知集成 + 联调 | 3天 | 消息通知 + 健康数据关联 + 全链路联调 | 医生发送→患者收到通知→填写→医生收到通知→批注→患者查看批注 |
| Phase 6 | 体验打磨 + 上线 | 2天 | 边界处理 + 性能优化 + 过期任务 | 全部 edge case 覆盖，上线就绪 |

**总计：约 21 个工作日（4-5周）**

---

## Phase 1：数据基础层（第1-3天）

### 优先级 P0 — 不依赖其他任务，是所有后续工作的前提

### 待办清单

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 1.1 | 新增 Prisma schema 模型和枚举 | P0 | 0.5天 | 无 |
| 1.2 | 创建并运行数据库迁移 | P0 | 0.5天 | 1.1 |
| 1.3 | 编写 8 套预置问卷模板种子数据 | P0 | 1天 | 1.2 |
| 1.4 | 新增 shared 包共享类型和常量 | P0 | 0.5天 | 无 |
| 1.5 | 创建后端 QuestionnaireModule 骨架 | P0 | 0.5天 | 1.2 |

### 1.1 新增 Prisma schema

**文件：** `apps/server/prisma/schema.prisma`

**新增内容：**

```prisma
// === 问卷枚举 ===
enum QuestionnaireCategory {
  BLOOD_SUGAR_MANAGEMENT
  DIET_MANAGEMENT
  EXERCISE_MANAGEMENT
  MEDICATION_ADHERENCE
  QUALITY_OF_LIFE
  HYPOGLYCEMIA_RISK
  FOOT_CARE
  MENTAL_HEALTH
  CUSTOM
}

enum TemplateStatus {
  ACTIVE
  ARCHIVED
}

enum AssignmentStatus {
  PENDING
  COMPLETED
  EXPIRED
  CANCELLED
}

// === 问卷模型 ===
model QuestionnaireTemplate { ... }  // 详见 PRD 第四章
model QuestionnaireAssignment { ... }
model QuestionnaireResponse { ... }
```

**User 模型扩展：** 添加三个关系字段

**注意事项：**
- 遵循现有 `@@map("snake_case_table")` 和 `@map("snake_case_column")` 命名约定
- JSON 字段 `questions`、`answers`、`dimensionScores` 使用 Prisma 的 `Json` 类型
- 外键引用 User 的 `id` 字段

### 1.2 数据库迁移

```bash
cd apps/server
npx prisma migrate dev --name add_questionnaire_models
npx prisma generate
```

迁移命名约定：`YYYYMMDDHHMMSS_add_questionnaire_models`

### 1.3 种子数据脚本

**新建文件：** `apps/server/prisma/seed-questionnaire.ts`

**参考现有模式：** `apps/server/prisma/seed-community.ts`

**结构：**
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templates = [
  {
    title: '血糖自我管理评估',
    description: '基于SDSCA量表，评估患者血糖监测与自我管理行为',
    category: 'BLOOD_SUGAR_MANAGEMENT',
    estimatedTime: 5,
    totalScore: 49,
    isSystem: true,
    questions: [ /* 10题 JSON，详见 PRD 3.3 模板一 */ ],
  },
  // ... 其余 7 套模板
]

async function main() {
  for (const tpl of templates) {
    await prisma.questionnaireTemplate.upsert({
      where: { /* 使用 title 作为唯一标识 */ },
      update: tpl,
      create: tpl,
    })
  }
  console.log(`✅ 已插入 ${templates.length} 套问卷模板`)
}

main().finally(() => prisma.$disconnect())
```

**package.json 新增脚本：**
```json
"seed:questionnaire": "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed-questionnaire.ts"
```

### 1.4 共享类型包

**修改文件：** `packages/shared/src/types/` 新增 `questionnaire.ts`

```typescript
export enum QuestionnaireCategory {
  BLOOD_SUGAR_MANAGEMENT = 'BLOOD_SUGAR_MANAGEMENT',
  DIET_MANAGEMENT = 'DIET_MANAGEMENT',
  // ...
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface QuestionOption {
  label: string
  value: string
  score?: number
}

export interface Question {
  id: string
  type: 'single_choice' | 'multiple_choice' | 'rating' | 'number' | 'text' | 'date'
  title: string
  required: boolean
  options?: QuestionOption[]
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  unit?: string
  maxLength?: number
  placeholder?: string
  dimension?: string
}

export interface Answer {
  questionId: string
  value: string | string[] | number
  score?: number
}
```

**修改文件：** `packages/shared/src/constants/index.ts` 新增常量

```typescript
export const QUESTIONNAIRE_CATEGORY_LABELS: Record<string, string> = {
  BLOOD_SUGAR_MANAGEMENT: '血糖管理',
  DIET_MANAGEMENT: '饮食管理',
  EXERCISE_MANAGEMENT: '运动管理',
  MEDICATION_ADHERENCE: '用药依从',
  QUALITY_OF_LIFE: '生活质量',
  HYPOGLYCEMIA_RISK: '低血糖风险',
  FOOT_CARE: '足部护理',
  MENTAL_HEALTH: '心理状态',
  CUSTOM: '自定义',
}

export const QUESTIONNAIRE_CATEGORY_ICONS: Record<string, string> = {
  BLOOD_SUGAR_MANAGEMENT: '📊',
  DIET_MANAGEMENT: '🍱',
  EXERCISE_MANAGEMENT: '🏃',
  MEDICATION_ADHERENCE: '💊',
  QUALITY_OF_LIFE: '❤️',
  HYPOGLYCEMIA_RISK: '⚠️',
  FOOT_CARE: '🦶',
  MENTAL_HEALTH: '🧠',
  CUSTOM: '📋',
}

export const SCORE_LEVELS = [
  { min: 80, label: '优秀', color: '#1AAD6E', desc: '管理非常好，继续保持' },
  { min: 60, label: '良好', color: '#3B82F6', desc: '总体不错，仍有提升空间' },
  { min: 40, label: '一般', color: '#FFB020', desc: '需要改善部分习惯' },
  { min: 0,  label: '较差', color: '#FF4D4F', desc: '建议加强管理，多与医生沟通' },
]
```

**修改文件：** `packages/shared/src/index.ts` 新增导出

### 1.5 后端 Module 骨架

**新建文件：**
```
apps/server/src/modules/questionnaire/
├── questionnaire.module.ts
├── questionnaire.controller.ts
├── questionnaire.service.ts
└── dto/
    └── index.ts
```

**注册模块：** `apps/server/src/app.module.ts` 的 imports 数组中加入 `QuestionnaireModule`

---

## Phase 2：后端核心 API（第4-7天）

### 优先级 P0 — 前端开发的前提

### 待办清单

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 2.1 | DTO 定义（全部请求/查询参数） | P0 | 0.5天 | Phase 1 |
| 2.2 | 模板查询 API（GET /templates, GET /templates/:id） | P0 | 0.5天 | 2.1 |
| 2.3 | 问卷发送 API（POST /assignments） | P0 | 0.5天 | 2.2 |
| 2.4 | 问卷提交 API（POST /assignments/:id/submit）+ 自动评分 | P0 | 1天 | 2.3 |
| 2.5 | 结果查询 API（GET /assignments/:id/result） | P0 | 0.5天 | 2.4 |
| 2.6 | 列表查询 API（sent/received/history） | P0 | 0.5天 | 2.3 |
| 2.7 | 医生批注 API（PUT /assignments/:id/note） | P1 | 0.25天 | 2.5 |
| 2.8 | 取消问卷 API（PUT /assignments/:id/cancel） | P1 | 0.25天 | 2.3 |
| 2.9 | 统计概览 API（GET /stats/overview） | P1 | 0.5天 | 2.6 |
| 2.10 | API 联调自测（Swagger / curl） | P0 | 0.5天 | 2.1-2.9 |

### 2.1 DTO 定义

**新建文件：** `apps/server/src/modules/questionnaire/dto/`

```
dto/
├── query-template.dto.ts      # 模板查询（category 筛选）
├── create-assignment.dto.ts   # 发送问卷（templateId, patientIds, deadline, message）
├── submit-response.dto.ts     # 提交答案（answers[], duration）
├── query-assignment.dto.ts    # 列表查询（status 筛选, 分页）
├── add-note.dto.ts            # 医生批注（doctorNote）
└── index.ts                   # 统一导出
```

**遵循现有约定：**
- 使用 `class-validator` 装饰器
- 使用 `@ApiProperty` / `@ApiPropertyOptional` 用于 Swagger
- 查询 DTO 中数值字段使用 `@Type(() => Number)` 做类型转换
- 分页字段：`page` 默认1，`pageSize` 默认20

**核心 DTO 示例：**

```typescript
// create-assignment.dto.ts
export class CreateAssignmentDto {
  @ApiProperty({ description: '问卷模板ID' })
  @IsUUID()
  templateId: string

  @ApiProperty({ description: '患者 userId 数组', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  patientIds: string[]

  @ApiProperty({ description: '截止时间' })
  @IsDateString()
  deadline: string

  @ApiPropertyOptional({ description: '医生附言', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string
}

// submit-response.dto.ts
export class SubmitResponseDto {
  @ApiProperty({ description: '答案数组' })
  @IsArray()
  answers: AnswerItemDto[]

  @ApiPropertyOptional({ description: '填写耗时(秒)' })
  @IsOptional()
  @IsNumber()
  duration?: number
}
```

### 2.2 模板查询 API

**Controller 方法：**

```typescript
@Get('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: '问卷模板列表' })
async getTemplates(@Query() query: QueryTemplateDto) { ... }

@Get('templates/:id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: '问卷模板详情（含完整题目）' })
async getTemplateById(@Param('id') id: string) { ... }
```

**Service 逻辑：**
- `getTemplates`: 查询 `QuestionnaireTemplate`，`status=ACTIVE`，支持 `category` 筛选
- 列表返回时 **不含** 完整 `questions`，仅返回 `questionCount`（JSON 数组长度计算）
- 详情返回时包含完整 `questions` JSON

### 2.3 问卷发送 API

**Controller 方法：**

```typescript
@Post('assignments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: '向患者发送问卷' })
async createAssignments(@Request() req, @Body() dto: CreateAssignmentDto) { ... }
```

**Service 业务逻辑：**

```
1. 校验当前用户角色 === DOCTOR
2. 校验模板存在且 status === ACTIVE
3. 遍历 patientIds:
   a. 校验医患绑定状态 === ACCEPTED
   b. 校验14天内无同模板重复发送（同 templateId + patientId + 非 CANCELLED）
   c. 创建 QuestionnaireAssignment 记录
4. 返回创建结果（successCount, failCount, assignments[]）
```

**关键校验：**
- 用 `prisma.doctorPatientBind.findFirst({ where: { doctorUserId, patientUserId, status: 'ACCEPTED' } })` 验证绑定
- 14天去重：`prisma.questionnaireAssignment.findFirst({ where: { templateId, patientId, createdAt: { gte: 14天前 }, status: { not: 'CANCELLED' } } })`

### 2.4 问卷提交 + 自动评分

**这是最复杂的 API，需要单独拆解。**

**Controller 方法：**

```typescript
@Post('assignments/:id/submit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: '患者提交问卷答案' })
async submitResponse(@Request() req, @Param('id') id: string, @Body() dto: SubmitResponseDto) { ... }
```

**Service 业务逻辑：**

```
1. 校验 assignment 存在
2. 校验当前用户 === assignment.patientId
3. 校验 assignment.status === PENDING（未过期、未完成、未取消）
4. 校验截止时间未到
5. 获取对应 template.questions
6. 校验必填题目已回答
7. 计算评分：
   a. 遍历 answers
   b. 对每个 answer，在 questions 中找到匹配的 question
   c. 根据 question.type 计算 score：
      - single_choice: 匹配 option.value → option.score
      - rating: value 即 score
      - number/text/date/multiple_choice: 通常无 score（跳过）
   d. 按 question.dimension 分组累加 → dimensionScores
   e. 所有 score 累加 → totalScore
8. 创建 QuestionnaireResponse（answers, totalScore, dimensionScores, duration）
9. 更新 assignment.status = COMPLETED
10. 返回评分结果（totalScore, dimensionScores, level, message）
```

**评分等级判定：**
```typescript
function getScoreLevel(totalScore: number, maxScore: number) {
  const percentage = (totalScore / maxScore) * 100
  if (percentage >= 80) return { level: '优秀', message: '管理非常好，继续保持！' }
  if (percentage >= 60) return { level: '良好', message: '总体不错，仍有提升空间。' }
  if (percentage >= 40) return { level: '一般', message: '需要改善部分习惯。' }
  return { level: '较差', message: '建议加强管理，多与医生沟通。' }
}
```

### 2.5 结果查询 API

**Service 逻辑：**
- 查询 `QuestionnaireAssignment` 关联 `template`, `response`, `patient.patientProfile`
- 权限：医生（发送者）或患者（填写者）
- 返回：模板信息 + 答案 + 评分 + 维度 + 医生批注

### 2.6 列表查询 API

```typescript
// 医生已发送列表
@Get('assignments/sent')

// 患者已收/已填列表
@Get('assignments/received')

// 患者问卷历史（含趋势）
@Get('patients/:patientId/history')
```

**共用分页逻辑（参考 community 模块）：** 返回 `{ list, total, hasMore }`

**历史趋势计算：**
```typescript
// 按 category 分组，取同类问卷的 (date, score, maxScore)
const trend = {}
for (const item of history) {
  const cat = item.template.category
  if (!trend[cat]) trend[cat] = []
  trend[cat].push({
    date: item.response.submittedAt,
    score: item.response.totalScore,
    maxScore: item.template.totalScore,
  })
}
```

### 2.7 - 2.9 辅助 API

- **批注 API**：简单 update，校验医生身份
- **取消 API**：校验 status === PENDING，更新为 CANCELLED
- **统计 API**：按当前医生 groupBy status 聚合

### 2.10 API 联调自测

**验证清单：**

```bash
# 1. 模板列表
curl http://localhost:3000/api/questionnaire/templates -H "Authorization: Bearer $TOKEN"

# 2. 模板详情
curl http://localhost:3000/api/questionnaire/templates/$TPL_ID -H "Authorization: Bearer $TOKEN"

# 3. 发送问卷
curl -X POST http://localhost:3000/api/questionnaire/assignments \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"...","patientIds":["..."],"deadline":"2026-03-20T23:59:59Z"}'

# 4. 患者查看待填列表
curl http://localhost:3000/api/questionnaire/assignments/received -H "Authorization: Bearer $PATIENT_TOKEN"

# 5. 患者提交答案
curl -X POST http://localhost:3000/api/questionnaire/assignments/$ASSIGN_ID/submit \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers":[...],"duration":180}'

# 6. 查看结果
curl http://localhost:3000/api/questionnaire/assignments/$ASSIGN_ID/result -H "Authorization: Bearer $TOKEN"

# 7. 医生批注
curl -X PUT http://localhost:3000/api/questionnaire/assignments/$ASSIGN_ID/note \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctorNote":"..."}'
```

---

## Phase 3：医生端前端（第8-12天）

### 优先级 P0 — 医生是问卷流程的发起方

### 待办清单

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 3.1 | 新建 API 封装层 `api/questionnaire.ts` | P0 | 0.25天 | Phase 2 |
| 3.2 | 问卷中心页 — 模板库 Tab | P0 | 1天 | 3.1 |
| 3.3 | 问卷中心页 — 已发送 Tab | P0 | 0.75天 | 3.1 |
| 3.4 | 发送问卷页 | P0 | 1天 | 3.2 |
| 3.5 | 问卷结果详情页 | P0 | 1天 | 3.3 |
| 3.6 | 患者详情页 — 新增问卷 Tab | P1 | 0.5天 | 3.5 |
| 3.7 | 我的页 — 问卷管理入口 | P0 | 0.25天 | 3.2 |
| 3.8 | 路由注册 + 页面联调 | P0 | 0.25天 | 3.2-3.7 |

### 3.1 API 封装层

**新建文件：** `apps/doctor-h5/src/api/questionnaire.ts`

```typescript
import client from './client'

// 模板
export function getTemplates(params?: { category?: string }) {
  return client.get('/questionnaire/templates', { params })
}

export function getTemplateById(id: string) {
  return client.get(`/questionnaire/templates/${id}`)
}

// 发送
export function createAssignments(data: {
  templateId: string
  patientIds: string[]
  deadline: string
  message?: string
}) {
  return client.post('/questionnaire/assignments', data)
}

// 列表
export function getSentAssignments(params?: { status?: string; page?: number; pageSize?: number }) {
  return client.get('/questionnaire/assignments/sent', { params })
}

// 结果
export function getAssignmentResult(id: string) {
  return client.get(`/questionnaire/assignments/${id}/result`)
}

// 批注
export function addDoctorNote(id: string, doctorNote: string) {
  return client.put(`/questionnaire/assignments/${id}/note`, { doctorNote })
}

// 取消
export function cancelAssignment(id: string) {
  return client.put(`/questionnaire/assignments/${id}/cancel`)
}

// 统计
export function getStatsOverview() {
  return client.get('/questionnaire/stats/overview')
}

// 患者问卷历史
export function getPatientHistory(patientId: string) {
  return client.get(`/questionnaire/patients/${patientId}/history`)
}
```

### 3.2 问卷中心页 — 模板库 Tab

**新建文件：** `apps/doctor-h5/src/views/questionnaire/QuestionnaireCenterPage.vue`

**组件结构：**
```
<template>
  <NavBar title="问卷管理" />
  <van-tabs v-model:active="activeTab">
    <van-tab title="模板库">
      <StatsRow />           <!-- 统计卡片：已发送/待填写/已完成/完成率 -->
      <CategoryFilter />     <!-- 分类筛选标签 -->
      <TemplateList />       <!-- 模板卡片列表 -->
    </van-tab>
    <van-tab title="已发送">
      <SentList />           <!-- 见 3.3 -->
    </van-tab>
  </van-tabs>
</template>
```

**提取组件：**
- `components/questionnaire/StatsRow.vue` — 4 个统计卡片
- `components/questionnaire/TemplateCard.vue` — 单个模板卡片（图标+标题+描述+标签+发送按钮）
- `components/questionnaire/CategoryFilter.vue` — 分类标签横向滚动

### 3.3 问卷中心页 — 已发送 Tab

**内嵌在 QuestionnaireCenterPage.vue 的第二个 Tab 内**

**组件：**
- `components/questionnaire/AssignmentCard.vue` — 发送记录卡片（标题+患者名+日期+状态+操作按钮）

**功能：**
- 状态筛选：全部/待填写/已完成/已过期/已取消
- van-list 无限加载
- 已完成 → 显示得分 + "查看结果"按钮
- 待填写 → 显示"提醒" + "取消"按钮
- 已过期 → 显示"重新发送"按钮

### 3.4 发送问卷页

**新建文件：** `apps/doctor-h5/src/views/questionnaire/SendQuestionnairePage.vue`

**路由参数：** `route.query.templateId`（从模板库跳转时传入）

**交互流程：**
```
1. 顶部显示已选模板信息（从 templateId 查询）
2. 患者选择列表：
   - 调用 GET /api/users/my-patients 获取已绑定患者
   - CheckboxGroup 多选
   - 搜索过滤（本地过滤）
3. 截止时间：van-datetime-picker
4. 附言：van-field textarea
5. 确认发送按钮 → 调用 createAssignments API
6. 成功后 showSuccessToast → 跳转已发送列表
```

### 3.5 问卷结果详情页

**新建文件：** `apps/doctor-h5/src/views/questionnaire/QuestionnaireResultPage.vue`

**路由参数：** `route.params.id`（assignmentId）

**页面结构：**
```
<template>
  <NavBar title="问卷结果" />
  <ScoreCircle />           <!-- 环形评分图 -->
  <ScoreLevel />            <!-- 评分等级文字 -->
  <DimensionBars />         <!-- 维度条形图 -->
  <TrendChart />            <!-- 评分趋势折线图 (ECharts) -->
  <AnswerList />            <!-- 详细答案列表 -->
  <HealthDataCard />        <!-- 关联健康数据 -->
  <DoctorNoteEditor />      <!-- 医生批注（可编辑） -->
</template>
```

**提取组件：**
- `components/questionnaire/ScoreCircle.vue` — 环形进度 + 分数
- `components/questionnaire/DimensionBars.vue` — 维度水平条形图
- `components/questionnaire/TrendChart.vue` — ECharts 折线图（复用 ECharts 依赖）
- `components/questionnaire/AnswerList.vue` — 问答详情列表
- `components/questionnaire/HealthDataCard.vue` — 近7天血糖概览

### 3.6 患者详情页 — 问卷 Tab

**修改文件：** `apps/doctor-h5/src/views/patient-detail/PatientDetailPage.vue`

**改动点：**
- Tab 列表新增"问卷"Tab
- 新增子组件 `PatientQuestionnaireTab.vue`
- 内容：评估概览卡片 + "发送新问卷"按钮 + 问卷记录列表

### 3.7 我的页 — 入口

**修改文件：** `apps/doctor-h5/src/views/profile/ProfilePage.vue`

**改动点：** 在功能列表中添加"问卷管理"入口项，带红点未读数标记

### 3.8 路由注册

**修改文件：** `apps/doctor-h5/src/router/index.ts`

**新增路由：**
```typescript
{ path: '/questionnaire', name: 'QuestionnaireCenter', component: () => import('@/views/questionnaire/QuestionnaireCenterPage.vue'), meta: { auth: true } },
{ path: '/questionnaire/send', name: 'SendQuestionnaire', component: () => import('@/views/questionnaire/SendQuestionnairePage.vue'), meta: { auth: true } },
{ path: '/questionnaire/result/:id', name: 'QuestionnaireResult', component: () => import('@/views/questionnaire/QuestionnaireResultPage.vue'), meta: { auth: true } },
```

---

## Phase 4：患者端前端（第13-16天）

### 优先级 P0 — 患者填写是闭环的关键

### 待办清单

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 4.1 | 新建 API 封装层 `api/questionnaire.ts` | P0 | 0.25天 | Phase 2 |
| 4.2 | 我的问卷页（待填写/已完成列表） | P0 | 0.75天 | 4.1 |
| 4.3 | 填写问卷页（逐题模式 — 核心） | P0 | 1.5天 | 4.1 |
| 4.4 | 提交确认页 | P0 | 0.5天 | 4.3 |
| 4.5 | 问卷结果页（患者视角） | P0 | 0.75天 | 4.2 |
| 4.6 | 路由注册 + 入口改造 | P0 | 0.25天 | 4.2-4.5 |

### 4.1 API 封装层

**新建文件：** `apps/patient-h5/src/api/questionnaire.ts`

```typescript
import client from './client'

export function getReceivedAssignments(params?: { status?: string; page?: number }) {
  return client.get('/questionnaire/assignments/received', { params })
}

export function getAssignmentDetail(id: string) {
  return client.get(`/questionnaire/assignments/${id}`)
}

export function submitResponse(id: string, data: { answers: any[]; duration: number }) {
  return client.post(`/questionnaire/assignments/${id}/submit`, data)
}

export function getAssignmentResult(id: string) {
  return client.get(`/questionnaire/assignments/${id}/result`)
}
```

### 4.3 填写问卷页（核心页面，重点拆解）

**新建文件：** `apps/patient-h5/src/views/questionnaire/FillQuestionnairePage.vue`

**这是整个功能最复杂的前端页面。**

**状态管理：**
```typescript
const assignment = ref(null)    // 问卷分配详情
const questions = ref([])       // 题目列表
const answers = ref({})         // { [questionId]: value }
const currentIndex = ref(0)     // 当前题号
const startTime = ref(0)        // 开始时间戳
```

**组件拆分：**
```
FillQuestionnairePage.vue
├── ProgressBar.vue              # 顶部进度条
├── QuestionSingleChoice.vue     # 单选题组件
├── QuestionMultipleChoice.vue   # 多选题组件
├── QuestionRating.vue           # 评分题组件
├── QuestionNumber.vue           # 数值题组件
├── QuestionText.vue             # 文本题组件
├── QuestionDate.vue             # 日期题组件
└── SubmitConfirm.vue            # 提交确认组件
```

**动态渲染逻辑：**
```vue
<template>
  <div v-if="currentQuestion">
    <QuestionSingleChoice v-if="currentQuestion.type === 'single_choice'" ... />
    <QuestionMultipleChoice v-if="currentQuestion.type === 'multiple_choice'" ... />
    <QuestionRating v-if="currentQuestion.type === 'rating'" ... />
    <QuestionNumber v-if="currentQuestion.type === 'number'" ... />
    <QuestionText v-if="currentQuestion.type === 'text'" ... />
    <QuestionDate v-if="currentQuestion.type === 'date'" ... />
  </div>
</template>
```

**本地暂存（防丢失）：**
```typescript
// 每次答题后保存到 localStorage
watch(answers, (val) => {
  localStorage.setItem(`questionnaire_${assignmentId}_answers`, JSON.stringify(val))
}, { deep: true })

// 页面加载时恢复
onMounted(() => {
  const saved = localStorage.getItem(`questionnaire_${assignmentId}_answers`)
  if (saved) answers.value = JSON.parse(saved)
})
```

**提交后清理：**
```typescript
// 提交成功后清除暂存
localStorage.removeItem(`questionnaire_${assignmentId}_answers`)
```

### 4.6 路由注册 + 入口改造

**修改文件：** `apps/patient-h5/src/router/index.ts`

**新增路由：**
```typescript
{ path: '/questionnaire', name: 'MyQuestionnaire', component: () => import('@/views/questionnaire/MyQuestionnairePage.vue'), meta: { auth: true } },
{ path: '/questionnaire/fill/:id', name: 'FillQuestionnaire', component: () => import('@/views/questionnaire/FillQuestionnairePage.vue'), meta: { auth: true } },
{ path: '/questionnaire/result/:id', name: 'QuestionnaireResult', component: () => import('@/views/questionnaire/QuestionnaireResultPage.vue'), meta: { auth: true } },
```

**入口改造：**
- `apps/patient-h5/src/views/profile/ProfilePage.vue` — 新增"我的问卷"菜单项

---

## Phase 5：通知集成 + 联调（第17-19天）

### 优先级 P1 — 体验闭环，但不阻塞核心流程

### 待办清单

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 5.1 | 消息通知卡片（患者端） | P1 | 0.5天 | Phase 4 |
| 5.2 | 问卷结果关联健康数据 | P1 | 0.5天 | Phase 2,3 |
| 5.3 | 全链路联调（医生发送→患者收到→填写→评分→批注） | P0 | 1天 | Phase 3,4 |
| 5.4 | 边界场景测试与修复 | P0 | 1天 | 5.3 |

### 5.1 消息通知卡片

**修改文件：** `apps/patient-h5/src/views/messages/MessagesPage.vue`

**改动：**
- 在消息列表顶部增加问卷通知区域
- 新建 `components/QuestionnaireNotification.vue`
- 点击"立即填写" → 跳转 `/questionnaire/fill/:id`
- 点击"查看批注" → 跳转 `/questionnaire/result/:id`

**后端支持：** 在 QuestionnaireService 的 createAssignments 和 addDoctorNote 方法中，可选地向消息系统写入通知（或利用现有 Chat 模块的消息类型扩展）

### 5.2 关联健康数据

**后端新增：** 在 getAssignmentResult 返回值中附加患者近7天健康数据概览

```typescript
// 获取近7天血糖摘要
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
const bloodSugarRecords = await this.prisma.bloodSugarRecord.findMany({
  where: { patientId: assignment.patient.patientProfile.id, createdAt: { gte: sevenDaysAgo } },
})
const avgValue = bloodSugarRecords.reduce((s, r) => s + r.value, 0) / bloodSugarRecords.length
const inRangeCount = bloodSugarRecords.filter(r => r.value >= 3.9 && r.value <= 10.0).length
```

### 5.3 全链路联调

**测试流程：**

```
准备：
├── 医生账号（已认证，已有绑定患者）
└── 患者账号（已完善档案，已绑定医生）

流程 1：完整提交流程
├── 医生端 → 问卷中心 → 选择"血糖自我管理评估" → 发送给患者
├── 患者端 → 消息/我的问卷 → 看到待填问卷
├── 患者端 → 逐题填写 → 提交
├── 医生端 → 已发送列表 → 状态变为"已完成" → 查看结果
├── 医生端 → 添加批注 → 保存
└── 患者端 → 查看结果 → 看到评分 + 医生批注

流程 2：过期/取消流程
├── 医生发送问卷（截止时间设为很短）
├── 验证过期后状态变更
├── 医生取消一个待填问卷
└── 验证患者端列表更新

流程 3：重复发送限制
├── 同一模板对同一患者14天内重复发送
└── 验证返回错误提示
```

### 5.4 边界场景

| 场景 | 预期行为 |
|------|---------|
| 患者未绑定任何医生时访问问卷页 | 空状态提示 |
| 医生无绑定患者时发送问卷 | 患者列表为空，发送按钮禁用 |
| 患者填写到一半退出 App | 本地暂存，再次进入恢复进度 |
| 问卷已过期后患者尝试提交 | 后端返回 400，前端提示"问卷已过期" |
| 问卷已取消后患者尝试提交 | 后端返回 400，前端提示"问卷已取消" |
| 必填题目未回答时提交 | 前端校验拦截，高亮未答题目 |
| 同一问卷重复提交 | 后端幂等，返回已有结果 |
| 非绑定医生查看患者问卷结果 | 后端返回 403 |

---

## Phase 6：体验打磨 + 上线（第20-21天）

### 优先级 P1 — 品质保障

### 待办清单

| # | 任务 | 优先级 | 预估 | 依赖 |
|---|------|--------|------|------|
| 6.1 | 过期自动处理（定时任务/惰性更新） | P1 | 0.5天 | Phase 5 |
| 6.2 | 加载/空状态/错误状态 UI | P1 | 0.5天 | Phase 3,4 |
| 6.3 | 动画与交互优化 | P2 | 0.5天 | Phase 3,4 |
| 6.4 | ESLint + 代码审查 | P1 | 0.25天 | 全部 |
| 6.5 | 构建验证 | P0 | 0.25天 | 全部 |

### 6.1 过期自动处理

**方案选择：惰性更新（推荐 MVP 阶段）**

不使用定时任务，而是在每次查询列表时检查并更新：

```typescript
// 在查询 assignments 时自动处理过期
async function autoExpire(assignments) {
  const now = new Date()
  const expired = assignments.filter(a => a.status === 'PENDING' && a.deadline && new Date(a.deadline) < now)
  if (expired.length > 0) {
    await prisma.questionnaireAssignment.updateMany({
      where: { id: { in: expired.map(a => a.id) } },
      data: { status: 'EXPIRED' },
    })
  }
}
```

### 6.2 状态 UI

| 状态 | UI 表现 |
|------|--------|
| 加载中 | van-loading 居中显示 |
| 列表为空 | van-empty + 引导文案 |
| 网络错误 | van-empty type="network" + 重试按钮 |
| 发送成功 | van-toast type="success" |
| 提交成功 | 跳转结果页 + 烟花动画 |

### 6.3 动画

- 进度条：CSS transition width 0.5s
- 评分环形图：CSS animation stroke-dashoffset 1s
- 维度条形图：CSS transition width 0.5s
- 题目切换：slide-left / slide-right 过渡

---

## 文件变更清单总表

### 新建文件

| 路径 | 阶段 | 说明 |
|------|------|------|
| `apps/server/prisma/seed-questionnaire.ts` | P1 | 种子数据脚本 |
| `apps/server/src/modules/questionnaire/questionnaire.module.ts` | P1 | 模块定义 |
| `apps/server/src/modules/questionnaire/questionnaire.controller.ts` | P2 | 控制器 |
| `apps/server/src/modules/questionnaire/questionnaire.service.ts` | P2 | 业务逻辑 |
| `apps/server/src/modules/questionnaire/dto/*.ts` | P2 | 5-6个 DTO 文件 |
| `packages/shared/src/types/questionnaire.ts` | P1 | 共享类型 |
| `apps/doctor-h5/src/api/questionnaire.ts` | P3 | 医生端 API 层 |
| `apps/doctor-h5/src/views/questionnaire/QuestionnaireCenterPage.vue` | P3 | 问卷中心 |
| `apps/doctor-h5/src/views/questionnaire/SendQuestionnairePage.vue` | P3 | 发送问卷 |
| `apps/doctor-h5/src/views/questionnaire/QuestionnaireResultPage.vue` | P3 | 结果详情 |
| `apps/doctor-h5/src/components/questionnaire/*.vue` | P3 | 5-8个组件 |
| `apps/patient-h5/src/api/questionnaire.ts` | P4 | 患者端 API 层 |
| `apps/patient-h5/src/views/questionnaire/MyQuestionnairePage.vue` | P4 | 我的问卷 |
| `apps/patient-h5/src/views/questionnaire/FillQuestionnairePage.vue` | P4 | 填写问卷 |
| `apps/patient-h5/src/views/questionnaire/QuestionnaireResultPage.vue` | P4 | 结果查看 |
| `apps/patient-h5/src/components/questionnaire/*.vue` | P4 | 8-10个组件 |

### 修改文件

| 路径 | 阶段 | 改动 |
|------|------|------|
| `apps/server/prisma/schema.prisma` | P1 | 新增 3 模型 + 3 枚举 + User 关系 |
| `apps/server/package.json` | P1 | 新增 seed:questionnaire 脚本 |
| `apps/server/src/app.module.ts` | P1 | imports 增加 QuestionnaireModule |
| `packages/shared/src/index.ts` | P1 | 导出新增类型和常量 |
| `packages/shared/src/constants/index.ts` | P1 | 新增问卷相关常量 |
| `apps/doctor-h5/src/router/index.ts` | P3 | 新增 3 条路由 |
| `apps/doctor-h5/src/views/profile/ProfilePage.vue` | P3 | 新增问卷管理入口 |
| `apps/doctor-h5/src/views/patient-detail/PatientDetailPage.vue` | P3 | 新增问卷 Tab |
| `apps/patient-h5/src/router/index.ts` | P4 | 新增 3 条路由 |
| `apps/patient-h5/src/views/profile/ProfilePage.vue` | P4 | 新增我的问卷入口 |
| `apps/patient-h5/src/views/messages/MessagesPage.vue` | P5 | 新增问卷通知卡片 |

---

## 风险与应对

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| 问卷模板题目 JSON 结构频繁变更 | 种子数据和前端解析都需同步 | 中 | Phase 1 确定 JSON schema 后冻结，用 TypeScript interface 约束 |
| 自动评分逻辑边界多（反向计分、多选计分） | 评分结果不准确 | 中 | Phase 2 写完评分函数后独立编写单元测试 |
| 填写问卷页组件过多导致性能问题 | 低端机卡顿 | 低 | 使用动态组件 `<component :is>` + 懒加载，仅渲染当前题目 |
| 消息通知集成复杂度 | Phase 5 超期 | 中 | MVP 先用 Poll 轮询 + 消息中心，不做 WebSocket 实时推送 |
| T1DM 模板内容与临床标准不符 | 医学准确性风险 | 低 | 上线前请医学专业人员审核问卷内容 |

---

## 验收标准检查清单

### Phase 1 验收
- [ ] `prisma migrate dev` 无报错
- [ ] `prisma generate` 无报错
- [ ] 种子脚本运行后，`questionnaire_templates` 表有 8 条记录
- [ ] shared 包类型导出正常，前后端均可引用

### Phase 2 验收
- [ ] Swagger 文档中可见全部问卷 API
- [ ] 模板列表/详情 API 正常返回
- [ ] 发送问卷 API：正常发送 + 14天重复限制 + 未绑定拒绝
- [ ] 提交问卷 API：自动评分正确（手动验算至少 2 套模板）
- [ ] 结果查询 API：包含评分、维度、答案、医生批注
- [ ] 统计 API：数字正确

### Phase 3 验收
- [ ] 医生端问卷中心页正常渲染（模板库 + 已发送）
- [ ] 发送问卷页：选择患者 → 设置截止时间 → 发送成功
- [ ] 问卷结果页：评分环形图 + 维度条形图 + 答案列表 + 批注
- [ ] 患者详情页问卷 Tab：评估概览 + 问卷记录列表

### Phase 4 验收
- [ ] 患者端我的问卷页：待填写/已完成 Tab 切换
- [ ] 填写问卷页：6 种题型全部正常渲染和交互
- [ ] 进度条随答题推进
- [ ] 本地暂存：退出后重新进入，进度恢复
- [ ] 提交确认页：作答概览 + 检查答案 + 确认提交
- [ ] 问卷结果页：评分 + 维度 + 医生批注

### Phase 5 验收
- [ ] 全链路：医生发送 → 患者填写 → 医生查看结果 → 批注 → 患者查看
- [ ] 消息通知卡片正常展示和跳转
- [ ] 关联健康数据卡片显示近7天血糖概览
- [ ] 所有边界场景无白屏/500错误

### Phase 6 验收
- [ ] 过期问卷自动标记为 EXPIRED
- [ ] 所有列表页有空状态/加载状态
- [ ] `pnpm lint` 无新增 error
- [ ] `pnpm build` 全部通过
