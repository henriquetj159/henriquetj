import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@ciclo/database'
import { checkRateLimit, getClientIp } from '@ciclo/auth'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateCheck = checkRateLimit(`register:${ip}`)
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, password } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome e obrigatorio e deve ter no minimo 2 caracteres.' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email e obrigatorio.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email invalido.' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Senha e obrigatoria e deve ter no minimo 8 caracteres.' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ja esta cadastrado.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with default role USER
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Conta criada com sucesso.', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER]', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    )
  }
}
