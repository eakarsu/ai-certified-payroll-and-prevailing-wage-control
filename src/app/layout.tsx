import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Certified Payroll and Prevailing Wage Control",
  description: "Import timecards and wage determinations; calculate classification/fringe exceptions; assemble weekly certified payroll with reviewer sign-off.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
