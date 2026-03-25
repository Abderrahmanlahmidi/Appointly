import "./globals.css";
import { Providers } from "../../components/Providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased font-[var(--font-sans)] text-[#0F0F0F]"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
