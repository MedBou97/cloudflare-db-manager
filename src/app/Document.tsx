export const Document: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authStyles = `
    :root {
      color-scheme: light;
      --page-bg: #f4efe7;
      --panel-bg: rgba(255, 252, 247, 0.82);
      --panel-border: rgba(86, 67, 48, 0.12);
      --panel-shadow: 0 30px 80px rgba(76, 56, 34, 0.14);
      --text-strong: #1f1811;
      --text-body: #5f5044;
      --text-soft: #8a7767;
      --accent: #1f6a52;
      --accent-strong: #124735;
      --accent-soft: rgba(31, 106, 82, 0.12);
      --error-bg: rgba(159, 54, 38, 0.1);
      --error-border: rgba(159, 54, 38, 0.2);
      --error-text: #7c271b;
      --success-bg: rgba(31, 106, 82, 0.12);
      --success-border: rgba(31, 106, 82, 0.2);
      --success-text: #15523f;
      --input-border: rgba(92, 73, 56, 0.16);
      --input-focus: rgba(31, 106, 82, 0.35);
      --font-sans: "Inter", "Segoe UI", sans-serif;
      --font-serif: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
    }

    * {
      box-sizing: border-box;
    }

    html {
      min-height: 100%;
      background:
        radial-gradient(circle at top left, rgba(216, 195, 168, 0.72), transparent 32%),
        radial-gradient(circle at bottom right, rgba(151, 186, 170, 0.42), transparent 28%),
        linear-gradient(180deg, #f7f1e9 0%, #f1e9df 100%);
      color: var(--text-strong);
      font-family: var(--font-sans);
    }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text-strong);
    }

    a {
      color: inherit;
    }

    #root {
      min-height: 100vh;
    }

    .auth-page {
      min-height: 100vh;
      padding: 32px;
    }

    .auth-layout {
      position: relative;
      display: grid;
      grid-template-columns: minmax(280px, 1fr) minmax(320px, 520px);
      gap: 32px;
      align-items: stretch;
      min-height: calc(100vh - 64px);
      max-width: 1180px;
      margin: 0 auto;
    }

    .auth-ambient {
      position: absolute;
      border-radius: 999px;
      filter: blur(12px);
      pointer-events: none;
      z-index: 0;
    }

    .auth-ambient-left {
      top: 10%;
      left: -3%;
      width: 220px;
      height: 220px;
      background: rgba(205, 157, 110, 0.18);
    }

    .auth-ambient-right {
      right: 8%;
      bottom: 14%;
      width: 180px;
      height: 180px;
      background: rgba(31, 106, 82, 0.14);
    }

    .auth-aside,
    .auth-panel {
      position: relative;
      z-index: 1;
    }

    .auth-aside {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 32px 16px 32px 0;
    }

    .auth-kicker,
    .auth-eyebrow,
    .auth-aside-label {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-soft);
    }

    .auth-display {
      margin: 18px 0 0;
      max-width: 12ch;
      font-family: var(--font-serif);
      font-size: clamp(3rem, 6vw, 5.6rem);
      line-height: 0.92;
      letter-spacing: -0.04em;
    }

    .auth-lead {
      margin: 22px 0 0;
      max-width: 36rem;
      color: var(--text-body);
      font-size: 1.05rem;
      line-height: 1.7;
    }

    .auth-aside-card {
      margin-top: 36px;
      max-width: 28rem;
      padding: 22px 24px;
      border: 1px solid rgba(86, 67, 48, 0.12);
      border-radius: 24px;
      background: rgba(255, 250, 244, 0.56);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.44);
      backdrop-filter: blur(12px);
    }

    .auth-aside-copy {
      margin: 10px 0 0;
      color: var(--text-body);
      line-height: 1.7;
    }

    .auth-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 36px;
      border: 1px solid var(--panel-border);
      border-radius: 32px;
      background: var(--panel-bg);
      box-shadow: var(--panel-shadow);
      backdrop-filter: blur(18px);
    }

    .auth-panel-header {
      margin-bottom: 28px;
    }

    .auth-title {
      margin: 12px 0 0;
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1;
      letter-spacing: -0.03em;
    }

    .auth-description {
      margin: 14px 0 0;
      max-width: 34ch;
      color: var(--text-body);
      line-height: 1.7;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .auth-field {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .auth-label-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: baseline;
    }

    .auth-label {
      font-weight: 600;
      color: var(--text-strong);
    }

    .auth-hint {
      color: var(--text-soft);
      font-size: 0.86rem;
    }

    .auth-input {
      width: 100%;
      padding: 16px 18px;
      border: 1px solid var(--input-border);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.72);
      color: var(--text-strong);
      font: inherit;
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
      outline: none;
    }

    .auth-input::placeholder {
      color: #998674;
    }

    .auth-input:focus {
      border-color: rgba(31, 106, 82, 0.4);
      box-shadow: 0 0 0 4px var(--input-focus);
      transform: translateY(-1px);
    }

    .auth-button {
      margin-top: 8px;
      padding: 16px 20px;
      border: 0;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
      color: #f7f8f6;
      font: inherit;
      font-weight: 700;
      letter-spacing: 0.01em;
      cursor: pointer;
      box-shadow: 0 18px 30px rgba(18, 71, 53, 0.2);
      transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
    }

    .auth-button[disabled] {
      cursor: wait;
      transform: none;
      filter: grayscale(0.08);
      opacity: 0.84;
      box-shadow: 0 12px 22px rgba(18, 71, 53, 0.16);
    }

    .auth-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 22px 34px rgba(18, 71, 53, 0.26);
      filter: saturate(1.05);
    }

    .auth-button:active {
      transform: translateY(0);
    }

    .auth-status {
      margin: 0 0 4px;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid transparent;
      line-height: 1.55;
    }

    .auth-status-error {
      background: var(--error-bg);
      border-color: var(--error-border);
      color: var(--error-text);
    }

    .auth-status-success {
      background: var(--success-bg);
      border-color: var(--success-border);
      color: var(--success-text);
    }

    .auth-footer {
      margin-top: 28px;
      padding-top: 22px;
      border-top: 1px solid rgba(86, 67, 48, 0.12);
      color: var(--text-body);
      display: grid;
      gap: 8px;
    }

    .auth-footer p {
      margin: 0;
      line-height: 1.6;
    }

    .auth-footer a {
      color: var(--accent-strong);
      text-decoration: none;
      border-bottom: 1px solid rgba(18, 71, 53, 0.24);
    }

    .auth-footer a:hover {
      border-bottom-color: rgba(18, 71, 53, 0.56);
    }

    .site-shell {
      min-height: 100vh;
      padding: 32px;
    }

    .site-hero {
      max-width: 1180px;
      min-height: calc(100vh - 64px);
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(320px, 1.3fr) minmax(320px, 0.9fr);
      gap: 32px;
      align-items: center;
    }

    .site-copy,
    .site-card {
      position: relative;
      z-index: 1;
    }

    .site-kicker,
    .site-card-label,
    .site-metrics dt {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-soft);
    }

    .site-title {
      margin: 18px 0 0;
      max-width: 11ch;
      font-family: var(--font-serif);
      font-size: clamp(3rem, 6vw, 5.2rem);
      line-height: 0.95;
      letter-spacing: -0.045em;
    }

    .site-description {
      margin: 20px 0 0;
      max-width: 39rem;
      color: var(--text-body);
      font-size: 1.05rem;
      line-height: 1.75;
    }

    .site-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      margin-top: 30px;
    }

    .site-button,
    .site-link {
      text-decoration: none;
      font-weight: 700;
    }

    .site-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 180px;
      padding: 16px 20px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
      color: #f7f8f6;
      box-shadow: 0 18px 30px rgba(18, 71, 53, 0.2);
      transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
    }

    .site-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 22px 34px rgba(18, 71, 53, 0.26);
      filter: saturate(1.05);
    }

    .site-link {
      color: var(--accent-strong);
      border-bottom: 1px solid rgba(18, 71, 53, 0.24);
    }

    .site-card {
      padding: 32px;
      border: 1px solid var(--panel-border);
      border-radius: 32px;
      background: var(--panel-bg);
      box-shadow: var(--panel-shadow);
      backdrop-filter: blur(18px);
    }

    .site-card-title {
      margin: 14px 0 0;
      font-family: var(--font-serif);
      font-size: clamp(1.8rem, 3vw, 2.6rem);
      line-height: 1.05;
      letter-spacing: -0.03em;
    }

    .site-card-copy {
      margin: 14px 0 0;
      color: var(--text-body);
      line-height: 1.7;
    }

    .site-metrics {
      margin: 26px 0 0;
      display: grid;
      gap: 18px;
    }

    .site-metrics div {
      padding-top: 16px;
      border-top: 1px solid rgba(86, 67, 48, 0.12);
    }

    .site-metrics dd {
      margin: 8px 0 0;
      color: var(--text-strong);
      font-size: 1.02rem;
      word-break: break-word;
    }

    @media (max-width: 900px) {
      .auth-page {
        padding: 18px;
      }

      .auth-layout {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .auth-aside {
        padding: 18px 4px 0;
      }

      .auth-display {
        max-width: none;
      }

      .site-shell {
        padding: 18px;
      }

      .site-hero {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .site-title {
        max-width: none;
      }
    }

    @media (max-width: 640px) {
      .auth-panel {
        padding: 24px;
        border-radius: 24px;
      }

      .auth-label-row {
        flex-direction: column;
        gap: 4px;
      }

      .auth-display {
        font-size: clamp(2.6rem, 14vw, 4rem);
      }

      .site-card {
        padding: 24px;
        border-radius: 24px;
      }

      .site-title {
        font-size: clamp(2.6rem, 14vw, 4rem);
      }

      .site-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .site-button {
        width: 100%;
      }
    }
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
        <style>{authStyles}</style>
      </head>
      <body>
        <div id="root">{children}</div>
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  );
};
