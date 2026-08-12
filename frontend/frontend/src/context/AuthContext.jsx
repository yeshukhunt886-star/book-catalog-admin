import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================
  // LOAD USER WHEN APP STARTS
  // =========================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    const token =
      localStorage.getItem("token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error(
          "Invalid stored user:",
          error
        );

        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // =========================================
  // LOGIN
  // =========================================

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      console.log(
        "LOGIN RESPONSE:",
        response.data
      );

      const responseData =
        response.data?.data ||
        response.data;

      // Find token
      const token =
        responseData?.token ||
        responseData?.accessToken ||
        responseData?.access_token;

      // Find user
      const loggedInUser =
        responseData?.user ||
        responseData?.admin ||
        null;

      if (!token) {
        throw new Error(
          "Login successful, but JWT token was not returned by backend."
        );
      }

      // Save token
      localStorage.setItem(
        "token",
        token
      );

      // Save user
      if (loggedInUser) {
        localStorage.setItem(
          "user",
          JSON.stringify(loggedInUser)
        );

        setUser(loggedInUser);
      } else {
        const userData = {
          email,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

        setUser(userData);
      }

      return response.data;

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error.response?.data || error
      );

      throw error;
    }
  };

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser(null);
  };

  // =========================================
  // CONTEXT VALUE
  // =========================================

  const value = {
    user,
    setUser,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;