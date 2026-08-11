import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

import ProductList from "./components/ProductList";
import ProductDetails from "./components/ProductDetails";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={
                        <main>
                            <h1>Товары Ozon</h1>

                            <ProductList />
                        </main>
                    }
                />

                <Route
                    path="/products/:productId"
                    element={<ProductDetails />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;