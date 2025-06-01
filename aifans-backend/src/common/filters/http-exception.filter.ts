import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // 获取请求路径
    const requestPath = request.path;
    
    // 检查是否是静态资源请求
    if (requestPath.startsWith('/uploads/') || requestPath.startsWith('/icon/')) {
      this.logger.warn(`静态资源请求异常: ${requestPath}`);
      
      // 获取请求的文件扩展名
      const ext = path.extname(requestPath).toLowerCase();
      let contentType = 'text/plain';
      
      // 根据扩展名设置适当的Content-Type
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
        contentType = 'text/plain'; // 对于图片错误，使用纯文本响应
      }
      
      // 设置适当的状态码和内容类型
      response.status(HttpStatus.NOT_FOUND).type(contentType).send('文件不存在或无法访问');
      return;
    }
    
    // 处理HTTP异常
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    
    // 获取错误消息
    const message = 
      exception instanceof HttpException
        ? exception.message
        : '服务器内部错误';
        
    // 获取详细错误信息
    const errorResponse = 
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: exception.message || '未知错误' };
    
    // 记录错误
    this.logger.error(`HTTP异常: ${status} ${message}`, exception.stack);
    
    // 返回JSON格式的错误响应
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      error: errorResponse,
    });
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 检查是否为已知的HTTP异常
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let error = 'Unknown error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        const exceptionObj = exceptionResponse as any;
        message = exceptionObj.message || message;
        error = exceptionObj.error || error;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    console.error(`[Exception] ${status}: ${message}`, exception.stack || '');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
    });
  }
} 