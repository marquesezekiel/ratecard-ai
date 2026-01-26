export async function initAxe() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const axe = await import('@axe-core/react');

    axe.default(React, ReactDOM, 1000);
  }
}
