import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);

  if (!isPasswordValid) {
    throw new BadRequestException(
      'Invalid credentials'
    );
  }

  return true;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function encryptText(plainText: string, secretKey: string): string {
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

export function decryptText(encryptedText: string, secretKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
