import { createServer } from "node:http";
import { channelsPage } from "./pages/channels.js";
import { contactPage } from "./pages/contact.js";
import { grantsPage } from "./pages/grants.js";
import { homePage } from "./pages/home.js";
import { tradePage } from "./pages/trade.js";

const port = Number(process.env.WEB_PORT ?? 3000);

const server = createServer((req, res) => {
  const url = req.url ?? "/";

  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(homePage());
    return;
  }

  if (url === "/channels") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(channelsPage());
    return;
  }

  if (url === "/channels/grants") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(grantsPage());
    return;
  }

  if (url === "/channels/trade") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(tradePage());
    return;
  }

  if (url === "/contact") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(contactPage());
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not found");
});

server.listen(port, () => {
  console.log(`[web] umbrella scaffold running at http://localhost:${port}`);
});
