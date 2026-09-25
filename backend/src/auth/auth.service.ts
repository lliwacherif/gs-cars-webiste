import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Adresse e-mail déjà enregistrée');

    const hashed = await bcrypt.hash(dto.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.userModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashed,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send email verification
    const mailRes = await this.mailService.sendVerificationEmail(
      user.email,
      user.firstName,
      user.lastName,
      verificationToken,
    );

    return {
      requiresVerification: true,
      email: user.email,
      token: verificationToken,
      previewUrl: mailRes.previewUrl,
      verifyLink: mailRes.verifyLink,
      message: `Un e-mail de confirmation vous a été envoyé à ${user.email}. Veuillez vérifier votre boîte de réception.`,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password');
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    if (!user.password) {
      throw new UnauthorizedException('Ce compte utilise la connexion Google ou Facebook. Veuillez vous connecter avec Google ou Facebook.');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Veuillez vérifier votre adresse email avant de vous connecter. Un e-mail de confirmation vous a été envoyé.'
      );
    }

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Jeton de vérification manquant.');

    const user = await this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Le lien de vérification est invalide ou a expiré.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const jwtToken = this.signToken(user);
    return {
      message: 'Adresse email vérifiée avec succès !',
      user: this.sanitize(user),
      token: jwtToken,
    };
  }

  async resendVerification(email: string) {
    if (!email) throw new BadRequestException('Adresse email manquante.');
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) throw new BadRequestException('Utilisateur introuvable.');

    if (user.isEmailVerified) {
      return { message: 'Votre adresse e-mail est déjà vérifiée.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    const mailRes = await this.mailService.sendVerificationEmail(
      user.email,
      user.firstName,
      user.lastName,
      verificationToken,
    );

    return {
      message: 'Un nouvel e-mail de vérification a été envoyé !',
      previewUrl: mailRes.previewUrl,
      verifyLink: mailRes.verifyLink,
    };
  }

  // ── GOOGLE OAUTH 2.0 FLOW ───────────────────────────────────────────────────

  /**
   * Step 1: Authorization Request — Generate Google OAuth consent URL.
   */
  getGoogleAuthUrl(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      throw new BadRequestException('Google OAuth 2.0 is not configured in backend/.env. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Step 2 & 3: Callback, Token Exchange & Profile Fetch — Google OAuth 2.0 code exchange.
   */
  async handleGoogleCallback(code: string): Promise<string> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/api/auth/google/callback';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    if (!code) {
      return `${frontendUrl}?oauth_error=${encodeURIComponent('Authorization code missing')}`;
    }

    try {
      // 1. Token Exchange: Exchange authorization code for access_token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId || '',
          client_secret: clientSecret || '',
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('Google token exchange error:', tokenData);
        return `${frontendUrl}?oauth_error=${encodeURIComponent(tokenData.error_description || 'Google token exchange failed')}`;
      }

      // 2. Fetch User Profile from Google UserInfo endpoint
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile = await profileRes.json();
      if (!profileRes.ok || !profile.email) {
        return `${frontendUrl}?oauth_error=${encodeURIComponent('Failed to retrieve email profile from Google')}`;
      }

      // 3. Find or Create User in Database
      const user = await this.upsertOAuthUser({
        provider: 'google',
        providerId: profile.sub,
        email: profile.email,
        firstName: profile.given_name || profile.name?.split(' ')[0] || 'Client',
        lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'Google',
        avatar: profile.picture,
      });

      // 4. Sign JWT Token and redirect back to frontend
      const jwtToken = this.signToken(user);
      return `${frontendUrl}?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify(this.sanitize(user)))}`;

    } catch (err: any) {
      console.error('Google OAuth Error:', err);
      return `${frontendUrl}?oauth_error=${encodeURIComponent(err.message || 'Google OAuth authentication failed')}`;
    }
  }

  // ── FACEBOOK OAUTH 2.0 FLOW ─────────────────────────────────────────────────

  /**
   * Step 1: Authorization Request — Generate Facebook OAuth consent URL.
   */
  getFacebookAuthUrl(): string {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const callbackUrl = this.configService.get<string>('FACEBOOK_CALLBACK_URL') || 'http://localhost:3000/api/auth/facebook/callback';

    if (!appId || appId.includes('YOUR_FACEBOOK_APP_ID')) {
      throw new BadRequestException('Facebook OAuth 2.0 is not configured in backend/.env. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.');
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      scope: 'email,public_profile',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Step 2 & 3: Callback, Token Exchange & Profile Fetch — Facebook OAuth 2.0 code exchange.
   */
  async handleFacebookCallback(code: string): Promise<string> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    const callbackUrl = this.configService.get<string>('FACEBOOK_CALLBACK_URL') || 'http://localhost:3000/api/auth/facebook/callback';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    if (!code) {
      return `${frontendUrl}?oauth_error=${encodeURIComponent('Authorization code missing')}`;
    }

    try {
      // 1. Token Exchange: Exchange authorization code for Facebook access_token
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
        client_id: appId || '',
        client_secret: appSecret || '',
        redirect_uri: callbackUrl,
        code,
      }).toString();

      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('Facebook token exchange error:', tokenData);
        return `${frontendUrl}?oauth_error=${encodeURIComponent(tokenData.error?.message || 'Facebook token exchange failed')}`;
      }

      // 2. Fetch Profile from Facebook Graph API
      const profileUrl = `https://graph.facebook.com/me?` + new URLSearchParams({
        fields: 'id,first_name,last_name,email,picture.type(large)',
        access_token: tokenData.access_token,
      }).toString();

      const profileRes = await fetch(profileUrl);
      const profile = await profileRes.json();

      if (!profileRes.ok) {
        return `${frontendUrl}?oauth_error=${encodeURIComponent(profile.error?.message || 'Failed to retrieve Facebook user profile')}`;
      }

      const email = profile.email || `${profile.id}@facebook.user`;

      // 3. Find or Create User in Database
      const user = await this.upsertOAuthUser({
        provider: 'facebook',
        providerId: profile.id,
        email,
        firstName: profile.first_name || 'Client',
        lastName: profile.last_name || 'Facebook',
        avatar: profile.picture?.data?.url,
      });

      // 4. Sign JWT Token and redirect back to frontend
      const jwtToken = this.signToken(user);
      return `${frontendUrl}?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify(this.sanitize(user)))}`;

    } catch (err: any) {
      console.error('Facebook OAuth Error:', err);
      return `${frontendUrl}?oauth_error=${encodeURIComponent(err.message || 'Facebook OAuth authentication failed')}`;
    }
  }

  // ── Direct OAuth Payload Verification ───────────────────────────────────────

  async oauthLogin(dto: {
    provider: 'google' | 'facebook';
    email: string;
    firstName: string;
    lastName: string;
    providerId?: string;
    avatar?: string;
  }) {
    if (!dto.email) {
      throw new BadRequestException('Email address is required for OAuth login');
    }

    const user = await this.upsertOAuthUser({
      provider: dto.provider,
      providerId: dto.providerId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatar: dto.avatar,
    });

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  // ── Database Helper ─────────────────────────────────────────────────────────

  private async upsertOAuthUser(data: {
    provider: 'google' | 'facebook';
    providerId?: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<UserDocument> {
    const cleanEmail = data.email.toLowerCase().trim();
    let user = await this.userModel.findOne({ email: cleanEmail });

    if (user) {
      let modified = false;
      if (data.provider === 'google' && !user.googleId) {
        user.googleId = data.providerId;
        modified = true;
      } else if (data.provider === 'facebook' && !user.facebookId) {
        user.facebookId = data.providerId;
        modified = true;
      }
      if (data.avatar && !user.avatar) {
        user.avatar = data.avatar;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) await user.save();
    } else {
      user = await this.userModel.create({
        email: cleanEmail,
        firstName: data.firstName || 'Client',
        lastName: data.lastName || (data.provider === 'google' ? 'Google' : 'Facebook'),
        role: UserRole.CUSTOMER,
        googleId: data.provider === 'google' ? data.providerId : undefined,
        facebookId: data.provider === 'facebook' ? data.providerId : undefined,
        avatar: data.avatar,
        isEmailVerified: true,
        age: 25,
      });
    }
    return user;
  }

  private signToken(user: UserDocument): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  }

  private sanitize(user: UserDocument) {
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }
}
