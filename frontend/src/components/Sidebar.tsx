"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/products", label: "Товары", icon: "📦" },
  { to: "/orders", label: "Заказы", icon: "🧾" },
  { to: "/prices", label: "Цены", icon: "💰" },
  { to: "/stocks", label: "Остатки", icon: "📉" },
  { to: "/analytics", label: "Аналитика", icon: "📈" },
  { to: "/problems", label: "Проблемы", icon: "⚠️" },
  { to: "/settings", label: "Настройки", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Ozon Shop</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = item.end
            ? pathname === item.to
            : pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              href={item.to}
              className={
                "sidebar-link" + (isActive ? " sidebar-link-active" : "")
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
