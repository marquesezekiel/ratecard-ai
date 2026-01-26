export async function initAxe() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    try {
      // Note: @axe-core/react has compatibility issues with React 19 ESM modules
      // The library attempts to modify React's createElement which is read-only in ESM
      // For now, we catch the error gracefully. Use browser DevTools Lighthouse
      // accessibility audits as an alternative.
      const React = await import('react');
      const ReactDOM = await import('react-dom');
      const axe = await import('@axe-core/react');

      axe.default(React, ReactDOM, 1000);
    } catch (error) {
      // Silently fail - axe-core doesn't support React 19 ESM modules yet
      // Use Lighthouse accessibility audits in Chrome DevTools instead
      console.info(
        '[axe-dev] Accessibility testing via axe-core is not available with React 19. ' +
        'Use Chrome DevTools Lighthouse for accessibility audits.'
      );
    }
  }
}
