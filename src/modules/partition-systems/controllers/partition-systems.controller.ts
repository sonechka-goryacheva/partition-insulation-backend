import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { PartitionSystemsService } from '../services/partition-systems.service';
import type { PartitionMediaFiles } from '../services/partition-systems.service';
import { PartitionSessionGuard } from '../../partition-users/guards/partition-session.guard';
import { PartitionOptionalSessionGuard } from '../../partition-users/guards/partition-optional-session.guard';
import { PartitionSessionUser } from '../../../common/current-user';
import type { PartitionCurrentUser } from '../../../common/current-user';
import { PartitionSystemFiltersDto } from '../dto/partition-system-filters.dto';
import { PartitionFeedQueryDto } from '../dto/partition-feed-query.dto';
import { PartitionSystemResponseDto } from '../dto/partition-system-response.dto';
import { CreatePartitionSystemDto } from '../dto/create-partition-system.dto';
import { PublishPartitionSystemDto } from '../dto/publish-partition-system.dto';
import { PartitionLikeDto } from '../dto/partition-like.dto';
import { PartitionAttributeResponseDto } from '../dto/partition-attribute-response.dto';

// Чтение (список, лента) доступно гостю — PartitionOptionalSessionGuard.
// Методы создателя требуют сессию — PartitionSessionGuard, без неё 401
@ApiTags('partitions')
@Controller('partitions')
export class PartitionSystemsController {
  constructor(private readonly partitionSystemsService: PartitionSystemsService) {}

  // GET /api/partitions?rwFrom=45&rwTo=60 — список опубликованных с фильтром
  @Get()
  @UseGuards(PartitionOptionalSessionGuard)
  @ApiOperation({ summary: 'Список опубликованных конструкций с фильтром по Rw (доступно гостю)' })
  @ApiResponse({ status: 200, description: 'Список конструкций', type: [PartitionSystemResponseDto] })
  @ApiResponse({ status: 400, description: 'Неверный формат фильтра' })
  async getPartitionSystems(
    @Query() filters: PartitionSystemFiltersDto,
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser | null,
  ): Promise<PartitionSystemResponseDto[]> {
    return this.partitionSystemsService.findPublished(filters, partitionCurrentUser);
  }

  // GET /api/partitions/attributes — справочник атрибутов (дополнительных характеристик)
  @Get('attributes')
  @ApiOperation({ summary: 'Справочник атрибутов конструкции для формы публикации (доступно гостю)' })
  @ApiResponse({ status: 200, description: 'Список атрибутов', type: [PartitionAttributeResponseDto] })
  async getPartitionAttributes(): Promise<PartitionAttributeResponseDto[]> {
    return this.partitionSystemsService.findAttributes();
  }

  // GET /api/partitions/feed — первая конструкция ленты
  @Get('feed')
  @UseGuards(PartitionOptionalSessionGuard)
  @ApiOperation({ summary: 'Лента: первая опубликованная конструкция (доступно гостю)' })
  @ApiResponse({ status: 200, description: 'Конструкция', type: PartitionSystemResponseDto })
  @ApiResponse({ status: 404, description: 'Опубликованных конструкций нет' })
  async getPartitionFeedFirst(
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser | null,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.getFeed(partitionCurrentUser);
  }

  // GET /api/partitions/feed/:partitionSystemId?next=true — соседняя конструкция ленты
  @Get('feed/:partitionSystemId')
  @UseGuards(PartitionOptionalSessionGuard)
  @ApiOperation({ summary: 'Лента: конструкция по id или следующая за ней (next=true), доступно гостю' })
  @ApiParam({ name: 'partitionSystemId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Конструкция', type: PartitionSystemResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный формат id или next' })
  @ApiResponse({ status: 404, description: 'Конструкция не найдена' })
  async getPartitionFeed(
    @Param('partitionSystemId', ParseIntPipe) partitionSystemId: number,
    @Query() query: PartitionFeedQueryDto,
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser | null,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.getFeed(partitionCurrentUser, partitionSystemId, query.next);
  }

  // GET /api/partitions/draft — черновик текущего пользователя
  @Get('draft')
  @UseGuards(PartitionSessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Черновик текущего пользователя (только создатель)' })
  @ApiResponse({ status: 200, description: 'Черновик', type: PartitionSystemResponseDto })
  @ApiResponse({ status: 401, description: 'Гость: нет сессии' })
  @ApiResponse({ status: 404, description: 'Черновика нет' })
  async getPartitionDraft(
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.getDraft(partitionCurrentUser);
  }

  // POST /api/partitions/draft — создание черновика, form-data:
  // partitionName (текст), partitionPhoto и partitionVideo (файлы).
  // Создатель подставляется из сессии автоматически
  @Post('draft')
  @UseGuards(PartitionSessionGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'partitionPhoto', maxCount: 1 },
        { name: 'partitionVideo', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 50 * 1024 * 1024 }, // до 50 МБ на файл (короткое видео)
      },
    ),
  )
  @ApiCookieAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['partitionName', 'partitionPhoto', 'partitionVideo'],
      properties: {
        partitionName: { type: 'string', example: 'Газобетон D600, 200 мм' },
        partitionPhoto: { type: 'string', format: 'binary', description: 'Фото конструкции' },
        partitionVideo: { type: 'string', format: 'binary', description: 'Видео конструкции' },
      },
    },
  })
  @ApiOperation({ summary: 'Создание черновика с фото и видео; создатель берётся из сессии (только создатель)' })
  @ApiResponse({ status: 201, description: 'Черновик создан', type: PartitionSystemResponseDto })
  @ApiResponse({ status: 400, description: 'Нет названия, фото или видео, неверный формат' })
  @ApiResponse({ status: 401, description: 'Гость: нет сессии' })
  @ApiResponse({ status: 404, description: 'Черновик уже есть' })
  async createPartitionDraft(
    @Body() createDto: CreatePartitionSystemDto,
    @UploadedFiles() files: PartitionMediaFiles,
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.createDraft(createDto, files, partitionCurrentUser);
  }

  // PUT /api/partitions/draft/publish — публикация черновика
  @Put('draft/publish')
  @UseGuards(PartitionSessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Публикация черновика: описание, толщина, Rw и атрибуты (только создатель)' })
  @ApiResponse({ status: 200, description: 'Конструкция опубликована', type: PartitionSystemResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный формат, лишние поля или повтор атрибута' })
  @ApiResponse({ status: 401, description: 'Гость: нет сессии' })
  @ApiResponse({ status: 404, description: 'Черновика нет или атрибута нет в справочнике' })
  async publishPartitionDraft(
    @Body() publishDto: PublishPartitionSystemDto,
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.publishDraft(publishDto, partitionCurrentUser);
  }

  // DELETE /api/partitions/:partitionSystemId — мягкое удаление своей конструкции
  @Delete(':partitionSystemId')
  @UseGuards(PartitionSessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Удаление своей конструкции: статус removed (только создатель)' })
  @ApiParam({ name: 'partitionSystemId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Конструкция удалена' })
  @ApiResponse({ status: 401, description: 'Гость: нет сессии' })
  @ApiResponse({ status: 404, description: 'Конструкция не найдена или чужая' })
  async deletePartitionSystem(
    @Param('partitionSystemId', ParseIntPipe) partitionSystemId: number,
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser,
  ): Promise<void> {
    await this.partitionSystemsService.removePartitionSystem(partitionSystemId, partitionCurrentUser);
  }

  // POST /api/partitions/:partitionSystemId/like — лайк 1 / снятие 0
  @Post(':partitionSystemId/like')
  @UseGuards(PartitionSessionGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Лайк опубликованной конструкции: 1 — поставить, 0 — снять (только создатель)' })
  @ApiParam({ name: 'partitionSystemId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Обновлённая карточка', type: PartitionSystemResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный формат' })
  @ApiResponse({ status: 401, description: 'Гость: нет сессии' })
  @ApiResponse({ status: 404, description: 'Конструкция не найдена' })
  async likePartitionSystem(
    @Param('partitionSystemId', ParseIntPipe) partitionSystemId: number,
    @Body() likeDto: PartitionLikeDto,
    @PartitionSessionUser() partitionCurrentUser: PartitionCurrentUser,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.setPartitionLike(partitionSystemId, likeDto, partitionCurrentUser);
  }
}
