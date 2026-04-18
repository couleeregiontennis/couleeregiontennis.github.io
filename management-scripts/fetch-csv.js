const https = require('https');
const fs = require('fs');

async function fetchCSV(urlOrPath) {
  if (!urlOrPath.startsWith('http')) {
    return fs.promises.readFile(urlOrPath, 'utf8');
  }

  return new Promise((resolve, reject) => {
    const request = https.get(urlOrPath, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        console.log(`Following redirect to: ${response.headers.location}`);
        fetchCSV(response.headers.location)
          .then(resolve)
          .catch(reject);
        return;
      }

      // Handle successful response
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP Error: ${response.statusCode}`));
        return;
      }

      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        // Verify we got CSV data
        const firstLine = data.split('\n')[0];
        if (firstLine.startsWith('<')) {
          reject(new Error('Received HTML instead of CSV'));
          return;
        }
        
        resolve(data);
      });
    });

    request.on('error', (error) => {
      console.error('Connection error:', error);
      reject(error);
    });

    // Set timeout
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

module.exports = { fetchCSV };
