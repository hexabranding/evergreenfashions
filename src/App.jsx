import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrdersProvider } from "@/context/OrderContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import Bag from "./pages/Bag";
import Atelier from "./pages/Atelier";
import Journal from "./pages/Journal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Rental from "./pages/Rental";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <OrdersProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="collection" element={<Collection />} />
              <Route path="product/:name" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="confirmation" element={<Confirmation />} />
              <Route path="bag" element={<Bag />} />
              <Route path="atelier" element={<Atelier />} />
              <Route path="journal" element={<Journal />} />
              <Route path="rental" element={<Rental />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="account" element={<Account />} />
              <Route path="vendor" element={<VendorDashboard />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route
                path="*"
                element={
                  <div className="flex min-h-screen items-center justify-center bg-background px-4">
                    <div className="max-w-md text-center">
                      <h1 className="text-7xl font-bold text-foreground">404</h1>
                      <h2 className="mt-4 text-xl font-semibold text-foreground">
                        Page not found
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        The page you're looking for doesn't exist or has been moved.
                      </p>
                      <div className="mt-6">
                        <a
                          href="/"
                          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          Go home
                        </a>
                      </div>
                    </div>
                  </div>
                }
              />
            </Route>
          </Routes>
        </CartProvider>
      </OrdersProvider>
    </AuthProvider>
  );
}

export default App;
