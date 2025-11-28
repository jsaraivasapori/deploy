import { api } from "@/lib/api";
import type { LoginDto, LoginResponse } from "../types/AuthServiceTypes";

export const authService = {
  async login(credentials: LoginDto): Promise<void> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);

    localStorage.setItem("authToken", data.authToken);
  },

  logout() {
    localStorage.removeItem("authToken");
  },
};
