import { useEffect } from 'react';

/**
 * Fix 4.5: Dynamic page titles for SEO and tab identification.
 * Usage: usePageTitle('Campaigns') → sets document title to "Campaigns | Value chat"
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const base = 'Value chat';
    document.title = title ? `${title} | ${base}` : base;
    return () => { document.title = base; };
  }, [title]);
}
