import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

class TransportService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      const url = config.url ?? "";
      const isAbsolute = /^https?:\/\//i.test(url);
      if (!isAbsolute) {
        const cleaned = url.replace(/^\/+/, "");
        config.url = /^api\//i.test(cleaned) ? `/${cleaned}` : `/api/${cleaned}`;
      }

      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }

  private handleUnauthorized(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/accounts/login";
    }
  }

  public get axios(): AxiosInstance {
    return this.instance;
  }
}

export const transport = new TransportService();
