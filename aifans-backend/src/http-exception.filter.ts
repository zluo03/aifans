import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// 定义不需要记录错误的路径列表
const SILENT_PATHS = [
  '/api/spirit-posts/unread-count',
  '/api/auth/profile',
];

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const path = request.url;

    // 获取详细的错误信息
    const errorResponse = exception.getResponse() as any;
    let errorMessage = '服务器内部错误';
    let errorDetails = null;

    if (typeof errorResponse === 'string') {
      errorMessage = errorResponse;
    } else if (errorResponse && typeof errorResponse === 'object') {
      errorMessage = errorResponse.message || errorResponse.error || '服务器内部错误';
      errorDetails = errorResponse.details || null;
      
      // 处理验证错误
      if (Array.isArray(errorResponse.message)) {
        errorMessage = errorResponse.message[0] || '数据验证错误';
        errorDetails = errorResponse.message;
      }
    }

    // 检查是否需要静默处理的401错误
    const isSilentPath = SILENT_PATHS.some(silentPath => path.includes(silentPath));
    const isSilentError = status === 401 && isSilentPath;

    // 只记录非静默错误
    if (!isSilentError) {
      this.logger.error(
        `错误响应: [${status}] ${request.method} ${path} - ${errorMessage}`,
        request.headers['user-agent'],
      );
    } else {
      // 对于静默错误，使用debug级别记录
      this.logger.debug(
        `静默处理: [${status}] ${request.method} ${path} - ${errorMessage}`,
        request.headers['user-agent'],
      );
    }

    // 构建统一的错误响应格式
    const responseBody = {
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: path,
      ...(errorDetails ? { details: errorDetails } : {}),
    };

    response.status(status).json(responseBody);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // 默认为服务器内部错误
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;
    
    // 构建错误消息
    let errorMessage = '服务器内部错误';
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse() as any;
      if (typeof errorResponse === 'string') {
        errorMessage = errorResponse;
      } else if (errorResponse && typeof errorResponse === 'object') {
        errorMessage = errorResponse.message || errorResponse.error || '服务器内部错误';
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message || '服务器内部错误';
    }

    // 记录错误日志
    this.logger.error(
      `未捕获异常: [${status}] ${request.method} ${request.url} - ${errorMessage}`,
      exception.stack,
    );

    // 构建统一的错误响应格式
    const responseBody = {
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(responseBody);
  }
} 