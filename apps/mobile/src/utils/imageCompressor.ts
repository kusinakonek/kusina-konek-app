import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Maximum image size in bytes (5 MB)
 */
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Estimate the byte size of a base64 string.
 * Base64 encodes 3 bytes into 4 characters, so:
 *   byteSize ≈ (base64Length * 3) / 4
 */
function estimateBase64SizeInBytes(base64: string): number {
    // Remove data URI prefix if present
    const raw = base64.includes(',') ? base64.split(',')[1] : base64;
    const padding = (raw.match(/=+$/) || [''])[0].length;
    return Math.floor((raw.length * 3) / 4) - padding;
}

/**
 * Compress an image to ensure it is within the 5 MB limit.
 *
 * Strategy:
 *   1. If the image is already ≤ 5 MB, return it as-is.
 *   2. Otherwise, iteratively reduce quality and/or resize until it fits.
 *
 * @param imageUri - The source URI of the image (file:// or data: URI)
 * @returns A base64 data URI (`data:image/jpeg;base64,...`) that is ≤ 5 MB
 */
export async function compressImageTo5MB(imageUri: string): Promise<string> {
    // Step 1: Try compressing at progressively lower quality levels
    const qualitySteps = [0.8, 0.6, 0.4, 0.3, 0.2, 0.1];
    // Max dimension steps for resizing if quality alone doesn't suffice
    const maxDimensionSteps = [1920, 1280, 1024, 800, 640];

    // First check: does the original (at quality 0.8) already fit?
    for (const quality of qualitySteps) {
        try {
            const result = await ImageManipulator.manipulateAsync(
                imageUri,
                [], // no resize yet
                { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            if (result.base64) {
                const sizeBytes = estimateBase64SizeInBytes(result.base64);
                if (sizeBytes <= MAX_IMAGE_SIZE_BYTES) {
                    return `data:image/jpeg;base64,${result.base64}`;
                }
            }
        } catch (error) {
            console.warn(`[imageCompressor] Quality ${quality} failed:`, error);
        }
    }

    // Step 2: Quality alone wasn't enough — resize + compress
    for (const maxDim of maxDimensionSteps) {
        for (const quality of [0.5, 0.3, 0.2, 0.1]) {
            try {
                const result = await ImageManipulator.manipulateAsync(
                    imageUri,
                    [{ resize: { width: maxDim } }],
                    { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );

                if (result.base64) {
                    const sizeBytes = estimateBase64SizeInBytes(result.base64);
                    if (sizeBytes <= MAX_IMAGE_SIZE_BYTES) {
                        return `data:image/jpeg;base64,${result.base64}`;
                    }
                }
            } catch (error) {
                console.warn(`[imageCompressor] Resize ${maxDim}px @ quality ${quality} failed:`, error);
            }
        }
    }

    // Fallback: aggressively compress as last resort
    try {
        const result = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 480 } }],
            { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (result.base64) {
            return `data:image/jpeg;base64,${result.base64}`;
        }
    } catch (error) {
        console.error('[imageCompressor] Final fallback compression failed:', error);
    }

    // If everything fails, return the original URI
    throw new Error('Unable to compress image below 5 MB. Please try a smaller image.');
}
