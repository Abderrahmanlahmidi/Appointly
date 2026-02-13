import "./globals.css";
import { Providers } from "../../components/Providers";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

const ibm = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${ibm.variable} ${space.variable} antialiased font-[var(--font-sans)] text-[#0F0F0F]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
