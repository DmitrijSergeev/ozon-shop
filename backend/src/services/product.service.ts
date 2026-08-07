import { prisma } from "../lib/prisma.js";
import { CreateProductDto } from "../schemas/product.schema.js";

export async function createProduct(data: CreateProductDto) {
  return prisma.product.create({
    data,
  });
}

export async function getProducts() {
  return prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProductById(id: number) {
  return prisma.product.findUnique({
    where: { id },
  });
}