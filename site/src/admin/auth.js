import { supabase } from './supabaseClient'

// Camada única de autenticação. Componentes NÃO devem chamar supabase.auth
// direto — sempre por aqui. Isola o provedor (Supabase) para baratear uma
// futura migração (ex.: AWS Cognito): trocaria só este arquivo.

// Sessão atual (ou null).
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Registra um listener de mudança de sessão. Retorna função para desinscrever.
// callback recebe (event, session).
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session))
  return () => data.subscription.unsubscribe()
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  })
  if (error) throw error
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
