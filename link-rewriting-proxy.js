// This file creates the most advanced proxy server that:
// Rewrites URLs in anchor tags to use proxy domain
// Converts external links to internal proxy format
// Handles hostname transformation

const https = require("https");
const fs = require("fs");
const express = require("express");
const { createProxyMiddleware, responseInterceptor } = require("http-proxy-middleware");

/**
 * Link Rewriting Proxy Server
 * - Rewrites URLs in anchor tags to use proxy domain
 * - Converts external links to internal proxy format
 * - Handles hostname transformation
 */

const replaceAll = (str, match, replacement) => {
  return str.replace(new RegExp("\\b" + match + "\\b", "g"), () => replacement);
};

// Express app setup
const app = express();

// SSL certificate configuration
const sslOptions = {
  key: fs.readFileSync("./ssl/privkey.pem"),
  cert: fs.readFileSync("./ssl/fullchain.pem"),
};

// Hostname transformation patterns
const HOSTNAME_PATTERNS = ["--", "-"];
const HOSTNAME_REPLACEMENTS = ["-", "."];

// Proxy domain configuration
const PROXY_DOMAIN = ".self.com";

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

// Accept-encoding header handler
const normalizeAcceptEncoding = (req) => {
  let encoding = req.headers["accept-encoding"];
  if (encoding === "gzip, deflate, br, zstd") {
    encoding = "gzip, deflate, br";
  }
  return encoding || "gzip, deflate, br";
};

// URL rewriting function for anchor tags 
const rewriteAnchorUrls = (htmlContent) => {
  const anchorUrlRegex = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[a-zA-Z0-9.-]+)([^"']*)["']/g;
  
  return htmlContent.replace(anchorUrlRegex, (match, domain, path) => {
    // Convert external domain to proxy format
    const proxyDomain = domain
      .replace(/https?:\/\//, "")
      .replace(/\./g, "-") + PROXY_DOMAIN;
    
    // Clean up double slashes in path
    const cleanPath = path.replace(/\/\//g, "/");
    
    // Replace the original URL with proxy URL
    const proxyUrl = `https://${proxyDomain}${cleanPath}`;
    return match.replace(domain + path, proxyUrl);
  });
};

// Proxy configuration
const proxyConfig = {
  ws: true,
  router: hostnameRouter,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Normalize accept-encoding header
    if (req.headers["accept-encoding"]) {
      req.headers["accept-encoding"] = normalizeAcceptEncoding(req);
    }
  },
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    const originalHtml = responseBuffer.toString("utf8");
    const modifiedHtml = rewriteAnchorUrls(originalHtml);
    
    console.log(`Processed ${req.url} - Links rewritten`);
    return modifiedHtml;
  }),
  proxyTimeout: 20000,
  timeout: 30000,
  headers: { Connection: "keep-alive" },
};

// Apply proxy middleware
app.use("/", createProxyMiddleware(proxyConfig));

// Start HTTPS server
https.createServer(sslOptions, app).listen(443, () => {
  console.log("Link Rewriting Proxy Server running on port 443 (HTTPS)");
}); 