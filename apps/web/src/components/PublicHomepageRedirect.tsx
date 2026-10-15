import { useEffect } from 'react';

/** The public homepage is a separate prerendered entry: leave the app with a full load. */
export function PublicHomepageRedirect() {
  useEffect(() => {
    window.location.assign('/');
  }, []);
  return null;
}
