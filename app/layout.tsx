import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Service Scheduler",
  description: "Mobile-first scheduling for field-service companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
