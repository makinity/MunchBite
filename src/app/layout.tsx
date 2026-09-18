import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import ChatBot from "@/components/ui/ChatBot";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MunchBite — Sweet Bites, Big Smiles.",
  description:
    "Delicious homemade treats made fresh for every craving. Perfect for sharing, gifting, or simply treating yourself.",
  keywords: ["MunchBite", "homemade treats", "cookies", "brownies", "cupcakes", "food delivery"],
  openGraph: {
    title: "MunchBite — Sweet Bites, Big Smiles.",
    description:
      "Delicious homemade treats made fresh for every craving. Perfect for sharing, gifting, or simply treating yourself.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito antialiased">
        {children}
        <ChatBot />
      </body>
    </html>
  );
}
