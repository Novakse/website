/* Lokale ontwikkelserver: serveert website/ statisch en routeert /api/* naar
   de Vercel-serverless-functions in website/api/, zonder extra dependencies.
   Starten: node dev-server.js  (of: npm run dev in de projectroot) */
var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");

var PORT = process.env.PORT || 3000;
var ROOT = __dirname;
var API_DIR = path.join(ROOT, "api");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, "utf8").split("\n").forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.indexOf("#") === 0) return;
    var scheiding = trimmed.indexOf("=");
    if (scheiding === -1) return;
    var key = trimmed.slice(0, scheiding).trim();
    var waarde = trimmed.slice(scheiding + 1).trim();
    if (!(key in process.env)) process.env[key] = waarde;
  });
}
loadEnvFile(path.join(ROOT, ".env"));

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function serveStatic(req, res, pathname) {
  var decoded = decodeURIComponent(pathname);
  if (decoded === "/") decoded = "/index.html";

  var filePath = path.normalize(path.join(ROOT, decoded));
  if (filePath.indexOf(ROOT) !== 0) {
    res.writeHead(403);
    res.end("Verboden.");
    return;
  }

  fs.stat(filePath, function (err, stats) {
    if (err) {
      if (path.extname(filePath) === "") {
        var withHtml = filePath + ".html";
        fs.stat(withHtml, function (err2, stats2) {
          if (!err2 && stats2.isFile()) {
            sendFile(req, res, withHtml);
          } else {
            send404(res);
          }
        });
        return;
      }
      send404(res);
      return;
    }
    if (stats.isDirectory()) {
      sendFile(req, res, path.join(filePath, "index.html"));
      return;
    }
    sendFile(req, res, filePath);
  });
}

function sendFile(req, res, filePath) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      send404(res);
      return;
    }
    var type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    var size = data.length;
    // Safari only plays video when the server answers byte-range requests
    // with 206, as Vercel does live. Supports "bytes=a-b", "bytes=a-" and "bytes=-n".
    var range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (range && (range[1] || range[2])) {
      var start = range[1] ? parseInt(range[1], 10) : Math.max(0, size - parseInt(range[2], 10));
      var end = range[1] && range[2] ? Math.min(parseInt(range[2], 10), size - 1) : size - 1;
      if (start >= size || start > end) {
        res.writeHead(416, { "Content-Range": "bytes */" + size });
        res.end();
        return;
      }
      res.writeHead(206, {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Content-Range": "bytes " + start + "-" + end + "/" + size,
        "Content-Length": end - start + 1
      });
      res.end(data.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    res.end(data);
  });
}

function send404(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Niet gevonden.");
}

function parseJsonBody(req, callback) {
  var chunks = [];
  req.on("data", function (chunk) {
    chunks.push(chunk);
  });
  req.on("end", function () {
    var raw = Buffer.concat(chunks);
    req._rawBody = raw;
    var type = (req.headers["content-type"] || "");
    if (type.indexOf("application/json") !== -1 && raw.length) {
      try {
        req.body = JSON.parse(raw.toString("utf8"));
      } catch (e) {
        req.body = {};
      }
    } else {
      req.body = {};
    }
    callback();
  });
}

function wrapResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (obj) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
  };
  return res;
}

function handleApi(req, res, apiPath) {
  var modulePath = path.join(API_DIR, apiPath + ".js");
  if (!fs.existsSync(modulePath)) {
    send404(res);
    return;
  }
  delete require.cache[require.resolve(modulePath)];
  var handler = require(modulePath);
  wrapResponse(res);

  var noBodyParsing = handler.config && handler.config.api && handler.config.api.bodyParser === false;
  if (noBodyParsing) {
    handler(req, res);
    return;
  }

  parseJsonBody(req, function () {
    handler(req, res);
  });
}

var server = http.createServer(function (req, res) {
  var parsed = url.parse(req.url);
  var pathname = parsed.pathname;

  if (pathname.indexOf("/api/") === 0) {
    handleApi(req, res, pathname.slice(5));
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, function () {
  console.log("Lokale server draait op http://localhost:" + PORT);
});
