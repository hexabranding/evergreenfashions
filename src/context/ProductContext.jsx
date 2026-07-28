import { createContext, useContext, useEffect, useState } from "react";
import { allProducts } from "@/data/products";
import { productsApi } from "@/api/products";

const ProductContext = createContext();

function normalizeProduct(product) {
  return { ...product, id: product._id || product.id, stock: product.stock || Object.fromEntries((product.inventory || []).map((item) => [item.size, item.stock])) };
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(allProducts);
  useEffect(() => {
    productsApi.getAll().then((items) => {
      if (items.length) setProducts(items.map(normalizeProduct));
    }).catch(() => {});
  }, []);
  return <ProductContext.Provider value={{ products, setProducts }}>{children}</ProductContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within ProductProvider");
  return context;
}
