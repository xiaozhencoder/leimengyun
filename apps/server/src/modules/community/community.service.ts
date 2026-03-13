import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
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
}
