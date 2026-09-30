import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// Ошибки отдаются только HTTP-кодом с пустым телом:
// без statusCode, message и прочих полей внутри JSON
@Catch()
export class PartitionHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PartitionHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).end();
      return;
    }

    // Непредвиденная ошибка (например, БД): подробности только в лог сервера
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
  }
}
