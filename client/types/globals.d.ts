export {}

// Create a type for the roles
export type Roles = 'ADMIN' | 'MEMBER'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}