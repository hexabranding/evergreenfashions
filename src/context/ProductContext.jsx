import { createContext, useContext, useEffect, useState } from "react";
import { allProducts } from "@/data/products";
import { productsApi } from "@/api/products";

const ProductContext = createContext();

function normalizeProduct(product) {
  const images = Array.isArray(product.images) && product.images.length ? product.images : (product.img ? [product.img] : []);
  return { ...product, id: product._id || product.id, images, img: product.img || images[0] || "", colors: Array.isArray(product.colors) ? product.colors : [], sizes: Array.isArray(product.sizes) ? product.sizes : [], stock: product.stock || Object.fromEntries((product.inventory || []).map((item) => [item.size, item.stock])) };
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
