import type { OzonProduct } from "../api/ozonApi";

interface ProductCardProps {
    product: OzonProduct;
}

function ProductCard({ product }: ProductCardProps) {
    return (
        <article className="product-card">
            <h2>{product.offer_id}</h2>

            <p>
                <strong>Product ID:</strong>{" "}
                {product.product_id}
            </p>

            <p>
                <strong>SKU:</strong>{" "}
                {product.sku}
            </p>

            <p>
                <strong>FBO:</strong>{" "}
                {product.has_fbo_stocks ? "Есть" : "Нет"}
            </p>

            <p>
                <strong>FBS:</strong>{" "}
                {product.has_fbs_stocks ? "Есть" : "Нет"}
            </p>

            <p>
                <strong>Архивный:</strong>{" "}
                {product.archived ? "Да" : "Нет"}
            </p>

            <p>
                <strong>Скидка:</strong>{" "}
                {product.is_discounted ? "Да" : "Нет"}
            </p>
        </article>
    );
}

export default ProductCard;