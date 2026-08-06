import { Readable } from 'node:stream';
import { google, type drive_v3 } from 'googleapis';
import { SHEETS_PRIVATE_KEY, SHEETS_SERVICE_ACCOUNT_EMAIL } from '@/lib/sheets/config';

let cachedClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (cachedClient) return cachedClient;
  if (!SHEETS_SERVICE_ACCOUNT_EMAIL || !SHEETS_PRIVATE_KEY) {
    throw new Error(
      'Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY — không thể kết nối Google Drive.',
    );
  }
  const auth = new google.auth.JWT({
    email: SHEETS_SERVICE_ACCOUNT_EMAIL,
    key: SHEETS_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  cachedClient = google.drive({ version: 'v3', auth });
  return cachedClient;
}

function getUploadFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!id) throw new Error('Thiếu GOOGLE_DRIVE_FOLDER_ID — không thể upload file lên Google Drive.');
  return id;
}

export interface DriveUploadResult {
  fileId: string;
  url: string;
}

/**
 * Upload một file (Buffer) vào folder Drive cố định, set quyền đọc công khai qua link,
 * trả về URL xem trực tiếp (`uc?export=view&id=...`) — dùng thay cho đường dẫn đĩa VPS.
 */
export async function uploadFileToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder?: string,
): Promise<DriveUploadResult> {
  const drive = getDriveClient();
  const parentId = getUploadFolderId();

  const res = await drive.files.create({
    requestBody: {
      name: folder ? `${folder.replace(/\//g, '_')}__${filename}` : filename,
      parents: [parentId],
    },
    media: {
      mimeType,
      body: bufferToStream(buffer),
    },
    fields: 'id',
  });

  const fileId = res.data.id;
  if (!fileId) throw new Error('Google Drive không trả về file id sau khi upload');

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return { fileId, url: `https://drive.google.com/uc?export=view&id=${fileId}` };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}

function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {
  return Readable.from(buffer);
}
