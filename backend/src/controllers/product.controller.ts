import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getProducts,
  getProductById,
} from "../services/product.service.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { createProduct } from "../services/product.service.js";

export const createProductHandler = asyncHandler(async (req, res) => {
  const product = await createProduct(req.body);

  res.status(201).json(product);
});

export const getProductsHandler = asyncHandler(async (_req, res) => {
  const products = await getProducts();

  res.json(products);
});

export const getProductByIdHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const product = await getProductById(id);

  if (!product) {
  throw new NotFoundError("Product not found");
}

  res.json(product);
});