import { createContext } from 'react'

// Contexto de permissão. canWrite: admin/tesoureiro. isAdmin: gerencia usuários.
export const RoleContext = createContext({ role: 'consulta', canWrite: false, isAdmin: false })
