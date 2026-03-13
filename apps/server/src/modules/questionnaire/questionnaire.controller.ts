import { Controller, Get, Post, Put, Param, Request, Query, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { QuestionnaireService } from './questionnaire.service'
import { CreateAssignmentDto, SubmitResponseDto, AddNoteDto, QueryAssignmentDto, QueryTemplateDto } from './dto'

@ApiTags('问卷管理')
@Controller('questionnaire')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Get('templates')
  @ApiOperation({ summary: '问卷模板列表' })
  async getTemplates(@Query() query: QueryTemplateDto) {
    return this.questionnaireService.getTemplates(query)
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '问卷模板详情' })
  async getTemplateById(@Param('id') id: string) {
    return this.questionnaireService.getTemplateById(id)
  }

  @Post('assignments')
  @ApiOperation({ summary: '向患者发送问卷' })
  async createAssignments(@Request() req, @Body() dto: CreateAssignmentDto) {
    return this.questionnaireService.createAssignments(req.user.id, dto)
  }

  @Get('assignments/sent')
  @ApiOperation({ summary: '医生已发送问卷列表' })
  async getSentAssignments(@Request() req, @Query() query: QueryAssignmentDto) {
    return this.questionnaireService.getSentAssignments(req.user.id, query)
  }

  @Get('assignments/received')
  @ApiOperation({ summary: '患者待填/已填问卷列表' })
  async getReceivedAssignments(@Request() req, @Query() query: QueryAssignmentDto) {
    return this.questionnaireService.getReceivedAssignments(req.user.id, query)
  }

  @Get('assignments/:id')
  @ApiOperation({ summary: '问卷详情（含题目）' })
  async getAssignmentDetail(@Request() req, @Param('id') id: string) {
    return this.questionnaireService.getAssignmentDetail(req.user.id, id)
  }

  @Post('assignments/:id/submit')
  @ApiOperation({ summary: '患者提交问卷答案' })
  async submitResponse(@Request() req, @Param('id') id: string, @Body() dto: SubmitResponseDto) {
    return this.questionnaireService.submitResponse(req.user.id, id, dto)
  }

  @Get('assignments/:id/result')
  @ApiOperation({ summary: '问卷结果详情' })
  async getAssignmentResult(@Request() req, @Param('id') id: string) {
    return this.questionnaireService.getAssignmentResult(req.user.id, id)
  }

  @Put('assignments/:id/note')
  @ApiOperation({ summary: '医生添加批注' })
  async addNote(@Request() req, @Param('id') id: string, @Body() dto: AddNoteDto) {
    return this.questionnaireService.addNote(req.user.id, id, dto)
  }

  @Put('assignments/:id/cancel')
  @ApiOperation({ summary: '取消问卷' })
  async cancelAssignment(@Request() req, @Param('id') id: string) {
    return this.questionnaireService.cancelAssignment(req.user.id, id)
  }

  @Get('patients/:patientId/history')
  @ApiOperation({ summary: '患者问卷历史（含趋势）' })
  async getPatientHistory(@Request() req, @Param('patientId') patientId: string) {
    return this.questionnaireService.getPatientHistory(req.user.id, patientId)
  }

  @Get('stats/overview')
  @ApiOperation({ summary: '问卷统计概览' })
  async getStatsOverview(@Request() req) {
    return this.questionnaireService.getStatsOverview(req.user.id)
  }
}
