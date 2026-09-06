import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UDBA — Universal Day Boarding Academy, Gwalior",
  description: "Universal Day Boarding Academy, Pinto Park, Gwalior (MP) — Complete School Management System. Manage students, fees, attendance, exams, and parent communication.",
  keywords: "Universal Day Boarding Academy, UDBA, Gwalior school, school management, student portal, fee management",
  openGraph: {
    title: "UDBA — Universal Day Boarding Academy",
    description: "School Management System — Universal Day Boarding Academy, Pinto Park, Gwalior",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
