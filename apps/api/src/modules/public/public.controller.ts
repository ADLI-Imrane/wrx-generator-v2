import { Controller, Get, Param, Req, Res, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PublicService } from './public.service';
import { QrService } from '../qr/qr.service';

@ApiTags('public')
@Controller('r')
export class PublicController {
  constructor(
    private publicService: PublicService,
    private qrService: QrService
  ) {}

  // IMPORTANT: Routes with static paths must come BEFORE dynamic :slug routes
  @Get('scan/:id')
  @ApiOperation({ summary: 'Track QR code scan and redirect to content' })
  async scanQR(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const scanData = {
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      ...this.parseUserAgent(req.headers['user-agent'] || ''),
    };

    try {
      const { content, type } = await this.qrService.trackScan(id, scanData);

      // Redirect only to explicit HTTP(S) URLs. QR content can otherwise be arbitrary text.
      if (type === 'url') {
        try {
          const destination = new URL(content);
          if (destination.protocol === 'http:' || destination.protocol === 'https:') {
            return res.redirect(HttpStatus.FOUND, destination.toString());
          }
        } catch {
          // Return invalid URL content as data rather than handing it to the redirect helper.
        }
      }

      // For other types, return the content
      return res.json({ content, type });
    } catch {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'QR code not found' });
    }
  }

  @Get(':slug/preview')
  @ApiOperation({ summary: 'Get link preview without redirecting' })
  preview(@Param('slug') slug: string) {
    return this.publicService.getLinkPreview(slug);
  }

  @Post(':slug/verify-password')
  @ApiOperation({ summary: 'Verify password for protected link' })
  verifyPassword(@Param('slug') slug: string, @Body('password') password: string) {
    return this.publicService.checkPassword(slug, password);
  }

  @Post(':slug/unlock')
  @ApiOperation({ summary: 'Unlock a protected link without exposing its password in the URL' })
  async unlock(
    @Param('slug') slug: string,
    @Body('password') password: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const referrerHeader = req.headers['referer'] || req.headers['referrer'];
    const clickData = {
      linkId: '',
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      referrer: Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader,
      ...this.parseUserAgent(req.headers['user-agent'] || ''),
    };
    const { url } = await this.publicService.redirect(slug, clickData, password);
    return res.redirect(HttpStatus.FOUND, url);
  }

  // Dynamic :slug route must be LAST to avoid catching static routes
  @Get(':slug')
  @ApiOperation({ summary: 'Redirect to original URL' })
  async redirect(@Param('slug') slug: string, @Req() req: Request, @Res() res: Response) {
    const referrerHeader = req.headers['referer'] || req.headers['referrer'];
    const clickData = {
      linkId: '', // Will be set by service
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      referrer: Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader,
      ...this.parseUserAgent(req.headers['user-agent'] || ''),
    };

    try {
      const { url } = await this.publicService.redirect(slug, clickData);
      return res.redirect(HttpStatus.FOUND, url);
    } catch (error) {
      if (error instanceof Error && error.message === 'This link is password protected') {
        const safeSlug = encodeURIComponent(slug);
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'"
        );
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .type('html')
          .send(
            `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lien protégé</title><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#070b19;color:#fff;font:16px system-ui}.card{width:min(360px,calc(100% - 48px));padding:32px;border:1px solid #24324f;border-radius:24px;background:#10182b}input,button{box-sizing:border-box;width:100%;border-radius:12px;padding:13px;font:inherit}input{border:1px solid #334155;background:#0b1220;color:#fff}button{margin-top:12px;border:0;background:#67e8f9;color:#082f49;font-weight:700;cursor:pointer}p{color:#94a3b8;line-height:1.5}</style><main class="card"><h1>Lien protégé</h1><p>Entrez le mot de passe pour continuer.</p><form method="post" action="/r/${safeSlug}/unlock"><input name="password" type="password" minlength="8" maxlength="128" required autofocus autocomplete="current-password"><button type="submit">Continuer</button></form></main></html>`
          );
      }
      throw error;
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0];
      return firstIp ? firstIp.trim() : '';
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0] || '';
    }
    return req.ip || req.socket.remoteAddress || '';
  }

  private parseUserAgent(userAgent: string): { device?: string; browser?: string; os?: string } {
    // Simple user agent parsing - in production, use a library like ua-parser-js
    const result: { device?: string; browser?: string; os?: string } = {};

    // Device detection
    if (/mobile/i.test(userAgent)) {
      result.device = 'Mobile';
    } else if (/tablet/i.test(userAgent)) {
      result.device = 'Tablet';
    } else {
      result.device = 'Desktop';
    }

    // Browser detection
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
      result.browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      result.browser = 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      result.browser = 'Safari';
    } else if (/edge/i.test(userAgent)) {
      result.browser = 'Edge';
    } else {
      result.browser = 'Other';
    }

    // OS detection
    if (/windows/i.test(userAgent)) {
      result.os = 'Windows';
    } else if (/mac/i.test(userAgent)) {
      result.os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      result.os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      result.os = 'Android';
    } else if (/ios|iphone|ipad/i.test(userAgent)) {
      result.os = 'iOS';
    } else {
      result.os = 'Other';
    }

    return result;
  }
}
