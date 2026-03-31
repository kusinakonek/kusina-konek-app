import { supabaseAdmin } from "@kusinakonek/database";
import { HttpError } from "../middlewares/errorHandler";

type UploadBucket = "chat-images" | "food-images" | "feedback-images";

export const uploadService = {
  async uploadImage(params: {
    base64Image: string;
    bucket: UploadBucket;
    userId: string;
  }): Promise<{ url: string }> {
    // Extract base64 data and mime type
    const matches = params.base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new HttpError(400, "Invalid image format. Expected base64 encoded image.");
    }

    const [, extension, base64Data] = matches;

    // Validate image extension
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    if (!allowedExtensions.includes(extension.toLowerCase())) {
      throw new HttpError(400, `Unsupported image type: ${extension}. Allowed types: ${allowedExtensions.join(", ")}`);
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (buffer.length > maxSize) {
      throw new HttpError(400, "Image size exceeds 5MB limit");
    }

    // Generate unique filename with timestamp
    const filename = `${params.userId}/${Date.now()}.${extension}`;
    const contentType = `image/${extension}`;

    let { data, error } = await supabaseAdmin.storage
      .from(params.bucket)
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      if (error.message.includes('Bucket not found') || error.message.includes('404')) {
        console.log(`[UploadService] Bucket '${params.bucket}' not found. Attempting to create it automatically...`);
        // Attempt to create bucket on-the-fly
        const createRes = await supabaseAdmin.storage.createBucket(params.bucket, { public: true });
        if (createRes.error) {
          throw new HttpError(500, `Failed to initialize missing bucket: ${createRes.error.message}`);
        }
        
        // Retry upload
        console.log(`[UploadService] Bucket created successfully. Retrying upload...`);
        const retry = await supabaseAdmin.storage.from(params.bucket).upload(filename, buffer, {
          contentType,
          upsert: false,
        });

        if (retry.error) {
           throw new HttpError(500, `Failed to upload image after bucket creation: ${retry.error.message}`);
        }
        data = retry.data;
      } else {
        console.error("Supabase upload error:", error);
        throw new HttpError(500, `Failed to upload image: ${error.message}`);
      }
    }

    if (!data) {
      throw new HttpError(500, "Upload succeeded but no data was returned");
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(params.bucket)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      throw new HttpError(500, "Failed to generate public URL for uploaded image");
    }

    return { url: urlData.publicUrl };
  },

  async deleteImage(params: { bucket: UploadBucket; filePath: string }): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(params.bucket)
      .remove([params.filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new HttpError(500, `Failed to delete image: ${error.message}`);
    }
  },
};
