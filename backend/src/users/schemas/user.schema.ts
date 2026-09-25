import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false, select: false })
  password?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: false, min: 18, default: 25 })
  age?: number;

  @Prop({ enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ trim: true })
  googleId?: string;

  @Prop({ trim: true })
  facebookId?: string;

  @Prop({ trim: true })
  avatar?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ select: false })
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual: fullName
UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});
