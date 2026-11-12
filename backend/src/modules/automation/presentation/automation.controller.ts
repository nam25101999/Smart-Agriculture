import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export class AutomationController {
  public getRules = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.query.farmId as string;
    const rules = await prisma.automationRule.findMany({
      where: farmId ? { farmId } : undefined,
      include: { zone: true, farm: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    ResponseUtil.success(res, rules, 'Lấy danh sách quy tắc tự động hóa thành công');
  };

  public createRule = async (req: Request, res: Response): Promise<void> => {
    const rule = await prisma.automationRule.create({ data: req.body });
    ResponseUtil.created(res, rule, 'Tạo quy tắc tự động hóa thành công');
  };

  public updateRule = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const rule = await prisma.automationRule.update({
      where: { id },
      data: req.body,
    });
    ResponseUtil.success(res, rule, 'Cập nhật quy tắc tự động hóa thành công');
  };

  public deleteRule = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await prisma.automationRule.delete({ where: { id } });
    ResponseUtil.success(res, null, 'Xóa quy tắc tự động hóa thành công');
  };

  public getLogs = async (req: Request, res: Response): Promise<void> => {
    const logs = await prisma.automationLog.findMany({
      include: { rule: true },
      orderBy: { executedAt: 'desc' },
      take: 50,
    });
    ResponseUtil.success(res, logs, 'Lấy nhật ký tự động hóa thành công');
  };
}

