// QR Code types

export type QRStyle = 'squares' | 'dots' | 'rounded';
export type QRFormat = 'png' | 'svg' | 'jpeg';

export interface QRStyleConfig {
  color: string;
  background: string;
  style: QRStyle;
  logoUrl?: string;
  logoSize?: number;
  margin?: number;
}

export interface QRCode {
  id: string;
  linkId: string;
  logoUrl?: string;
  styleConfig: QRStyleConfig;
  createdAt: string;
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
