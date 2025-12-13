import type { User } from '@/types';
import { UserRole } from '@/types'

// Supabase
// NOTE: no reactive imports needed in this service
import { supabase } from '@/lib/supabaseClient'

export type AuthLoginResponse = {
  user?: User | null;
  token?: string | null;
  [key: string]: unknown;
};

/**
 * Map a user row from the `users` table to the application's `User` type.
 */
function mapSupabaseUserToUser(userData: Record<string, unknown>): User | null {
  if (!userData || !userData.id) return null

  const firstName = (userData.first_name ?? '') as string
  const lastName = (userData.last_name ?? '') as string
  const email = (userData.email ?? '') as string
  const name = (`${firstName} ${lastName}`.trim() || email || '')

  return {
    userId: String(userData.id),
    firstName,
    lastName,
    name,
    role: (userData.role as UserRole) ?? UserRole.STUDENT,
    institutionId: userData.institution_id != null ? String(userData.institution_id) : undefined,
  }
}


export const authService = {

  async login(email: string, password: string): Promise<AuthLoginResponse> {
    try {
      // Use Supabase Auth to sign in
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const authUser = data.user
      const session = data.session

      if (!authUser || !session) throw new Error('Login failed')

      // Fetch the user profile from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        console.warn('Failed to fetch user profile, using auth user data:', userError)
      }

      const user = userData ? mapSupabaseUserToUser(userData) : null
      if (!user) throw new Error('Failed to load user profile')

      const result: AuthLoginResponse = {
        token: session.access_token,
        user,
      }
      return result
    } catch (err) {
      console.error('authService.login error:', err)
      throw err
    }
  },

  async register(userData: Partial<User> & { email: string; password: string }): Promise<{ user: User; token: string }> {
    try {
      const { email, password, firstName = '', lastName = '', name = '' } = userData

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            user_name: name || email,
          },
        },
      })

      if (error) throw error

      const authUser = data.user
      const session = data.session

      if (!authUser) throw new Error('Registration failed')

      // Wait a moment for the trigger to create the user profile
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Fetch the user profile from the users table
      const { data: profileData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        console.warn('Failed to fetch new user profile:', userError)
      }

      // exception thrown here
      const user = profileData ? mapSupabaseUserToUser(profileData) : null
      if (!user) throw new Error('Registration succeeded but profile creation failed')

      const token = session?.access_token ?? ''

      return { user, token }
    } catch (err) {
      console.error('authService.register error:', err)
      throw err
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      // Get the current authenticated user from Supabase
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error

      const authUser = data.user
      if (!authUser) throw new Error('No authenticated user')

      // Fetch the user profile from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) throw userError
      if (!userData) throw new Error('User profile not found')

      const user = mapSupabaseUserToUser(userData)
      if (!user) throw new Error('Failed to map user data')

      return user
    } catch (err) {
      console.error('authService.getCurrentUser error:', err)
      throw err
    }
  },

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      console.error('authService.logout error:', err)
      throw err
    }
  }
};
