import { JwtService } from '../../src/modules/auth/infrastructure/jwt.service.js';

describe('JwtService Unit Test', () => {
  it('should generate valid access and refresh tokens and verify them correctly', () => {
    const userPayload = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'test@smartagri.vn',
      fullName: 'Nguyen Van A',
      globalRoles: ['FARM_OWNER'],
    };

    const tokens = JwtService.generateTokens(userPayload);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const verified = JwtService.verifyAccessToken(tokens.accessToken);
    expect(verified.id).toBe(userPayload.id);
    expect(verified.email).toBe(userPayload.email);
    expect(verified.globalRoles).toContain('FARM_OWNER');

    const verifiedRefresh = JwtService.verifyRefreshToken(tokens.refreshToken);
    expect(verifiedRefresh.userId).toBe(userPayload.id);
  });
});

