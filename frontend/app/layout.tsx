import "./globals.css";
import Navbar from "@/src/components/Navbar";
import NavigationHistory from "@/src/components/NavigationHistory";
import ThemeProvider from "../src/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <NavigationHistory />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
