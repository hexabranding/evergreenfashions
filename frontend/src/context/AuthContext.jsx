import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "@/api/auth";
import { getToken } from "@/api/client";
import { isOfflineError } from "@/lib/utils";
import PhoneOtpDialog from "@/components/PhoneOtpDialog";

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
  const [phoneAuthAction, setPhoneAuthAction] = useState(null);

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

  useEffect(() => {
    if (getToken()) {
      authApi.getMe()
        .then((me) => {
          if (me) {
            const apiUser = { ...me, id: me._id || me.id };
            setCurrentUser(apiUser);
          }
        })
        .catch(() => {});
    }
  }, []);

  const register = useCallback(
    async ({ firstName, lastName, email, password, role = "customer", vendorStore }) => {
      let result;
      try {
        result = await authApi.register({ firstName, lastName, email, password, role, vendorStore });
      } catch (err) {
        return {
          success: false,
          error: isOfflineError(err)
            ? "Could not reach the server — your account was not created. Start the backend and try again."
            : err?.message || "Registration failed",
        };
      }

      const apiUser = { ...result.user, id: result.user._id || result.user.id };
      setCurrentUser(apiUser);
      setUsers((previous) => {
        const exists = previous.some((user) => user.id === apiUser.id);
        return exists ? previous.map((user) => user.id === apiUser.id ? { ...user, ...apiUser } : user) : [...previous, apiUser];
      });
      return { success: true, error: null };
    },
    []
  );

  const login = useCallback(
    async (email, password) => {
      try {
        const result = await authApi.login(email, password);
        const apiUser = { ...result.user, id: result.user._id || result.user.id };
        setCurrentUser(apiUser);
        setUsers((previous) => {
          const exists = previous.some((user) => user.id === apiUser.id);
          return exists ? previous.map((user) => user.id === apiUser.id ? { ...user, ...apiUser } : user) : [...previous, apiUser];
        });
        return { success: true, error: null, user: apiUser };
      } catch {
        // Preserve the local demo mode when the backend is not running.
      }
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return { success: false, error: "Invalid email or password" };
      if (user.password !== hashPassword(password))
        return { success: false, error: "Invalid email or password" };

      setCurrentUser(stripPassword(user));
      return { success: true, error: null, user: stripPassword(user) };
    },
    [users]
  );

  const logout = useCallback(() => {
    authApi.logout();
    setCurrentUser(null);
  }, []);

  const requestPhoneLogin = useCallback((onAuthenticated) => {
    if (currentUser) return onAuthenticated?.();
    setPhoneAuthAction(() => onAuthenticated || (() => {}));
  }, [currentUser]);

  const loginWithPhoneOtp = useCallback(async (phone, otp, profile = {}) => {
    let result;
    try {
      result = await authApi.verifyPhoneOtp(phone, otp, profile);
    } catch (err) {
      return {
        success: false,
        error: isOfflineError(err)
          ? "Could not reach the server — phone sign-in is unavailable right now."
          : err?.message || "Invalid or expired OTP",
      };
    }
    const apiUser = { ...result.user, id: result.user._id || result.user.id };
    setCurrentUser(apiUser);
    setUsers((previous) => previous.some((user) => user.id === apiUser.id) ? previous.map((user) => user.id === apiUser.id ? { ...user, ...apiUser } : user) : [...previous, apiUser]);
    return { success: true };
  }, []);


  const updateProfile = useCallback(
    async (updates) => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        return { ...prev, ...updates };
      });
      setUsers((uPrev) =>
        uPrev.map((u) => (u.id === currentUser?.id ? { ...u, ...updates } : u))
      );
      try {
        const res = await authApi.updateProfile(updates);
        const apiUser = { ...res, id: res._id || res.id };
        setCurrentUser(apiUser);
        return { success: true, user: apiUser };
      } catch (err) {
        console.warn("Could not save profile to backend:", err);
        return { success: false, error: err.message };
      }
    },
    [currentUser?.id]
  );

  const addAddress = useCallback(
    async (address) => {
      const addressId = address.id || `addr-${Date.now().toString(36)}`;
      const newAddress = {
        ...address,
        id: addressId,
        street: address.street || address.address1 || "",
      };

      setCurrentUser((prev) => {
        if (!prev) return null;
        const existing = prev.addresses || [];
        const isEdit = existing.some((a) => a.id === newAddress.id);
        const updatedList = isEdit
          ? existing.map((a) => (a.id === newAddress.id ? { ...a, ...newAddress } : (newAddress.isDefault ? { ...a, isDefault: false } : a)))
          : [...existing.map((a) => (newAddress.isDefault ? { ...a, isDefault: false } : a)), newAddress];
        return { ...prev, addresses: updatedList };
      });

      try {
        const res = await authApi.addAddress(newAddress);
        if (res?.addresses) {
          setCurrentUser((prev) => (prev ? { ...prev, addresses: res.addresses } : null));
        }
      } catch (err) {
        console.warn("Could not save address to backend:", err);
      }
    },
    []
  );

  const removeAddress = useCallback(
    async (addressId) => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const addresses = (prev.addresses || []).filter((a) => a.id !== addressId);
        return { ...prev, addresses };
      });

      try {
        const res = await authApi.removeAddress(addressId);
        if (res?.addresses) {
          setCurrentUser((prev) => (prev ? { ...prev, addresses: res.addresses } : null));
        }
      } catch (err) {
        console.warn("Could not remove address from backend:", err);
      }
    },
    []
  );

  const setDefaultAddress = useCallback(
    async (addressId) => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const addresses = (prev.addresses || []).map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }));
        return { ...prev, addresses };
      });

      try {
        const res = await authApi.setDefaultAddress(addressId);
        if (res?.addresses) {
          setCurrentUser((prev) => (prev ? { ...prev, addresses: res.addresses } : null));
        }
      } catch (err) {
        console.warn("Could not set default address on backend:", err);
      }
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
        requestPhoneLogin,
        loginWithPhoneOtp,
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
      <PhoneOtpDialog open={!!phoneAuthAction} onClose={() => setPhoneAuthAction(null)} onAuthenticated={() => { const action = phoneAuthAction; setPhoneAuthAction(null); action?.(); }} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
