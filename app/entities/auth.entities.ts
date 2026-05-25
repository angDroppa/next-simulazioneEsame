export type AuthResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
    roleName: string
  }
}