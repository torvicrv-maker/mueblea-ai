import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mueblea IA — Diseña tu mueble a medida",
  description: "Diseña un clóset a medida desde tu navegador. Ajusta dimensiones, elige un acabado y consulta el despiece preliminar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
