import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mueblea AI",
  description: "Diseño paramétrico de muebles de melamina asistido por IA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
