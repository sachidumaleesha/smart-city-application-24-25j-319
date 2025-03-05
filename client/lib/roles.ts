import { Roles } from '@/types/globals'
import { auth } from '@clerk/nextjs/server'

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth()

  // in the return I want to pass many data
  return {
    role: sessionClaims?.metadata.role === role,
    roleName: sessionClaims?.metadata.role,
  }
}