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
	resCode = 200;
      } else {
	resCode = 200;
        if (req.url.endsWith(".html")) {
          res.setHeader("Content-Type", "text/html");
        } else if (req.url.endsWith(".js")) {
          res.setHeader("Content-Type", "text/javascript");
        } else if (req.url.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        } else if (req.url.endsWith(".ico")) {
          resCode = 404;
        } else {
          res.setHeader("Content-Type", "application/octet-stream");
        }

	if (resCode === 200) {
          try{
	    const ot_data = fs.readFileSync(req.url.substring(1));
            res.write(ot_data);
	  } catch(e) {
	    console.log("Handled error: ", e.message);
	    resCode = 404;
	  }
	}
      }
    }
    res.statusCode = resCode;
    res.end();
  } catch (e) {
    console.log(e);
  } finally {
    nb_reqs += 1;
    let timeStamp = new Date().toISOString();
    const forwarded = req.headers['x-forwarded-for']
    const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress
    console.log(`[${timeStamp} | ${ip}] end of request ${nb_reqs}. url: ${req.url}`);
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
