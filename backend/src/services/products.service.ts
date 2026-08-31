import { prisma } from "../lib/prisma.js";
import type { ProductsQuery } from "../schemas/products.schema.js";

const LOW_STOCK_THRESHOLD = 5;

export interface ProductRow {
  id: string;
  ozonId: string;
  offerId: string;
  sku: number | null;
  name: string | null;
  price: number | null;
  oldPrice: number | null;
  stock: number;
  reserved: number;
  sales: number;
  revenue: number;
  archived: boolean;
  status: "ok" | "out_of_stock" | "low_stock" | "archived";
}

export interface ProductsPage {
  items: ProductRow[];
  total: number;
  limit: number;
  offset: number;
}

export async function getProducts(
  shopId: string,
  query: ProductsQuery,
): Promise<ProductsPage> {
  const {
    search,
    limit,
    offset,
    inStock,
    outOfStock,
    lowStock,
    selling,
    noSales,
    highPrice,
    lowPrice,
    sortBy,
    sortOrder,
  } = query;

  const searchTerm = search.trim();

  const products = await prisma.product.findMany({
    where: {
      shopId,
      ...(searchTerm
        ? {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { offerId: { contains: searchTerm, mode: "insensitive" } },
              { sku: { equals: Number(searchTerm) || undefined } },
            ],
          }
        : {}),
    },
    include: {
      prices: { orderBy: { updatedAt: "desc" }, take: 1 },
      stocks: true,
      orderItems: { select: { quantity: true, price: true } },
    },
  });

  const rows: ProductRow[] = products.map((product) => {
    const price = product.prices[0]?.price ?? null;
    const oldPrice = product.prices[0]?.oldPrice ?? null;
    const stock = product.stocks.reduce((sum, s) => sum + s.present, 0);
    const reserved = product.stocks.reduce((sum, s) => sum + s.reserved, 0);

    const sales = product.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const revenue = product.orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    let status: ProductRow["status"] = "ok";
    if (product.archived) {
      status = "archived";
    } else if (stock === 0) {
      status = "out_of_stock";
    } else if (stock <= LOW_STOCK_THRESHOLD) {
      status = "low_stock";
    }

    return {
      id: product.id,
      ozonId: product.ozonId,
      offerId: product.offerId,
      sku: product.sku,
      name: product.name,
      price: price !== null ? Number(price) : null,
      oldPrice: oldPrice !== null ? Number(oldPrice) : null,
      stock,
      reserved,
      sales,
      revenue: Number(revenue.toFixed(2)),
      archived: product.archived,
      status,
    };
  });

  const filtered = rows.filter((row) => {
    if (inStock && row.stock <= 0) return false;
    if (outOfStock && row.stock > 0) return false;
    if (lowStock && !(row.stock > 0 && row.stock <= LOW_STOCK_THRESHOLD)) return false;
    if (selling && row.sales <= 0) return false;
    if (noSales && row.sales > 0) return false;
    if (highPrice && (row.price === null || row.oldPrice === null || row.price <= row.oldPrice)) return false;
    if (lowPrice && (row.price === null || row.oldPrice === null || row.price >= row.oldPrice)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;

    switch (sortBy) {
      case "sales":
        return (a.sales - b.sales) * dir;
      case "revenue":
        return (a.revenue - b.revenue) * dir;
      case "price":
        return ((a.price ?? 0) - (b.price ?? 0)) * dir;
      case "stock":
        return (a.stock - b.stock) * dir;
      default:
        return 0;
    }
  });

  const total = sorted.length;
  const items = sorted.slice(offset, offset + limit);

  return { items, total, limit, offset };
}
