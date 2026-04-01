import { resetAllTutorials } from '../components/TutorialOverlay';

/**
 * Utility function to reset all tutorials for testing purposes.
 * Call this from anywhere in your app to reset all tutorial progress.
 * 
 * Usage:
 * import { resetAllTutorialsForTesting } from '@/utils/tutorialReset';
 * await resetAllTutorialsForTesting();
 */
export async function resetAllTutorialsForTesting(): Promise<void> {
    await resetAllTutorials();
    console.log('✅ All tutorials have been reset! Close and reopen the app to see them again.');
}

// For debugging: call this in your terminal or add a secret button
if (__DEV__) {
    (global as any).resetTutorials = resetAllTutorialsForTesting;
}
