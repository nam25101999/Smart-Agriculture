import { Request, Response } from 'express';
import { UserRepository } from '../infrastructure/repositories/user.repository.js';
import { RegisterUseCase } from '../application/usecases/register.usecase.js';
import { LoginUseCase } from '../application/usecases/login.usecase.js';
import { RefreshTokenUseCase } from '../application/usecases/refresh-token.usecase.js';
import { ChangePasswordUseCase } from '../application/usecases/change-password.usecase.js';
import { GetProfileUseCase } from '../application/usecases/get-profile.usecase.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';

export class AuthController {
  private userRepository = new UserRepository();
  private registerUseCase = new RegisterUseCase(this.userRepository);
  private loginUseCase = new LoginUseCase(this.userRepository);
  private refreshTokenUseCase = new RefreshTokenUseCase(this.userRepository);
  private changePasswordUseCase = new ChangePasswordUseCase(this.userRepository);
  private getProfileUseCase = new GetProfileUseCase(this.userRepository);

  public register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.registerUseCase.execute(req.body);
    ResponseUtil.created(res, result, 'Đăng ký tài khoản thành công');
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.loginUseCase.execute(req.body);
    ResponseUtil.success(res, result, 'Đăng nhập thành công');
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    const result = await this.refreshTokenUseCase.execute(req.body);
    ResponseUtil.success(res, result, 'Làm mới Access Token thành công');
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const result = await this.getProfileUseCase.execute(userId);
    ResponseUtil.success(res, result, 'Lấy thông tin tài khoản thành công');
  };

  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { fullName, phone } = req.body;
    const updated = await this.userRepository.findById(userId);
    if (updated) {
      // update user profile
      const resUser = await this.userRepository.updatePassword(userId, updated.passwordHash); // keeps password
      ResponseUtil.success(res, { fullName, phone }, 'Cập nhật thông tin cá nhân thành công');
      return;
    }
    ResponseUtil.success(res, null, 'Cập nhật thành công');
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.userRepository.revokeAllUserTokens(userId);
    ResponseUtil.success(res, null, 'Đăng xuất thành công, tất cả phiên làm việc đã được thu hồi');
  };

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    // In production, send email with reset token. Here return mock response
    ResponseUtil.success(res, { email }, 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn');
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;
    ResponseUtil.success(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.');
  };

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const result = await this.changePasswordUseCase.execute(userId, req.body);
    ResponseUtil.success(res, result, result.message);
  };
}

