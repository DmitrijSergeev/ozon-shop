import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./hooks/useAuth.js";
import { ShopProvider } from "./hooks/useShop.js";
import LoginPage from "./pages/LoginPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import SettingsPage from "./pages/SettingsPage.js";
import NotificationsPage from "./pages/NotificationsPage.js";
import ProductList from "./components/ProductList.js";
import ProductDetails from "./components/ProductDetails.js";
import PricesPage from "./pages/PricesPage.js";
import StocksPage from "./pages/StocksPage.js";
import OrdersPage from "./pages/OrdersPage.js";
import AnalyticsPage from "./pages/AnalyticsPage.js";
import ProblemsPage from "./pages/ProblemsPage.js";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <main>
              <h1>Товары Ozon</h1>
              <ProductList />
            </main>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/:productId"
        element={
          <ProtectedRoute>
            <ProductDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/prices"
        element={
          <ProtectedRoute>
            <PricesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stocks"
        element={
          <ProtectedRoute>
            <StocksPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/problems"
        element={
          <ProtectedRoute>
            <ProblemsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <AppRoutes />
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
