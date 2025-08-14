import { getSessionState } from './songQueue.js';
import { cloudConnector } from './cloudConnector.js';

/**
 * Resolve ticker template variables into a final display string.
 * Supported variables:
 *  - $ROTATION_NEXT_3: Next three singers from the queue, comma separated
 *  - $TIP_URL: Tip URL for the current session if available
 */
export function resolveTickerTemplate(template: string): string {
  if (!template || typeof template !== 'string') return '';

  let result = template;

  try {
    const state = getSessionState();
    const nextThree = (state.queue || [])
      .slice(0, 3)
      .map((q) => q.singerName)
      .join(', ');

    // Compute TIP URL
    const status = cloudConnector.getStatus?.();
    const base = process.env.TIP_BASE_URL || 'https://tips.kjnomad.com';
    const tipUrl = status?.sessionId ? `${base}/${status.sessionId}` : (process.env.TIP_URL || '');

    result = result.replaceAll('$ROTATION_NEXT_3', nextThree);
    result = result.replaceAll('$TIP_URL', tipUrl);
  } catch {
    // Fall back to returning the original template on error
    return template;
  }

  return result;
}


