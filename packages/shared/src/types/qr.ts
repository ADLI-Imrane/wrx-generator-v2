// QR Code types

export type QRCodeType = 'url' | 'vcard' | 'wifi' | 'text' | 'email' | 'phone' | 'sms';
export type QRStyle = 'squares' | 'dots' | 'rounded';
export type QRFormat = 'png' | 'svg' | 'jpeg' | 'pdf';

export interface QRStyleConfig {
  foregroundColor?: string;
  backgroundColor?: string;
  style?: QRStyle;
  logoUrl?: string;
  logoSize?: number;
  margin?: number;
  cornerRadius?: number;
}

export interface QRCode {
  id: string;
  userId: string;
  linkId?: string;
  type: QRCodeType;
  title?: string;
  content: string;
  imageUrl?: string;
  style?: QRStyleConfig;
  scans?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQRCodeDto {
  type: QRCodeType;
  title?: string;
  content: string;
  linkId?: string;
  style?: QRStyleConfig;
}

export interface UpdateQRCodeDto {
  title?: string;
  content?: string;
  style?: QRStyleConfig;
}

export interface GenerateQRDto {
  linkId: string;
  style?: Partial<QRStyleConfig>;
  format?: QRFormat;
  size?: number;
}

export interface QRCodeResponse {
  id: string;
  url: string;
  downloadUrl: string;
}
