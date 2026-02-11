import { Dimensions, PixelRatio, Platform } from 'react-native';

// Base design dimensions (iPhone 14 / standard phone)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Scale a size value proportionally based on screen width.
 * Useful for widths, margins, paddings, border radii.
 */
export const wp = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale a size value proportionally based on screen height.
 * Useful for vertical spacing, heights.
 */
export const hp = (size: number): number => {
    const scale = SCREEN_HEIGHT / BASE_HEIGHT;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale font size with moderate scaling to prevent text from being too large on tablets.
 */
export const fp = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * Math.min(scale, 1.3); // Cap at 1.3x for tablets
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Screen width percentage helper.
 * Usage: widthPercent(50) => 50% of screen width
 */
export const widthPercent = (percent: number): number => {
    return Math.round((SCREEN_WIDTH * percent) / 100);
};

/**
 * Screen height percentage helper.
 * Usage: heightPercent(50) => 50% of screen height
 */
export const heightPercent = (percent: number): number => {
    return Math.round((SCREEN_HEIGHT * percent) / 100);
};

/**
 * Breakpoint flags
 */
export const isSmallPhone = SCREEN_WIDTH < 360;
export const isPhone = SCREEN_WIDTH < 600;
export const isTablet = SCREEN_WIDTH >= 600;
export const isLargeTablet = SCREEN_WIDTH >= 900;

/**
 * Get current screen dimensions (for use in hooks/dynamic contexts)
 */
export const getScreenDimensions = () => Dimensions.get('window');

export { SCREEN_WIDTH, SCREEN_HEIGHT };
