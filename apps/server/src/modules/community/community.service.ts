import { Injectable } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'

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
}
