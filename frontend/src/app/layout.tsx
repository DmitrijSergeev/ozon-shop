import type { Metadata } from "next";
import Providers from "./providers";

import "../index.css";
import "../pages/pages.css";
import "../pages/analytics.css";
import "../pages/notifications.css";
import "../pages/orders.css";
import "../pages/prices.css";
import "../pages/problems.css";
import "../pages/stocks.css";
import "../components/productDetails.css";

export const metadata: Metadata = {
  title: "Ozon Shop",
  description: "Управление магазином Ozon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
