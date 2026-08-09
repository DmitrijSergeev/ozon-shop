import { testProducts } from "../data/testProducts";
import ProductCard from "./ProductCard";

function ProductList() {
  return (
    <section className="product-list">
      {testProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </section>
  );
}

export default ProductList;