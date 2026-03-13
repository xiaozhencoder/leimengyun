import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding community data...')

  // Create test patient users
  const patients = [
    { phone: '13800000001', nickname: '糖友小王', gender: 'MALE', diabetesType: 'TYPE_1', treatmentPlan: 'CSII' },
    { phone: '13800000002', nickname: '甜蜜战士', gender: 'FEMALE', diabetesType: 'TYPE_2', treatmentPlan: 'ORAL' },
    { phone: '13800000003', nickname: '控糖达人', gender: 'MALE', diabetesType: 'TYPE_2', treatmentPlan: 'LIFESTYLE' },
    { phone: '13800000004', nickname: '糖妈妈', gender: 'FEMALE', diabetesType: 'GESTATIONAL', treatmentPlan: 'MDI' },
  ]

  const patientUsers: any[] = []
  for (const p of patients) {
    const user = await prisma.user.upsert({
      where: { phone: p.phone },
      update: {},
      create: { phone: p.phone, role: 'PATIENT' },
    })
    await prisma.patientProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        nickname: p.nickname,
        gender: p.gender,
        birthDate: new Date('1990-01-01'),
        diabetesType: p.diabetesType as any,
        treatmentPlan: p.treatmentPlan as any,
      },
    })
    patientUsers.push(user)
  }

  // Create a doctor user
  const doctorUser = await prisma.user.upsert({
    where: { phone: '13800000005' },
    update: {},
    create: { phone: '13800000005', role: 'DOCTOR' },
  })
  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      realName: '王医生',
      hospital: '上海瑞金医院',
      department: '内分泌科',
      title: 'ASSOCIATE_CHIEF',
      licenseNo: 'SEED20260001',
      specialties: '2型糖尿病、糖尿病营养',
      verifyStatus: 'APPROVED',
    },
  })

  // Get topics
  const topics = await prisma.topic.findMany()
  const topicMap = new Map(topics.map(t => [t.name, t.id]))

  // Seed posts
  const seedPosts = [
    { authorId: patientUsers[0].id, content: '坚持了一个月的低碳水饮食，空腹血糖从7.2降到了5.6！关键是把主食换成了糙米和全麦面包，每餐碳水控制在40g以内。刚开始确实很难受，现在已经习惯了，而且精神状态比以前好很多。', topicName: '控糖经验' },
    { authorId: patientUsers[1].id, content: '今天试了一个新食谱：鸡胸肉沙拉配牛油果，总碳水才15g！餐后2小时血糖6.2，完美达标。分享给大家，特别适合午餐吃。做法很简单：鸡胸肉煎熟切片，配生菜、番茄、半个牛油果，淋一点橄榄油和黑醋。', topicName: '饮食交流' },
    { authorId: patientUsers[2].id, content: '每天饭后散步30分钟，坚持两周了，餐后血糖明显改善！之前午餐后经常飙到10以上，现在基本都在8以内。强烈推荐给不想加药的糖友们，运动真的是最好的降糖药！💪', topicName: '运动打卡' },
    { authorId: patientUsers[3].id, content: '孕期糖尿病好焦虑，空腹血糖5.8，餐后1小时8.9。医生说还可以先不用胰岛素，靠饮食控制试试。有没有经历过妊娠期糖尿病的姐妹，可以分享一下经验吗？🙏', topicName: '新人求助' },
    { authorId: patientUsers[0].id, content: '用了三年的美敦力泵今天换成了丹纳，分享一下使用感受：1. 体积小了很多，日常携带方便；2. 操作界面更直观；3. 但管路接口不太一样，需要适应。总体来说还是很满意的！', topicName: '胰岛素泵' },
    { authorId: patientUsers[1].id, content: '确诊两年了，最近情绪低落。每天测血糖、算碳水、打针，感觉生活被糖尿病绑架了。有时候真的很想像正常人一样随便吃一顿火锅... 发出来就是想说说，不需要安慰，就是想找个地方说一下。', topicName: '心情树洞', isAnonymous: true },
    { authorId: patientUsers[2].id, content: '推荐一个超好用的无糖零食：某品牌的0糖黑巧克力，可可含量85%，一小块才2g碳水，嘴馋的时候吃一块完全不影响血糖。还有无糖酸奶也不错，配一点坚果就是完美的加餐！', topicName: '好物分享' },
    { authorId: patientUsers[0].id, content: '分享我的早餐搭配：两个水煮蛋+一小碗燕麦粥+半个苹果。总碳水大约25g，餐后血糖稳定在7以内。燕麦粥一定要选纯燕麦，不要选速溶的，速溶的GI值太高了。', topicName: '饮食交流' },
    { authorId: doctorUser.id, contentType: 'DOCTOR_ARTICLE', title: '糖尿病患者如何正确选择水果', content: '很多糖友认为得了糖尿病就不能吃水果，其实这是一个误区。关键在于选对水果和控制份量。\n\n低GI水果推荐：樱桃、草莓、蓝莓、苹果、梨、柚子\n中GI水果：橙子、桃子、芒果（少量）\n高GI水果（建议避免）：西瓜、菠萝、荔枝\n\n每次水果摄入量建议控制在100-150g，放在两餐之间食用，避免餐后立即吃水果。建议大家记录吃水果后的血糖变化，找到适合自己的水果种类和份量。', topicName: '医生科普' },
    { authorId: doctorUser.id, contentType: 'DOCTOR_ARTICLE', title: '低血糖的急救处理——每个糖友都应该知道', content: '低血糖（血糖<3.9mmol/L）是糖尿病治疗中最常见的急性并发症。正确处理可以避免严重后果。\n\n识别低血糖症状：心慌、手抖、出冷汗、头晕、饥饿感\n\n急救步骤（15-15法则）：\n1. 立即摄入15g快速碳水：如3-4块葡萄糖片、半杯果汁、1汤匙蜂蜜\n2. 等待15分钟后复测血糖\n3. 如果仍低于3.9，再摄入15g碳水\n4. 血糖恢复后吃一份含蛋白质的零食\n\n预防要点：不要跳餐、运动前检查血糖、随身携带糖果。', topicName: '医生科普' },
  ]

  for (const sp of seedPosts) {
    const topicId = topicMap.get(sp.topicName)
    const existing = await prisma.post.findFirst({
      where: { authorId: sp.authorId, content: sp.content },
    })
    if (existing) continue

    await prisma.post.create({
      data: {
        authorId: sp.authorId,
        contentType: (sp as any).contentType || 'NORMAL',
        title: (sp as any).title || null,
        content: sp.content,
        topicId: topicId || null,
        isAnonymous: (sp as any).isAnonymous || false,
      },
    })

    if (topicId) {
      await prisma.topic.update({
        where: { id: topicId },
        data: { postCount: { increment: 1 } },
      })
    }
  }

  // Add some likes and comments
  const allPosts = await prisma.post.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  for (const post of allPosts) {
    for (const u of patientUsers.slice(0, 2)) {
      if (u.id === post.authorId) continue
      const existing = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: post.id, userId: u.id } },
      })
      if (!existing) {
        await prisma.postLike.create({ data: { postId: post.id, userId: u.id } })
        await prisma.post.update({ where: { id: post.id }, data: { likeCount: { increment: 1 } } })
      }
    }
  }

  // Add comments to first few posts
  const commentData = [
    { content: '太棒了！我也要试试低碳水饮食' },
    { content: '坚持就是胜利，加油！💪' },
    { content: '谢谢分享，学到了很多' },
  ]
  const firstPost = allPosts[0]
  if (firstPost) {
    for (let i = 0; i < commentData.length && i < patientUsers.length; i++) {
      if (patientUsers[i].id === firstPost.authorId) continue
      const existing = await prisma.comment.findFirst({
        where: { postId: firstPost.id, authorId: patientUsers[i].id },
      })
      if (!existing) {
        await prisma.comment.create({
          data: { postId: firstPost.id, authorId: patientUsers[i].id, content: commentData[i].content },
        })
        await prisma.post.update({ where: { id: firstPost.id }, data: { commentCount: { increment: 1 } } })
      }
    }
  }

  console.log('Community seed data created successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
