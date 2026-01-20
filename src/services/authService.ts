import type { User } from '@/types';

// Supabase
// NOTE: no reactive imports needed in this service
import { supabase } from '@/lib/supabaseClient'
import { mapSupabaseUserToUser } from '@/mappers/userMapper'

export type AuthLoginResponse = {
  user?: User | null;
  token?: string | null;
  [key: string]: unknown;
};


export const authService = {
  // login method uses supabase auth to sign in
  // and fetch user profile based on the authenticated user
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
        .select('*, Institution(*)')
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
      const { email, password, firstName = '', lastName = '',  role, institutionId } = userData

      if (!institutionId) {
        throw new Error('Institution is required')
      }

      // Sign up with Supabase Auth — no metadata,
      // let public.users upsert handle profile one of the perks of supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      const authUser = data.user
      const session = data.session

      if (!authUser) throw new Error('Registration failed')

      // Wait a moment for the trigger to create the user profile
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update the user profile in the users table with institution_id
      // Explicitly insert (or upsert) into users table
      // this does adding auth.user data to users table
      // and does adding all profile fields to public.users table
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email,
          first_name: firstName,
          last_name: lastName,
          institution_id: institutionId || null,
          role: role ?? 'student',
        }, { onConflict: 'id' })
        .select()

      if (upsertError) {
        console.error('Failed to upsert user profile:', upsertError)
        throw upsertError
      }

      // Fetch the user profile from the users table
      const { data: profileData, error: userError } = await supabase
        .from('users')
        .select('*, Institution(*)')
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
        .select('*, Institution(*)')
        .eq('id', authUser.id)
        .single()

      if (userError) throw userError
      if (!userData) throw new Error('User profile not found')

      if (!userData.email && authUser.email) {
        userData.email = authUser.email;
      }

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
