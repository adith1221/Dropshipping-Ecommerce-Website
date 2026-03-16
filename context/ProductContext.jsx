import { createContext, useContext, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase.js";

export const ProductContext = createContext(null);

export function ProductProvider({ value, children }) {
  const { products, setProducts } = value;

  useEffect(() => {
    const productsRef = collection(db, "products");
    const unsub = onSnapshot(
      productsRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return { ...data, id: d.id };
        });
        console.log("Products updated:", list);
        setProducts(list);
      },
      (error) => {
        console.error("Error fetching products:", error);
        // Optionally set an error state or show a message
      }
    );
    return unsub;
  }, [setProducts]);

  const createProduct = async (product, imageFile) => {
    let imageUrl = product.image;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }
    const productsRef = collection(db, "products");
    await addDoc(productsRef, {
      ...product,
      image: imageUrl,
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      createdAt: serverTimestamp(),
    });
  };

  const updateProduct = async (id, updates, imageFile) => {
    let imageUrl = updates.image;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }
    const ref = doc(db, "products", id);
    await updateDoc(ref, {
      ...updates,
      image: imageUrl,
      price:
        typeof updates.price === "number"
          ? updates.price
          : Number(updates.price) || 0,
      stock:
        typeof updates.stock === "number"
          ? updates.stock
          : Number(updates.stock) || 0,
    });
  };



  const removeProduct = async (id) => {
    console.log("Attempting to delete product with id:", id, "type:", typeof id);
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid product ID: ' + id);
    }
    // Optimistically remove from local state
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      const ref = doc(db, "products", id);
      console.log("Deleting document ref:", ref.path);
      await deleteDoc(ref);
      console.log("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      // Revert by triggering a refresh, but since onSnapshot will update, it should re-add if failed
      throw error;
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const ctxValue = {
    products,
    setProducts,
    createProduct,
    updateProduct,
    removeProduct,
    uploadImage,
  };

  return (
    <ProductContext.Provider value={ctxValue}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) {
    throw new Error("useProducts must be used within ProductContext.Provider");
  }
  return ctx;
}

