export default function EmbedRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; background: white; }
          a { text-decoration: none; color: inherit; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
