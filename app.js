const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

var nb_reqs = 0;


const server = http.createServer((req, res) => {
  try {
    let resCode = 400;
    if (!req.url.includes("..")) { // only files in from server
      if (req.url === "/") {
        res.setHeader("Content-Type", "text/html");
        const ot_data = fs.readFileSync("index.html");
        res.write(ot_data);

      } else {
        if (req.url.endsWith(".html")) {
          res.setHeader("Content-Type", "text/html");
        } else if (req.url.endsWith(".js")) {
          res.setHeader("Content-Type", "text/javascript");
        } else if (req.url.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        } else if (req.url.endsWith(".ico")) {
          // nothing
        }else {
          res.setHeader("Content-Type", "application/octet-stream");
        }

        const ot_data = fs.readFileSync(req.url.substring(1));
        res.write(ot_data);
      }
      resCode = 200;
    }
    res.statusCode = resCode;
    res.end();
  } catch (e) {
    console.log(e);
  } finally {
    nb_reqs += 1;
    console.log(`end of request: ${nb_reqs}`);
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});