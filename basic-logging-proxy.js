// This file creates an HTTPS proxy server that:
// Logs all requests and responses
// Converts hostname format (dashes to dots)
// Intercepts and displays HTML content

const https = require("https");
const fs = require("fs");
const express = require("express");
const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Basic Logging Proxy Server
 * - Logs all requests and responses
 * - Converts hostname format (dashes to dots)
 * - Intercepts and displays HTML content
 */

const replaceAll = (str, match, replacement) => {
  return str.replace(new RegExp('\\b' + match + '\\b', 'g'), () => replacement);
};

// Express app setup
const app = express();

// SSL certificate configuration
const sslOptions = {
  key: fs.readFileSync('./ssl/privkey.pem'),
  cert: fs.readFileSync('./ssl/fullchain.pem'),
};

// Hostname transformation patterns
const HOSTNAME_PATTERNS = ['--', '-'];
const HOSTNAME_REPLACEMENTS = ['-', '.'];

// Custom router for hostname transformation
const hostnameRouter = (req, res) => {
  let targetHost = req.hostname;
  console.log("Original hostname:", targetHost);
  
  const dotIndex = targetHost.indexOf(".");
  let targetUrl = "https://" + targetHost.substring(0, dotIndex);
  
  // Apply hostname transformations
  for (let i = HOSTNAME_PATTERNS.length - 1; i >= 0; i--) {
    targetUrl = replaceAll(targetUrl, HOSTNAME_PATTERNS[i], HOSTNAME_REPLACEMENTS[i]);
  }
  
  req.target = targetUrl;
  console.log("Target URL:", targetUrl);
  return targetUrl;
};

// Request logging function
const logRequestData = (proxyReq, req, res) => {
  const requestHeaders = { ...req.headers };
  requestHeaders.host = '';
  
  const requestData = {
    referer: proxyReq.referer,
    headers: requestHeaders,
    method: proxyReq.method,
    url: proxyReq.url,
    httpVersion: proxyReq.httpVersion,
    body: proxyReq.body,
    cookies: proxyReq.cookies,
    path: proxyReq.path,
    protocol: proxyReq.protocol,
    query: proxyReq.query,
    host: proxyReq.host,
    ip: proxyReq.ip,
    originalUrl: proxyReq.originalUrl,
    params: proxyReq.params,
  };

  const requestDataString = JSON.stringify(requestData);
  
  // Security check
  if (requestDataString.includes('pyther.com')) {
    console.error("SECURITY WARNING: Request contains 'pyther.com':", requestDataString);
  }
  
  console.log("Request Data:", requestDataString);
};

// Response interceptor for HTML content
const createResponseInterceptor = () => {
  return (proxyRes, req, res) => {
    let responseBody = '';
    
    proxyRes.on('data', chunk => {
      responseBody += chunk;
    });

    proxyRes.on('end', () => {
      const contentType = proxyRes.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        console.log("=== HTML Content ===");
        console.log(responseBody);
        console.log("==================");
      }
    });
  };
};

// Accept-encoding header handler
const normalizeAcceptEncoding = (req) => {
  let encoding = req.headers['accept-encoding'];
  if (encoding === "gzip, deflate, br, zstd") {
    encoding = "gzip, deflate, br";
  }
  return encoding || "gzip, deflate, br";
};

// Proxy configuration
const proxyConfig = {
  ws: true,
  target: 'https://www.pyther.com',
  router: hostnameRouter,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Normalize accept-encoding header
    if (req.headers['accept-encoding']) {
      req.headers['accept-encoding'] = normalizeAcceptEncoding(req);
    }
    
    // Log request data
    logRequestData(proxyReq, req, res);
  },
  selfHandleResponse: true,
  onProxyRes: createResponseInterceptor(),
  proxyTimeout: 3000,
  headers: { "Connection": "keep-alive" },
};

// Apply proxy middleware
app.use('/', createProxyMiddleware(proxyConfig));

// Start HTTPS server
https.createServer(sslOptions, app)
  .listen(443, () => {
    console.log('Basic Logging Proxy Server running on port 443 (HTTPS)');
  }); 