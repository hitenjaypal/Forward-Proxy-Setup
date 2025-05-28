# Basic Proxy Setup

A collection of HTTPS proxy servers with different URL rewriting capabilities. Each proxy server serves a specific purpose, from basic logging to comprehensive URL transformation.

## What is http-proxy-middleware (HPM)?

This is a middleware used in Node.js (commonly with Express.js) to forward (proxy) requests from your server to another server — for example, forwarding API calls to a backend server.

It means:
If someone hits /api/something on your frontend dev server (e.g., port 3000), it will proxy that request to http://localhost:5000/api/something.



## What is an interceptor in this context? 

onProxyReq(proxyReq, req, res)
onProxyRes(proxyReq, req, res)

<!-- onProxyReq = Request bhejne se pehle ka control
onProxyRes = Response milne ke baad ka control -->

An interceptor in HPM allows you to hook into the proxy request or response — and either:
Modify the request before it’s forwarded.
Modify the response before it’s sent back to the client.
Log or inspect data in between.

✳️ It's like a middleware inside a middleware.



## 📁 Project Structure

```
Basic-Proxy-Setup/
├── basic-logging-proxy.js           # Basic proxy with request/response logging
├── link-rewriting-proxy.js          # Proxy that rewrites anchor tag URLs
├── comprehensive-rewriting-proxy.js # Advanced proxy with multi-element URL rewriting
├── proxy.js                         # Original basic logging proxy
├── proxy2.js                        # Original link rewriting proxy
├── proxy3.js                        # Original comprehensive proxy
├── package.json                     # Project dependencies
├── README.md                        # This file
└── ssl/                            # SSL certificates directory
    ├── privkey.pem                 # SSL private key (you need to provide)
    └── fullchain.pem               # SSL certificate chain (you need to provide)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup SSL Certificates

Create the SSL directory and add your certificates:

```bash
npm run setup-ssl
```

Then add your SSL certificate files:
- `ssl/privkey.pem` - Your private key
- `ssl/fullchain.pem` - Your certificate chain

### 3. Run a Proxy Server

Choose one of the three proxy servers based on your needs:

```bash
# Basic logging proxy
npm run start:logging

# Link rewriting proxy  
npm run start:links

# Comprehensive rewriting proxy
npm run start:comprehensive
```

## 📋 Proxy Server Descriptions

### 1. Basic Logging Proxy (`basic-logging-proxy.js`)
**Purpose**: Request/response logging and monitoring

**Features**:
- ✅ Logs all incoming requests with detailed metadata
- ✅ Intercepts and displays HTML response content
- ✅ Security checks for sensitive data in requests
- ✅ Hostname transformation (dashes to dots)
- ✅ Accept-encoding header normalization

**Use Case**: Development, debugging, traffic analysis

### 2. Link Rewriting Proxy (`link-rewriting-proxy.js`)
**Purpose**: URL transformation for anchor tags

**Features**:
- ✅ Rewrites URLs in `<a href="">` tags
- ✅ Converts external domains to proxy format
- ✅ Hostname transformation and routing
- ✅ Optimized for link redirection

**Use Case**: Web scraping, content filtering, link proxying

### 3. Comprehensive Rewriting Proxy (`comprehensive-rewriting-proxy.js`)
**Purpose**: Advanced URL rewriting for multiple HTML elements

**Features**:
- ✅ Rewrites URLs in multiple HTML elements:
  - `<a href="">` - Anchor links
  - `<link href="">` - Stylesheets, favicons
  - `<script src="">` - JavaScript files
- ✅ Comprehensive resource proxying
- ✅ Advanced URL transformation engine
- ✅ Detailed rewriting logging

**Use Case**: Complete web application proxying, resource interception

## ⚙️ Configuration

### Environment Variables

You can customize the proxy behavior by modifying these constants in each file:

```javascript
// Hostname transformation patterns
const HOSTNAME_PATTERNS = ["--", "-"];
const HOSTNAME_REPLACEMENTS = ["-", "."];

// Proxy domain (for rewriting proxies)
const PROXY_DOMAIN = ".self.com";

// SSL certificate paths
const sslOptions = {
  key: fs.readFileSync("./ssl/privkey.pem"),
  cert: fs.readFileSync("./ssl/fullchain.pem"),
};
```

### Port Configuration

All proxies run on port 443 (HTTPS). To change the port, modify the listen call:

```javascript
https.createServer(sslOptions, app).listen(443, () => {
  console.log("Server running on port 443");
});
```

## 🛠️ Development

### Development Mode with Auto-Restart

```bash
# Install nodemon globally (optional)
npm install -g nodemon

# Run in development mode
npm run dev:logging
npm run dev:links  
npm run dev:comprehensive
```

### Manual Testing

Test the proxy servers using curl or your browser:

```bash
# Test with curl (replace with your actual domain)
curl -k https://example-com.self.com/

# Test with specific paths
curl -k https://google-com.self.com/search?q=test
```

## 🔧 Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   - Ensure `privkey.pem` and `fullchain.pem` are in the `ssl/` directory
   - Check file permissions (readable by Node.js process)

2. **Port 443 Permission Issues**
   - Run with sudo on Linux/macOS: `sudo npm start`
   - Or change to a higher port (>1024) in the code

3. **Module Not Found Errors**
   - Run `npm install` to install dependencies
   - Check Node.js version (requires >=14.0.0)

### Debug Mode

Enable detailed logging by setting the DEBUG environment variable:

```bash
DEBUG=proxy* npm run start:comprehensive
```

## 📦 Dependencies

- **express**: Web application framework
- **http-proxy-middleware**: HTTP proxy middleware for Express
- **nodemon**: Development auto-restart tool (dev dependency)

## 🔒 Security Considerations

1. **SSL Certificates**: Use valid SSL certificates for production
2. **Access Control**: Implement authentication/authorization as needed
3. **Rate Limiting**: Consider adding rate limiting for production use
4. **Input Validation**: Validate all incoming requests
5. **Logging**: Ensure sensitive data is not logged in production

## 📄 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs for error details
3. Ensure all dependencies are correctly installed
4. Verify SSL certificate configuration 



-----------------------------------------------------------------------------


# Basic Logging Proxy
npm run start:logging
# OR
node basic-logging-proxy.js

# Link Rewriting Proxy
npm run start:links
# OR  
node link-rewriting-proxy.js

# Comprehensive Rewriting Proxy
npm run start:comprehensive
# OR
node comprehensive-rewriting-proxy.js

# Development mode with auto-restart
npm run dev:logging
npm run dev:links
npm run dev:comprehensive