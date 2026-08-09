import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <img
        src={product.image}
        alt={product.name}
        className="product-card__image"
      />

      <div className="product-card__content">
        <h2 className="product-card__title">
          {product.name}
        </h2>

        <div className="product-card__rating">
          ⭐ {product.rating} · {product.reviews} отзывов
        </div>

        <div className="product-card__prices">
          <span className="product-card__price">
            {product.price.toLocaleString("ru-RU")} ₽
          </span>

          {product.oldPrice && (
            <span className="product-card__old-price">
              {product.oldPrice.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>

        <button className="product-card__button">
          В корзину
        </button>
      </div>
    </article>
  );
}

export default ProductCard;