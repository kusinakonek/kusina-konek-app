import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Fast-compress an image so it takes minimal time and minimal network payload.
 *
 * Strategy:
 *   1. Instantly target a mobile-feed standard (640px) and 0.5 quality.
 *   2. Base64 encode it in the same pass.
 *   (This guarantees visual clarity while drastically shrinking payload sizes to ~30-50KB).
 */
export async function compressImageFast(imageUri: string): Promise<string> {
    try {
        // We do a single, rapid pass: crop width to 640px, set quality to 30-50%.
        const result = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 640 } }],
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (result.base64) {
            return `data:image/jpeg;base64,${result.base64}`;
        }
        throw new Error('No base64 returned from image compression.');
    } catch (error) {
        console.warn(`[imageCompressor] Fast compression failed, trying aggressive fallback:`, error);

        // Fallback: aggressively compress as last resort
        const fallback = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 480 } }],
            { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (fallback.base64) {
            return `data:image/jpeg;base64,${fallback.base64}`;
        }

        throw new Error('Unable to compress image. Please try a smaller image.');
    }
}
