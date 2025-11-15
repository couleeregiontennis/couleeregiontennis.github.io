const https = require('https');
const { URL } = require('url');

const DEFAULT_TIMEOUT = 5000;
const MAX_RETRIES = 3;
const USER_AGENT = 'CouleeRegionTennis/1.0 (+https://couleeregiontennis.com)';

/**
 * Resolves a potentially relative redirect URL against the base URL
 * @param {string} baseUrl - The original URL
 * @param {string} redirectUrl - The redirect URL from the response
 * @returns {string} - Resolved absolute URL
 */
function resolveRedirectUrl(baseUrl, redirectUrl) {
  try {
    return new URL(redirectUrl, baseUrl).href;
  } catch (e) {
    console.warn('Failed to resolve redirect URL, using as-is:', redirectUrl);
    return redirectUrl;
  }
}

/**
 * Fetches CSV data from a URL with retry logic and improved error handling
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Request timeout in milliseconds
 * @param {number} options.retries - Maximum number of retry attempts
 * @returns {Promise<string>} - CSV data as string
 */
async function fetchCSV(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES } = options;

  return new Promise((resolve, reject) => {
    const makeRequest = (attempt, currentUrl) => {
      console.log(`Fetching CSV from ${currentUrl} (attempt ${attempt}/${retries})`);

      const request = https.get(currentUrl, { 
        headers: { 
          'User-Agent': USER_AGENT,
          'Accept': 'text/csv,*/*;q=0.8'
        } 
      }, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = resolveRedirectUrl(currentUrl, response.headers.location);
          console.log(`Following ${response.statusCode} redirect to: ${redirectUrl}`);
          // Don't count redirects as retry attempts
          makeRequest(attempt, redirectUrl);
          return;
        }

        // Handle client errors (4xx)
        if (response.statusCode >= 400 && response.statusCode < 500) {
          reject(new Error(`HTTP Client Error: ${response.statusCode} - ${response.statusMessage}`));
          return;
        }

        // Handle server errors (5xx)
        if (response.statusCode >= 500) {
          const error = new Error(`HTTP Server Error: ${response.statusCode} - ${response.statusMessage}`);
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`Server error, retrying in ${delay}ms...`);
            setTimeout(() => makeRequest(attempt + 1, currentUrl), delay);
          } else {
            reject(error);
          }
          return;
        }

        // Handle successful response
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP Error: ${response.statusCode} - ${response.statusMessage}`));
          return;
        }

        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          // Verify we got CSV data
          const firstLine = data.split('\n')[0].trim();
          if (firstLine.startsWith('<') || firstLine.toLowerCase().startsWith('<!doctype')) {
            reject(new Error('Received HTML instead of CSV. The URL might be serving a web page instead of raw CSV data.'));
            return;
          }

          // Basic CSV validation - check for common CSV patterns
          if (!firstLine.includes(',') && !firstLine.includes(';')) {
            console.warn('Warning: Fetched data does not appear to be CSV format (no delimiters found)');
          }

          console.log(`Successfully fetched ${data.length} bytes of CSV data`);
          resolve(data);
        });
      });

      request.on('error', (error) => {
        console.error(`Connection error (attempt ${attempt}/${retries}):`, error.message);
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => makeRequest(attempt + 1, currentUrl), delay);
        } else {
          reject(new Error(`Failed to fetch CSV after ${retries} attempts: ${error.message}`));
        }
      });

      request.setTimeout(timeout, () => {
        request.destroy();
        const error = new Error(`Request timeout after ${timeout}ms`);
        console.error(`Timeout error (attempt ${attempt}/${retries}):`, error.message);
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => makeRequest(attempt + 1, currentUrl), delay);
        } else {
          reject(new Error(`Failed to fetch CSV after ${retries} attempts: ${error.message}`));
        }
      });
    };

    makeRequest(1, url);
  });
}

module.exports = { fetchCSV };
