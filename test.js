const axios = require("axios");
const https = require('https');

(async ()=>{
    try {
        const response = await axios.get('https://api.tgju.org/v1/market/indicator/summary-table-data/geram18?length=1', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.tgju.org/',
              'Connection': 'keep-alive',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-site',
              'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"Windows"',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            httpsAgent: new https.Agent({
              rejectUnauthorized: true
            }),
            proxy: false,
            decompress: true, // Ensure automatic decompression
            timeout: 10000,
            maxRedirects: 5
          });
          console.log('Status:', response.status);
          console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Headers:', error.response.headers);
            console.error('Response Data:', error.response.data);
        }
    }
})();