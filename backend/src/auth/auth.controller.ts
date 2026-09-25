import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new customer account with email + password.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new customer account. Returns a JWT token on success.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully — returns { user, token }' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Authenticate with email + password.
   */
  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticates the user and returns a JWT Bearer token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful — returns { user, token }' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Verify email via token sent in confirmation email.
   */
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Resend email verification link.
   */
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link' })
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  // ── GOOGLE OAUTH 2.0 ROUTES ────────────────────────────────────────────────

  /**
   * Redirect browser to Google OAuth 2.0 Authorization screen.
   */
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth 2.0 Consent Screen' })
  googleAuth(@Res() res: Response) {
    const url = this.authService.getGoogleAuthUrl();
    return res.redirect(url);
  }

  /**
   * Google OAuth 2.0 Authorization Callback endpoint.
   */
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth 2.0 Callback' })
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    const redirectUrl = await this.authService.handleGoogleCallback(code);
    return res.redirect(redirectUrl);
  }

  // ── FACEBOOK OAUTH 2.0 ROUTES ──────────────────────────────────────────────

  /**
   * Redirect browser to Facebook OAuth 2.0 Authorization screen.
   */
  @Get('facebook')
  @ApiOperation({ summary: 'Redirect to Facebook OAuth 2.0 Consent Screen' })
  facebookAuth(@Res() res: Response) {
    const url = this.authService.getFacebookAuthUrl();
    return res.redirect(url);
  }

  /**
   * Facebook OAuth 2.0 Authorization Callback endpoint.
   */
  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook OAuth 2.0 Callback' })
  async facebookAuthCallback(@Query('code') code: string, @Res() res: Response) {
    const redirectUrl = await this.authService.handleFacebookCallback(code);
    return res.redirect(redirectUrl);
  }

  // ── DIRECT OAUTH API ───────────────────────────────────────────────────────

  @Post('oauth')
  @ApiOperation({
    summary: 'OAuth 2.0 Login / Signup (Google or Facebook API payload)',
    description: 'Authenticates or creates a verified user account via OAuth 2.0.',
  })
  oauthLogin(
    @Body() dto: {
      provider: 'google' | 'facebook';
      email: string;
      firstName: string;
      lastName: string;
      providerId?: string;
      avatar?: string;
    },
  ) {
    return this.authService.oauthLogin(dto);
  }

  /**
   * Returns the currently authenticated user's profile.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile of the authenticated user. Requires JWT token.',
  })
  @ApiResponse({ status: 200, description: 'Returns the current user object (password excluded)' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  getMe(@CurrentUser('_id') userId: string) {
    return this.authService.getMe(userId);
  }
}
