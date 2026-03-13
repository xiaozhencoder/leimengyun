import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { CreatePostDto } from './dto/create-post.dto'
import { QueryPostDto } from './dto/query-post.dto'

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async getTopics() {
    return this.prisma.topic.findMany({
      orderBy: [{ isHot: 'desc' }, { sortOrder: 'asc' }, { postCount: 'desc' }],
    })
  }

  async seedTopics() {
    const topics = [
      { name: '控糖经验', icon: '📊', description: '分享血糖管理心得和技巧', isHot: true, sortOrder: 1 },
      { name: '饮食交流', icon: '🍱', description: '交流低碳水食谱和饮食搭配', isHot: true, sortOrder: 2 },
      { name: '运动打卡', icon: '🏃', description: '分享运动记录和运动对血糖的影响', isHot: true, sortOrder: 3 },
      { name: '新人求助', icon: '🆕', description: '新确诊患者提问交流', isHot: false, sortOrder: 4 },
      { name: '胰岛素泵', icon: '💉', description: '泵友交流使用经验', isHot: false, sortOrder: 5 },
      { name: '心情树洞', icon: '🌳', description: '匿名倾诉、情感互助', isHot: false, sortOrder: 6 },
      { name: '医生科普', icon: '👨‍⚕️', description: '认证医生发布的科普文章', isHot: false, sortOrder: 7 },
      { name: '好物分享', icon: '🎁', description: '分享实用的控糖好物', isHot: false, sortOrder: 8 },
    ]

    for (const topic of topics) {
      await this.prisma.topic.upsert({
        where: { name: topic.name },
        update: {},
        create: topic,
      })
    }

    return { message: '话题种子数据已初始化', count: topics.length }
  }

  async getPosts(userId: string, query: QueryPostDto) {
    const { page = 1, pageSize = 20, tab = 'recommend', topicId } = query
    const skip = (page - 1) * pageSize

    const where: any = { status: 'PUBLISHED' }
    if (topicId) where.topicId = topicId
    if (tab === 'doctor') where.contentType = 'DOCTOR_ARTICLE'
    if (tab === 'following') {
      const followings = await this.prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      })
      where.authorId = { in: followings.map(f => f.followingId) }
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              avatarUrl: true,
              role: true,
              patientProfile: { select: { nickname: true, diabetesType: true, treatmentPlan: true } },
              doctorProfile: { select: { realName: true, department: true, title: true, verifyStatus: true } },
            },
          },
          topic: { select: { id: true, name: true, icon: true } },
        },
        orderBy: [{ isTop: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ])

    const postIds = posts.map(p => p.id)
    const [likedSet, collectedSet] = await Promise.all([
      this.prisma.postLike.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
      this.prisma.postCollect.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    ])
    const likedIds = new Set(likedSet.map(l => l.postId))
    const collectedIds = new Set(collectedSet.map(c => c.postId))

    const list = posts.map(post => {
      const isPatient = post.author.role === 'PATIENT'
      const authorName = post.isAnonymous
        ? '匿名糖友'
        : (isPatient ? post.author.patientProfile?.nickname : post.author.doctorProfile?.realName) || '用户'

      return {
        id: post.id,
        author: {
          id: post.isAnonymous ? null : post.author.id,
          nickname: authorName,
          avatarUrl: post.isAnonymous ? null : post.author.avatarUrl,
          role: post.author.role,
          diabetesType: isPatient ? post.author.patientProfile?.diabetesType : null,
          treatmentPlan: isPatient ? post.author.patientProfile?.treatmentPlan : null,
          department: !isPatient ? post.author.doctorProfile?.department : null,
          verifyStatus: !isPatient ? post.author.doctorProfile?.verifyStatus : null,
          isAnonymous: post.isAnonymous,
        },
        contentType: post.contentType,
        title: post.title,
        content: post.content,
        images: post.images,
        topic: post.topic,
        bloodSugarData: post.bloodSugarData,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        collectCount: post.collectCount,
        isLiked: likedIds.has(post.id),
        isCollected: collectedIds.has(post.id),
        isTop: post.isTop,
        createdAt: post.createdAt,
      }
    })

    return { list, total, hasMore: skip + pageSize < total }
  }

  async getPostById(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            avatarUrl: true,
            role: true,
            patientProfile: { select: { nickname: true, diabetesType: true, treatmentPlan: true, createdAt: true } },
            doctorProfile: { select: { realName: true, hospital: true, department: true, title: true, verifyStatus: true } },
          },
        },
        topic: { select: { id: true, name: true, icon: true } },
      },
    })

    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('帖子不存在')
    }
    if (post.status === 'HIDDEN') {
      throw new NotFoundException('帖子已被隐藏')
    }

    const [liked, collected, followed] = await Promise.all([
      this.prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } }),
      this.prisma.postCollect.findUnique({ where: { postId_userId: { postId, userId } } }),
      post.isAnonymous ? null : this.prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: post.authorId } },
      }),
    ])

    const isPatient = post.author.role === 'PATIENT'
    const authorName = post.isAnonymous
      ? '匿名糖友'
      : (isPatient ? post.author.patientProfile?.nickname : post.author.doctorProfile?.realName) || '用户'

    return {
      id: post.id,
      author: {
        id: post.isAnonymous ? null : post.author.id,
        nickname: authorName,
        avatarUrl: post.isAnonymous ? null : post.author.avatarUrl,
        role: post.author.role,
        diabetesType: isPatient ? post.author.patientProfile?.diabetesType : null,
        treatmentPlan: isPatient ? post.author.patientProfile?.treatmentPlan : null,
        hospital: !isPatient ? post.author.doctorProfile?.hospital : null,
        department: !isPatient ? post.author.doctorProfile?.department : null,
        title: !isPatient ? post.author.doctorProfile?.title : null,
        verifyStatus: !isPatient ? post.author.doctorProfile?.verifyStatus : null,
        isAnonymous: post.isAnonymous,
        isFollowed: !!followed,
      },
      contentType: post.contentType,
      title: post.title,
      content: post.content,
      images: post.images,
      topic: post.topic,
      bloodSugarData: post.bloodSugarData,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      collectCount: post.collectCount,
      isLiked: !!liked,
      isCollected: !!collected,
      isTop: post.isTop,
      createdAt: post.createdAt,
    }
  }

  async getTopicById(userId: string, topicId: string, query: QueryPostDto) {
    const topic = await this.prisma.topic.findUnique({ where: { id: topicId } })
    if (!topic) throw new NotFoundException('话题不存在')

    const posts = await this.getPosts(userId, { ...query, topicId })

    return {
      topic,
      posts: posts.list,
      total: posts.total,
      hasMore: posts.hasMore,
    }
  }

  async createPost(userId: string, dto: CreatePostDto) {
    if (dto.contentType === 'DOCTOR_ARTICLE') {
      const doctor = await this.prisma.doctorProfile.findUnique({ where: { userId } })
      if (!doctor || doctor.verifyStatus !== 'APPROVED') {
        throw new ForbiddenException('仅认证医生可发布科普文章')
      }
    }

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({ where: { id: dto.topicId } })
      if (!topic) throw new NotFoundException('话题不存在')
    }

    if (dto.contentType === 'BLOOD_SUGAR_DIARY' && !dto.bloodSugarData) {
      dto.bloodSugarData = await this.autoFillBloodSugarData(userId)
    }

    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        contentType: dto.contentType as any,
        title: dto.title,
        content: dto.content,
        images: dto.images || [],
        topicId: dto.topicId,
        bloodSugarData: dto.bloodSugarData || undefined,
        isAnonymous: dto.isAnonymous || false,
      },
    })

    if (dto.topicId) {
      await this.prisma.topic.update({
        where: { id: dto.topicId },
        data: { postCount: { increment: 1 } },
      })
    }

    return post
  }

  private async autoFillBloodSugarData(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId } })
    if (!profile) return null

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const records = await this.prisma.bloodSugarRecord.findMany({
      where: {
        patientId: profile.id,
        recordedAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { recordedAt: 'asc' },
    })

    if (!records.length) return null

    const values = records.map(r => r.value)
    const average = Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1))
    const inRange = values.filter(v => v >= 3.9 && v <= 10.0).length
    const inRangeRate = Math.round((inRange / values.length) * 100)

    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    return {
      date: dateStr,
      records: records.map(r => {
        const d = new Date(r.recordedAt)
        return {
          time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
          value: r.value,
          measureTime: r.measureTime,
        }
      }),
      average,
      inRangeRate,
    }
  }

  async updatePost(userId: string, postId: string, dto: Partial<CreatePostDto>) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException('帖子不存在')
    if (post.authorId !== userId) throw new ForbiddenException('只能编辑自己的帖子')
    if (post.status === 'DELETED') throw new NotFoundException('帖子已删除')

    const data: any = {}
    if (dto.content !== undefined) data.content = dto.content
    if (dto.title !== undefined) data.title = dto.title
    if (dto.images !== undefined) data.images = dto.images
    if (dto.topicId !== undefined) {
      if (post.topicId && post.topicId !== dto.topicId) {
        await this.prisma.topic.update({ where: { id: post.topicId }, data: { postCount: { decrement: 1 } } })
      }
      if (dto.topicId) {
        await this.prisma.topic.update({ where: { id: dto.topicId }, data: { postCount: { increment: 1 } } })
      }
      data.topicId = dto.topicId
    }

    return this.prisma.post.update({ where: { id: postId }, data })
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException('帖子不存在')

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (post.authorId !== userId && user?.role !== 'ADMIN') {
      throw new ForbiddenException('无权删除')
    }

    await this.prisma.post.update({ where: { id: postId }, data: { status: 'DELETED' } })

    if (post.topicId) {
      await this.prisma.topic.update({
        where: { id: post.topicId },
        data: { postCount: { decrement: 1 } },
      })
    }

    return { message: '已删除' }
  }

  async getMyPosts(userId: string, query: QueryPostDto) {
    const { page = 1, pageSize = 20 } = query
    const skip = (page - 1) * pageSize
    const where = { authorId: userId, status: { not: 'DELETED' as any } }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          topic: { select: { id: true, name: true, icon: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ])

    const list = posts.map(post => ({
      id: post.id,
      contentType: post.contentType,
      title: post.title,
      content: post.content,
      images: post.images,
      topic: post.topic,
      bloodSugarData: post.bloodSugarData,
      isAnonymous: post.isAnonymous,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      collectCount: post.collectCount,
      isTop: post.isTop,
      createdAt: post.createdAt,
    }))

    return { list, total, hasMore: skip + pageSize < total }
  }

  async getCollectedPosts(userId: string, query: QueryPostDto) {
    const { page = 1, pageSize = 20 } = query
    const skip = (page - 1) * pageSize

    const collects = await this.prisma.postCollect.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true, avatarUrl: true, role: true,
                patientProfile: { select: { nickname: true, diabetesType: true } },
                doctorProfile: { select: { realName: true, department: true, verifyStatus: true } },
              },
            },
            topic: { select: { id: true, name: true, icon: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    })

    const total = await this.prisma.postCollect.count({ where: { userId } })

    const list = collects
      .filter(c => c.post.status === 'PUBLISHED')
      .map(c => {
        const post = c.post
        const isPatient = post.author.role === 'PATIENT'
        return {
          id: post.id,
          author: {
            id: post.isAnonymous ? null : post.author.id,
            nickname: post.isAnonymous ? '匿名糖友' : (isPatient ? post.author.patientProfile?.nickname : post.author.doctorProfile?.realName) || '用户',
            avatarUrl: post.isAnonymous ? null : post.author.avatarUrl,
            role: post.author.role,
            isAnonymous: post.isAnonymous,
          },
          contentType: post.contentType,
          title: post.title,
          content: post.content,
          images: post.images,
          topic: post.topic,
          bloodSugarData: post.bloodSugarData,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          collectCount: post.collectCount,
          isLiked: false,
          isCollected: true,
          createdAt: post.createdAt,
        }
      })

    return { list, total, hasMore: skip + pageSize < total }
  }
}
