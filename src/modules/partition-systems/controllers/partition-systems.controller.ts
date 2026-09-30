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
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PartitionSystemsService } from '../services/partition-systems.service';
import type { PartitionMediaFiles } from '../services/partition-systems.service';
import { PartitionSystemFiltersDto } from '../dto/partition-system-filters.dto';
import { PartitionFeedQueryDto } from '../dto/partition-feed-query.dto';
import { PartitionSystemResponseDto } from '../dto/partition-system-response.dto';
import { CreatePartitionSystemDto } from '../dto/create-partition-system.dto';
import { PublishPartitionSystemDto } from '../dto/publish-partition-system.dto';
import { PartitionLikeDto } from '../dto/partition-like.dto';

@Controller('partitions')
export class PartitionSystemsController {
  constructor(private readonly partitionSystemsService: PartitionSystemsService) {}

  // GET /api/partitions?rwFrom=45&rwTo=60 — список опубликованных с фильтром
  @Get()
  async getPartitionSystems(
    @Query() filters: PartitionSystemFiltersDto,
  ): Promise<PartitionSystemResponseDto[]> {
    return this.partitionSystemsService.findPublished(filters);
  }

  // GET /api/partitions/feed и /api/partitions/feed/:partitionSystemId?next=true — лента
  @Get('feed{/:partitionSystemId}')
  async getPartitionFeed(
    @Param('partitionSystemId', new ParseIntPipe({ optional: true })) partitionSystemId: number | undefined,
    @Query() query: PartitionFeedQueryDto,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.getFeed(partitionSystemId, query.next);
  }

  // GET /api/partitions/draft — черновик текущего пользователя
  @Get('draft')
  async getPartitionDraft(): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.getDraft();
  }

  // POST /api/partitions/draft — создание черновика, form-data:
  // partitionName (текст), partitionPhoto и partitionVideo (файлы)
  @Post('draft')
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
  async createPartitionDraft(
    @Body() createDto: CreatePartitionSystemDto,
    @UploadedFiles() files: PartitionMediaFiles,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.createDraft(createDto, files);
  }

  // PUT /api/partitions/draft/publish — публикация черновика
  @Put('draft/publish')
  async publishPartitionDraft(
    @Body() publishDto: PublishPartitionSystemDto,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.publishDraft(publishDto);
  }

  // DELETE /api/partitions/:partitionSystemId — мягкое удаление своей конструкции
  @Delete(':partitionSystemId')
  async deletePartitionSystem(
    @Param('partitionSystemId', ParseIntPipe) partitionSystemId: number,
  ): Promise<void> {
    await this.partitionSystemsService.removePartitionSystem(partitionSystemId);
  }

  // POST /api/partitions/:partitionSystemId/like — лайк 1 / снятие 0
  @Post(':partitionSystemId/like')
  @HttpCode(HttpStatus.OK)
  async likePartitionSystem(
    @Param('partitionSystemId', ParseIntPipe) partitionSystemId: number,
    @Body() likeDto: PartitionLikeDto,
  ): Promise<PartitionSystemResponseDto> {
    return this.partitionSystemsService.setPartitionLike(partitionSystemId, likeDto);
  }
}
