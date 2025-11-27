import { Controller, Get, Param, Query, Req, Res, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller()
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Redirect to original URL' })
  @ApiQuery({ name: 'password', required: false, description: 'Password for protected links' })
  async redirect(
    @Param('slug') slug: string,
    @Query('password') password: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // Skip API routes
    if (['api', 'health', 'docs'].includes(slug)) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Not found' });
    }

    const referrerHeader = req.headers['referer'] || req.headers['referrer'];
    const clickData = {
      linkId: '', // Will be set by service
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      referrer: Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader,
      ...this.parseUserAgent(req.headers['user-agent'] || ''),
    };

    try {
      const { url } = await this.publicService.redirect(slug, clickData, password);
      return res.redirect(HttpStatus.MOVED_PERMANENTLY, url);
    } catch (error) {
      if (error instanceof Error && error.message === 'This link is password protected') {
        // Return a page or redirect to password entry
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'This link is password protected',
          requiresPassword: true,
          slug,
        });
      }
      throw error;
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
