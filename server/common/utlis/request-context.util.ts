// src/common/utils/request-context.util.ts

export interface RequestContext {
  user: string;
  ip: string;
}

export function extractIp(req: any): string {
  let ip =
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';

  if (ip === '::1' || ip === '127.0.0.1') {
    return '127.0.0.1';
  }

  ip = ip.toString().replace('::ffff:', '');

  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  return ip || '0.0.0.0';
}

export function extractUser(req: any): string {
  return req.user?.username || req.headers['x-user'] || 'system';
}

export function getRequestContext(req: any): RequestContext {
  return {
    user: extractUser(req),
    ip: extractIp(req),
  };
}
