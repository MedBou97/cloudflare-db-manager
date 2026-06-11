import stylesUrl from "./styles.css?url";

export const Document: React.FC<{
  children: React.ReactNode;
  rw?: { nonce: string };
}> = ({ children, rw }) => {
  const criticalCss = `
    html {
      min-height: 100%;
      background:
        radial-gradient(circle at top left, var(--c-gradient-warm), transparent 32%),
        radial-gradient(circle at bottom right, var(--c-gradient-accent), transparent 28%),
        linear-gradient(180deg, var(--c-bg-page-start) 0%, var(--c-bg-page-end) 100%);
      font-family: "Inter","Segoe UI",sans-serif;
      color: var(--c-text);
    }
    body { margin: 0; min-height: 100vh; }
    #root { min-height: 100vh; }
    a { color: inherit; }
  `;

  const themeScript = `
    (function(){
      var t = localStorage.getItem("theme");
      if (!t) t = matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = t;
      document.documentElement.style.colorScheme = t;
    })();
  `;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="DB Manager authentication flows for sign in, registration, verification, and password recovery."
        />
        <title>DB Manager</title>
        <link rel="modulepreload" href="/src/client.tsx" />
        <link rel="stylesheet" href={stylesUrl} />
        <style>{criticalCss}</style>
        <script nonce={rw?.nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div id="root">{children}</div>
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  );
};
