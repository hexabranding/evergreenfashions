import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext();

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(16);
}

function stripPassword(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function seedInitialData() {
  const existing = localStorage.getItem("ef_users");
  if (existing) return { users: JSON.parse(existing), seeded: false };

  const now = new Date().toISOString();
  const users = [
    {
      id: "admin-1",
      firstName: "Admin",
      lastName: "Evergreen",
      email: "admin@evergreen.com",
      password: hashPassword("admin123"),
      role: "admin",
      createdAt: now,
      addresses: [],
      phone: "",
    },
    {
      id: "vendor-1",
      firstName: "Atelier",
      lastName: "Paris",
      email: "vendor@evergreen.com",
      password: hashPassword("vendor123"),
      role: "vendor",
      createdAt: now,
      addresses: [],
      phone: "",
      vendorStore: {
        name: "Atelier Paris",
        description: "Premium Parisian fashion house",
        commission: 15,
      },
    },
    {
      id: "cust-1",
      firstName: "Isabelle",
      lastName: "Moreau",
      email: "customer@evergreen.com",
      password: hashPassword("customer123"),
      role: "customer",
      createdAt: now,
      addresses: [
        {
          id: "addr-1",
          label: "Home",
          street: "15 Rue de Rivoli",
          city: "Paris",
          zip: "75001",
          country: "France",
          isDefault: true,
        },
      ],
      phone: "+33 6 12 34 56 78",
    },
  ];

  localStorage.setItem("ef_users", JSON.stringify(users));
  return { users, seeded: true };
}

export function AuthProvider({ children }) {
  const seeded = useCallback(() => seedInitialData(), []);
  const initial = seeded();

  const [users, setUsers] = useState(initial.users);
  const [currentUser, setCurrentUser] = useState(() =>
    loadState("ef_currentUser", null)
  );

  useEffect(() => {
    localStorage.setItem("ef_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("ef_currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("ef_currentUser");
    }
  }, [currentUser]);

  const register = useCallback(
    ({ firstName, lastName, email, password, role = "customer" }) => {
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return { success: false, error: "Email already registered" };

      const newUser = {
        id: `user-${Date.now().toString(36)}`,
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashPassword(password),
        role,
        createdAt: new Date().toISOString(),
        addresses: [],
        phone: "",
      };

      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(stripPassword(newUser));
      return { success: true, error: null };
    },
    [users]
  );

  const login = useCallback(
    (email, password) => {
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return { success: false, error: "Invalid email or password" };
      if (user.password !== hashPassword(password))
        return { success: false, error: "Invalid email or password" };

      setCurrentUser(stripPassword(user));
      return { success: true, error: null };
    },
    [users]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback(
    (updates) => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        setUsers((uPrev) =>
          uPrev.map((u) =>
            u.id === prev.id ? { ...u, ...updates } : u
          )
        );
        return updated;
      });
    },
    []
  );

  const addAddress = useCallback(
    (address) => {
      const newAddress = {
        ...address,
        id: address.id || `addr-${Date.now().toString(36)}`,
      };

      setCurrentUser((prev) => {
        if (!prev) return null;
        const addresses = prev.addresses.map((a) =>
          newAddress.isDefault ? { ...a, isDefault: false } : a
        );
        const updated = { ...prev, addresses: [...addresses, newAddress] };
        setUsers((uPrev) =>
          uPrev.map((u) => (u.id === prev.id ? { ...u, addresses: updated.addresses } : u))
        );
        return updated;
      });
    },
    []
  );

  const removeAddress = useCallback(
    (addressId) => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const addresses = prev.addresses.filter((a) => a.id !== addressId);
        const updated = { ...prev, addresses };
        setUsers((uPrev) =>
          uPrev.map((u) => (u.id === prev.id ? { ...u, addresses } : u))
        );
        return updated;
      });
    },
    []
  );

  const setDefaultAddress = useCallback(
    (addressId) => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const addresses = prev.addresses.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }));
        const updated = { ...prev, addresses };
        setUsers((uPrev) =>
          uPrev.map((u) => (u.id === prev.id ? { ...u, addresses } : u))
        );
        return updated;
      });
    },
    []
  );

  const isAuthenticated = !!currentUser;
  const isVendor = currentUser?.role === "vendor";
  const isAdmin = currentUser?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        register,
        login,
        logout,
        updateProfile,
        addAddress,
        removeAddress,
        setDefaultAddress,
        isAuthenticated,
        isVendor,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
