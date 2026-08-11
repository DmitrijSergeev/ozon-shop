import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getOzonProduct } from "../api/ozonApi";

function ProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    // Вычисляем ошибку валидации без записи в useState
    const validationError = !productId ? "Не указан ID товара" : "";

    useEffect(() => {
        // Если ID отсутствует, запрос даже не начинаем
        if (!productId) {
            return;
        }

        let ignore = false;

        async function loadProduct() {
            try {
                setLoading(true);
                setApiError("");

                const data = await getOzonProduct(Number(productId));

                if (!ignore) {
                    setProduct(data);
                }
            } catch (err) {
                console.error(err);

                if (!ignore) {
                    setApiError("Не удалось загрузить информацию о товаре");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            ignore = true;
        };
    }, [productId]);

    // Итоговая ошибка — либо от валидации, либо от API
    const error = validationError || apiError;

    if (loading) {
        return <p>Загрузка товара...</p>;
    }

    if (error) {
        return (
            <section>
                <p>{error}</p>

                <button onClick={() => navigate(-1)}>
                    ← Назад
                </button>
            </section>
        );
    }

    if (!product) {
        return (
            <section>
                <p>Товар не найден</p>

                <button onClick={() => navigate(-1)}>
                    ← Назад
                </button>
            </section>
        );
    }

    return (
        <section>
            <button onClick={() => navigate(-1)}>
                ← Назад
            </button>

            <h1>Информация о товаре</h1>

            <pre>
                {JSON.stringify(product, null, 2)}
            </pre>
        </section>
    );
}

export default ProductDetails;