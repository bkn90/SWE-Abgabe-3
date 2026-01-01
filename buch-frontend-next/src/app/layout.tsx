import type { Metadata } from "next";
import { Chakra } from "../providers/Chakra";

export const metadata: Metadata = {
  title: "Buch Frontend",
  description: "Next.js + Chakra UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Chakra>{children}</Chakra>
      </body>
    </html>
  );
}