import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized using ${host || 'smtp.gmail.com'}`);
    }
  }

  async sendVerificationEmail(email: string, firstName: string, lastName: string, token: string): Promise<{ previewUrl?: string; verifyLink: string }> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;
    const from = this.configService.get<string>('SMTP_FROM') || '"Tunisia Car Rental" <noreply@tunisiacarrental.tn>';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vérification de votre compte</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0f; color: #e5e7eb; margin: 0; padding: 40px 12px; }
        .container { max-width: 580px; margin: 0 auto; background: #16161a; border: 1px solid #2a2a32; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .header { background: #111115; border-bottom: 1px solid #2a2a32; padding: 28px 32px; text-align: center; }
        .logo { font-size: 20px; font-weight: 800; color: #d4a017; letter-spacing: 0.5px; text-decoration: none; }
        .content { padding: 36px 32px; }
        h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
        p { font-size: 14.5px; line-height: 1.6; color: #a1a1aa; margin-bottom: 20px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: #d4a017; color: #0d0d0f; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none; transition: background 0.2s; box-shadow: 0 4px 14px rgba(212, 160, 23, 0.3); }
        .note { font-size: 12.5px; color: #71717a; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 28px; }
        .link-text { font-size: 12px; color: #d4a017; word-break: break-all; }
        .footer { background: #111115; padding: 20px 32px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid #2a2a32; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚘 TUNISIA CAR RENTAL</div>
        </div>
        <div class="content">
          <h1>Bienvenue, ${firstName} ${lastName} ! 👋</h1>
          <p>Merci d'avoir créé votre compte sur <strong>Tunisia Car Rental</strong>, votre service privilégié de location de voitures en Tunisie.</p>
          <p>Pour activer votre compte et commencer à réserver des véhicules d'exception en toute sérénité, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
          
          <div class="btn-wrapper">
            <a href="${verifyLink}" target="_blank" class="btn">Confirmer mon adresse e-mail</a>
          </div>

          <p>Ce lien de vérification reste valide pendant <strong>24 heures</strong>.</p>

          <div class="note">
            <p style="margin-bottom: 6px;">Si le bouton ci-dessus ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
            <a href="${verifyLink}" class="link-text">${verifyLink}</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Tunisia Car Rental. Tous droits réservés.
        </div>
      </div>
    </body>
    </html>
    `;

    let previewUrl: string | undefined = undefined;
    let activeTransporter = this.transporter;

    if (!activeTransporter) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        activeTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      } catch (e) {
        activeTransporter = nodemailer.createTransport({ jsonTransport: true });
      }
    }

    try {
      const info = await activeTransporter.sendMail({
        from,
        to: email,
        subject: '🔐 Confirmez votre adresse e-mail — Tunisia Car Rental',
        html: htmlContent,
      });

      const etherealUrl = nodemailer.getTestMessageUrl(info);
      if (etherealUrl) {
        previewUrl = etherealUrl.toString();
      }

      this.logger.log(`================================================================`);
      this.logger.log(`📧 EMAIL VERIFICATION SENT TO: ${email}`);
      this.logger.log(`🔗 VERIFY LINK: ${verifyLink}`);
      if (previewUrl) {
        this.logger.log(`👁️ ETHEREAL LIVE EMAIL PREVIEW: ${previewUrl}`);
      }
      this.logger.log(`================================================================`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${email}:`, err);
    }

    return { previewUrl, verifyLink };
  }

  async sendReservationApproval(
    email: string,
    firstName: string,
    reservationCode: string,
    carName: string,
    requiredDepositPct: number,
    requiredDepositAmount: number
  ): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM') || '"Tunisia Car Rental" <noreply@tunisiacarrental.tn>';
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0d0f; color: #e5e7eb; margin: 0; padding: 40px 12px; }
        .container { max-width: 580px; margin: 0 auto; background: #16161a; border: 1px solid #2a2a32; border-radius: 16px; padding: 32px; }
        .header { font-size: 20px; font-weight: 800; color: #d4a017; margin-bottom: 20px; text-align: center; }
        .box { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 10px; padding: 16px; margin: 20px 0; text-align: center; }
        .code { font-size: 22px; font-weight: 800; color: #4ade80; letter-spacing: 1px; }
        .highlight { color: #d4a017; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">🚘 TUNISIA CAR RENTAL</div>
        <h2>Bonne nouvelle, ${firstName} ! 🎉</h2>
        <p>Votre réservation pour le véhicule <strong>${carName}</strong> a été <strong>approuvée par notre équipe</strong>.</p>
        
        <div class="box">
          <div style="font-size: 13px; color: #a1a1aa;">Code de Réservation</div>
          <div class="code">#TCR-${reservationCode.slice(-6).toUpperCase()}</div>
        </div>

        <p>Pour valider définitivement votre réservation, veuillez vous présenter dans l'une de nos agences muni(e) de votre code de réservation et verser l'acompte requis :</p>
        
        <ul style="line-height: 1.8; color: #d1d5db;">
          <li>Acompte requis : <span class="highlight">${requiredDepositPct}%</span></li>
          <li>Montant à verser en agence : <span class="highlight">${requiredDepositAmount} TND</span></li>
        </ul>

        <p style="font-size: 13px; color: #9ca3af; margin-top: 24px;">À bientôt,<br>L'équipe Tunisia Car Rental</p>
      </div>
    </body>
    </html>
    `;

    let activeTransporter = this.transporter;
    if (!activeTransporter) {
      activeTransporter = nodemailer.createTransport({ jsonTransport: true });
    }

    try {
      await activeTransporter.sendMail({
        from,
        to: email,
        subject: `✅ Réservation Approuvée ! Code #TCR-${reservationCode.slice(-6).toUpperCase()}`,
        html: htmlContent,
      });
      this.logger.log(`📧 APPROVAL EMAIL SENT TO: ${email} for Reservation ${reservationCode}`);
    } catch (err) {
      this.logger.error(`Failed to send approval email to ${email}:`, err);
    }
  }
}
