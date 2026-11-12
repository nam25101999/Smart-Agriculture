import { Response } from 'express';

export interface MetaEnvelope {
  timestamp: string;
  traceId?: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta: MetaEnvelope;
}

export class ResponseUtil {
  public static success<T>(
    res: Response,
    data: T,
    message = 'Yêu cầu thực hiện thành công',
    statusCode = 200,
    metaProps?: Partial<MetaEnvelope>
  ): Response {
    const traceId = res.getHeader('x-trace-id') as string | undefined;

    const body: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
        ...metaProps,
      },
    };

    return res.status(statusCode).json(body);
  }

  public static created<T>(
    res: Response,
    data: T,
    message = 'Khởi tạo tài nguyên thành công',
    metaProps?: Partial<MetaEnvelope>
  ): Response {
    return this.success(res, data, message, 201, metaProps);
  }

  public static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Truy xuất danh sách thành công'
  ): Response {
    const totalPages = Math.ceil(total / limit) || 1;
    return this.success(res, data, message, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  }

  public static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

