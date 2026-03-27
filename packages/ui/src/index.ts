export function renderLayout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; }
      header, main, footer { max-width: 960px; margin: 0 auto; padding: 1rem; }
      nav a { margin-right: 1rem; }
      .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    </style>
  </head>
  <body>
    <header>
      <h1>Umbrella Platform</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/channels">Channels</a>
        <a href="/channels/grants">Grants Pilot</a>
        <a href="/channels/m-and-a">M&A Pilot</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
    <main>${body}</main>
    <footer>
      <small>Phase 1 scaffold: deterministic platform foundation.</small>
    </footer>
  </body>
</html>`;
}

export function renderCard(title: string, content: string): string {
  return `<section class="card"><h2>${title}</h2><p>${content}</p></section>`;
}
