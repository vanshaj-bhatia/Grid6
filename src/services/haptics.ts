/**
 * Haptic feedback utility using the HTML5 Vibration API.
 * Provides physical tactile feedback on supported touch devices (especially Android Chrome/Firefox/PWA).
 */

export const triggerHaptic = (pattern: number | number[] = 40): boolean => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
};

/** Quick crisp 35ms pulse for button taps such as Process, Reprocess, and Retry */
export const hapticTap = (): boolean => triggerHaptic(35);

/** Double tactile pulse [40, 30, 50] for confirming file save actions */
export const hapticSave = (): boolean => triggerHaptic([40, 30, 50]);
