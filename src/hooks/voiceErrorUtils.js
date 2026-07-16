export const getActionableErrorMessage = (err, statusCode) => {
  const raw = err?.message || 'Unknown error';

  // "Load failed" is the generic error Safari/Chrome throws when a fetch is
  // blocked by CORS, has an invalid URL, or otherwise fails before a response.
  if (
    raw === 'Load failed' ||
    raw.includes('Load failed') ||
    raw.includes('Failed to fetch') ||
    raw.includes('NetworkError') ||
    raw.includes('Network request failed') ||
    raw.includes('CORS') ||
    raw.includes('cross-origin')
  ) {
    return 'Network error: Could not reach the score parsing service. Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.';
  }

  if (statusCode === 401 || raw.toLowerCase().includes('unauthenticated') || raw.toLowerCase().includes('not authenticated')) {
    return 'Your session has expired. Please log in again to use voice scoring.';
  }

  if (statusCode === 500) {
    return 'Server error: The score parsing service failed. Please try again later.';
  }

  if (statusCode === 400) {
    return 'Invalid request: ' + raw;
  }

  return 'Error parsing score with AI: ' + raw;
};
