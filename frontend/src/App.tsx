import { useEffect, useState } from "react";
import { getOzonProducts } from "./api/ozonApi";

function App() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOzonProducts()
      .then((data) => {
        console.log("Ответ от backend:", data);

        setProducts(data.result.items);
      })
      .catch((error) => {
        console.error("Ошибка:", error);

        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h1>Загрузка товаров...</h1>;
  }

  if (error) {
    return <h1>Ошибка: {error}</h1>;
  }

  return (
    <div>
      <h1>Товары Ozon</h1>

      <p>Количество товаров: {products.length}</p>

      {products.length === 0 ? (
        <p>Товаров пока нет</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              {product.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;