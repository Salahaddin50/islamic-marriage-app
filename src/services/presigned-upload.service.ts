import AWS from '../../aws-config';

export class PresignedUploadService {
  private static spacesEndpoint = new AWS.Endpoint(process.env.EXPO_PUBLIC_DO_SPACES_ENDPOINT || '');
  private static s3 = new AWS.S3({
    endpoint: this.spacesEndpoint,
    accessKeyId: process.env.EXPO_PUBLIC_DO_SPACES_KEY,
    secretAccessKey: process.env.EXPO_PUBLIC_DO_SPACES_SECRET,
    region: process.env.EXPO_PUBLIC_DO_SPACES_REGION || 'lon1',
    s3ForcePathStyle: false,
    signatureVersion: 'v4'
  });

  /**
   * Generate presigned URL for direct upload (bypasses CORS)
   */
  static async generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: {
      uploadUrl: string;
      fileUrl: string;
      cdnUrl: string;
      key: string;
    };
    error?: string;
  }> {
    try {
      const spaceName = process.env.EXPO_PUBLIC_DO_SPACES_NAME || '';
      const cdnUrl = process.env.EXPO_PUBLIC_DO_SPACES_CDN || '';
      
      // Generate file key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = this.getFileExtension(fileType);
      const key = `users/${userId}/photos/${timestamp}-${random}.${extension}`;

      // Generate presigned URL for PUT operation
      const uploadUrl = this.s3.getSignedUrl('putObject', {
        Bucket: spaceName,
        Key: key,
        ContentType: fileType,
        Expires: 300, // 5 minutes
        ACL: 'private'
      });

      const fileUrl = `${process.env.EXPO_PUBLIC_DO_SPACES_ENDPOINT}/${spaceName}/${key}`;
      const fileCdnUrl = `${cdnUrl}/${key}`;

      return {
        success: true,
        data: {
          uploadUrl,
          fileUrl,
          cdnUrl: fileCdnUrl,
          key
        }
      };
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload URL'
      };
    }
  }

  /**
   * Upload file using presigned URL (bypasses CORS issues)
   */
  static async uploadWithPresignedUrl(
    file: File | Blob,
    uploadUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Presigned upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  private static getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov'
    };
    
    return extensions[mimeType] || 'bin';
  }
}
