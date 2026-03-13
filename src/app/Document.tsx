export const Document: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const criticalCss = `
    html {
      min-height: 100%;
      background:
        radial-gradient(circle at top left, rgba(216,195,168,0.72), transparent 32%),
        radial-gradient(circle at bottom right, rgba(151,186,170,0.42), transparent 28%),
        linear-gradient(180deg, #f7f1e9 0%, #f1e9df 100%);
      font-family: "Inter","Segoe UI",sans-serif;
      color: #1f1811;
      color-scheme: light;
    }
    body { margin: 0; min-height: 100vh; }
    #root { min-height: 100vh; }
    a { color: inherit; }
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
        <style>{criticalCss}</style>
      </head>
      <body>
        <div id="root">{children}</div>
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  );
};
