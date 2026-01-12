export class AuthService {
  async verifyFirebaseToken(token: string): Promise<{ uid: string } | null> {
    try {
      console.log('Token verification requested:', token);
      return null;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  extractUserIdFromHeader(
    authHeader: string | undefined
  ): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      return payload.sub || null;
    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  }
}

export default new AuthService();
