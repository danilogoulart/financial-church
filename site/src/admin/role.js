import { createContext } from 'react'

// Contexto de permissão por papel. Flags:
//   isAdmin          — admin/presidencia (gerencia usuários, config sensível)
//   canWriteFinance  — edita financeiro (admin/presidencia/tesoureiro)
//   canWriteMembers  — edita membros (admin/presidencia/secretaria)
//   canReadFinance   — vê financeiro (admin/presidencia/tesoureiro/consulta)
//   canEditSite      — edita o site (admin/presidencia/editor)
export const RoleContext = createContext({
  role: 'consulta',
  isAdmin: false,
  canWriteFinance: false,
  canWriteMembers: false,
  canReadFinance: false,
  canEditSite: false
})
