'use server'

import prisma from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'Contraseña requerida.'),
})

export async function loginAction(prevState: any, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Credenciales inválidas.' }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  })

  if (!user || !user.isActive) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  await createSession({
    id: user.id,
    companyId: user.companyId,
    role: user.role,
    name: user.name,
    email: user.email,
  })

  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}
