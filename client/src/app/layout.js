import "./globals.css";
import { Providers } from "../../components/Providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-black font-[var(--font-sans)] antialiased text-[var(--color-foreground)]"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
