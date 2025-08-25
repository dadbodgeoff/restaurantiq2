import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export class PasswordService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    console.log('🔐 Password verification:', {
      password: password.substring(0, 3) + '***',
      hash: hash.substring(0, 10) + '***',
      hashLength: hash.length
    });
    
    const result = await bcrypt.compare(password, hash);
    console.log('🔐 Password verification result:', result);
    
    return result;
  }

  validatePasswordStrength(password: string): boolean {
    // Minimum 8 chars, uppercase, lowercase, number, special char
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  }

  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
