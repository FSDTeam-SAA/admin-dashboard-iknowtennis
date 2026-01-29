import axios from "axios"
import { getSession, signOut } from "next-auth/react"

const baseURL = process.env.NEXT_PUBLIC_BASE_URL

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use(async (config) => {
  const session = (await getSession()) as any
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut({ callbackUrl: "/login" })
    }
    return Promise.reject(error)
  },
)

export default api

// API Functions add chenge password function here
export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
  forgetPassword: (data: any) => api.post("/auth/forget-password", data),
  verifyOtp: (data: any) => api.post("/auth/verify-otp", data),
  resetPassword: (data: any) => api.post("/auth/reset-password", data),
  changePassword: (data: any) => api.patch("/auth/change-password", data),
}

export const dashboardApi = {
  getOverview: (range?: string) => {
    const query = range ? `?range=${encodeURIComponent(range)}` : ""
    return api.get(`/dashboard/overview${query}`).then((res) => res.data)
  },
  getUsers: (page = 1, limit = 10) =>
    api.get(`/dashboard/user-list?page=${page}&limit=${limit}`).then((res) => res.data),
  getRanking: (page = 1, limit = 10) =>
    api.get(`/dashboard/ranking?page=${page}&limit=${limit}`).then((res) => res.data),
}

export const quizCategoryApi = {
  getAll: (page = 1) => api.get(`/quiz-categories?page=${page}`).then((res) => res.data),
  create: (data: any) => {
    const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
    return api.post("/quiz-categories", data, config)
  },
  update: (id: string, data: any) => {
    const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
    return api.put(`/quiz-categories/${id}`, data, config)
  },
  delete: (id: string) => api.delete(`/quiz-categories/${id}`),
}

export const quizApi = {
  getAll: (page = 1) => api.get(`/quiz?page=${page}`).then((res) => res.data),
  create: (data: any) => api.post("/quiz", data),
  update: (id: string, data: any) => api.put(`/quiz/${id}`, data),
  getById: (id: string) => api.get(`/quiz/${id}`).then((res) => res.data),
  delete: (id: string) => api.delete(`/quiz/${id}`),
}

export const subscriptionPlanApi = {
  getAll: () => api.get("/subscription-plan").then((res) => res.data),
  getById: (id: string) => api.get(`/subscription-plan/${id}`).then((res) => res.data),
  create: (data: any) => api.post("/subscription-plan", data),
  update: (id: string, data: any) => api.put(`/subscription-plan/${id}`, data),
  delete: (id: string) => api.delete(`/subscription-plan/${id}`),
}

export const userApi = {
  getProfile: (id: string) => api.get(`/user/${id}`).then((res) => res.data),
  updateProfile: (data: any) => api.put("/user/profile", data),
}

export const jokeApi = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/joke?page=${page}&limit=${limit}`).then((res) => res.data),
  create: (data: any) => {
    const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
    return api.post("/joke", data, config)
  },
  update: (id: string, data: any) => {
    const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
    return api.put(`/joke/${id}`, data, config)
  },
  delete: (id: string) => api.delete(`/joke/${id}`),
}
