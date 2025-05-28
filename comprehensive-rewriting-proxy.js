// This file creates an HTTPS proxy server that:
// Rewrites URLs in multiple HTML elements (a, link, script)
// Handles href and src attributes
// Converts external resources to proxy domain format
// Most advanced URL transformation capabilities


const https = require("https");
const fs = require("fs");
const express = require("express");
const {
  createProxyMiddleware,
  responseInterceptor,
} = require("http-proxy-middleware");

/**
 * Comprehensive URL Rewriting Proxy Server
 * - Rewrites URLs in multiple HTML elements (a, link, script)
 * - Handles href and src attributes
 * - Converts external resources to proxy domain format
 * - Most advanced URL transformation capabilities
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

// Supported HTML elements and their URL attributes
const URL_REWRITE_TARGETS = [
  { tag: "a", attribute: "href" },      // Anchor links
  { tag: "link", attribute: "href" },   // Stylesheets, favicons, etc.
  { tag: "script", attribute: "src" },  // JavaScript files
];

// Custom router for hostname transformation
const hostnameRouter = (req, res) => {
  let targetHost = req.hostname;
  console.log("Processing hostname:", targetHost);
  
  const dotIndex = targetHost.indexOf(".");
  let targetUrl = "https://" + targetHost.substring(0, dotIndex);
  
  // Apply hostname transformations in reverse order
  for (let i = HOSTNAME_PATTERNS.length - 1; i >= 0; i--) {
    targetUrl = replaceAll(targetUrl, HOSTNAME_PATTERNS[i], HOSTNAME_REPLACEMENTS[i]);
  }
  
  req.target = targetUrl;
  console.log("Routing to:", targetUrl);
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

// Enhanced URL rewriting function for multiple HTML elements
const rewriteUrlsInHtmlElements = (htmlContent, elementConfig) => {
  let modifiedContent = htmlContent;
  
  elementConfig.forEach(({ tag, attribute }) => {
    // Create regex pattern for the specific tag and attribute
    const regex = new RegExp(
      `<${tag}\\s+(?:[^>]*?\\s+)?${attribute}=["'](https?:\\/\\/[a-zA-Z0-9.-]+)([^"']*)["']`,
      "g"
    );
    
    modifiedContent = modifiedContent.replace(regex, (match, domain, path) => {
      // Convert external domain to proxy format
      const proxyDomain = domain
        .replace(/https?:\/\//, "")
        .replace(/\./g, "-") + PROXY_DOMAIN;
      
      // Clean up path (remove double slashes)
      const cleanPath = path.replace(/\/\//g, "/");
      
      // Create the proxy URL
      const proxyUrl = `https://${proxyDomain}${cleanPath}`;
      
      console.log(`Rewriting ${tag}[${attribute}]: ${domain}${path} → ${proxyUrl}`);
      
      return match.replace(domain + path, proxyUrl);
    });
  });
  
  return modifiedContent;
};

// Proxy configuration
const proxyConfig = {
  ws: true,
  router: hostnameRouter,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Normalize accept-encoding header to prevent encoding issues
    if (req.headers["accept-encoding"]) {
      req.headers["accept-encoding"] = normalizeAcceptEncoding(req);
    }
  },
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(
    async (responseBuffer, proxyRes, req, res) => {
      const originalHtml = responseBuffer.toString("utf8");
      const modifiedHtml = rewriteUrlsInHtmlElements(originalHtml, URL_REWRITE_TARGETS);
      
      console.log(`✓ Processed ${req.method} ${req.url} - URLs rewritten in HTML elements`);
      return modifiedHtml;
    }
  ),
  proxyTimeout: 20000,
  timeout: 30000,
  headers: { Connection: "keep-alive" },
};

// Apply proxy middleware
app.use("/", createProxyMiddleware(proxyConfig));

// Start HTTPS server
https.createServer(sslOptions, app).listen(443, () => {
  console.log("🚀 Comprehensive URL Rewriting Proxy Server running on port 443 (HTTPS)");
  console.log("📝 Rewriting URLs in:", URL_REWRITE_TARGETS.map(t => `${t.tag}[${t.attribute}]`).join(", "));
}); 