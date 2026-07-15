import { Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
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

function App() {
  return (
    <CartProvider>
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
  );
}

export default App;
