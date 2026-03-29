import { PrismaClient, TransactionType, ExpenseSubtype } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear empresa por defecto (Veltrium Tech)
  const veltrium = await prisma.company.upsert({
    where: { rut: '76.123.456-7' }, // Placeholder RUT para la MVP
    update: {},
    create: {
      name: 'Veltrium Tech SpA',
      rut: '76.123.456-7',
      city: 'Iquique',
      email: 'contacto@veltriumgroup.cl'
    },
  })

  // === CATEGORÍAS DE INGRESOS ===
  const INCOME_CATEGORIES = [
    'Servicio Mant. Eléctrica',
    'Servicio Automatización',
    'Servicio Instrumentación',
    'Servicio Refrigeración',
    'Consultoría Técnica',
    'Proyecto Llave en Mano',
    'Venta Repuestos',
    'Otro Ingreso'
  ]

  for (let i = 0; i < INCOME_CATEGORIES.length; i++) {
    await prisma.transactionCategory.upsert({
      where: {
        name_companyId: {
          name: INCOME_CATEGORIES[i],
          companyId: veltrium.id
        }
      },
      update: {},
      create: {
        name: INCOME_CATEGORIES[i],
        type: TransactionType.INCOME,
        sortOrder: i,
        companyId: veltrium.id
      }
    })
  }

  // === CATEGORÍAS DE COSTOS DIRECTOS ===
  const DIRECT_COSTS = [
    'Repuestos/Materiales',
    'Honorarios Subcontrato',
    'EPP/Seguridad',
    'Transporte',
    'Combustible'
  ]

  for (let i = 0; i < DIRECT_COSTS.length; i++) {
    await prisma.transactionCategory.upsert({
      where: {
        name_companyId: {
          name: DIRECT_COSTS[i],
          companyId: veltrium.id
        }
      },
      update: {},
      create: {
        name: DIRECT_COSTS[i],
        type: TransactionType.EXPENSE,
        subtype: ExpenseSubtype.DIRECT_COST,
        sortOrder: i,
        companyId: veltrium.id
      }
    })
  }

  // === CATEGORÍAS DE GASTOS OPERACIONALES ===
  const OPERATIONAL_EXPENSES = [
    'Arriendo Oficina/Bodega',
    'Servicios Básicos',
    'Herramientas',
    'Software/Licencias',
    'Marketing',
    'Contabilidad/Legal',
    'Seguros',
    'Patente/Permisos',
    'Sueldo Personal',
    'Capacitación',
    'Otro Egreso'
  ]

  for (let i = 0; i < OPERATIONAL_EXPENSES.length; i++) {
    await prisma.transactionCategory.upsert({
      where: {
        name_companyId: {
          name: OPERATIONAL_EXPENSES[i],
          companyId: veltrium.id
        }
      },
      update: {},
      create: {
        name: OPERATIONAL_EXPENSES[i],
        type: TransactionType.EXPENSE,
        subtype: ExpenseSubtype.OPERATIONAL,
        sortOrder: i + DIRECT_COSTS.length, // Para listarlos después de los costos
        companyId: veltrium.id
      }
    })
  }

  // Crear Usuario Admin (MVP)
  // Usar hash bcrypt de "admin123" ($2b$10$X...)
  await prisma.user.upsert({
    where: { email: 'admin@veltriumgroup.cl' },
    update: {},
    create: {
      email: 'admin@veltriumgroup.cl',
      name: 'Administrador (CEO)',
      password: '$2b$10$YourBcryptHashGoesHereForSecurity', // Cambiar después
      role: 'ADMIN',
      companyId: veltrium.id
    }
  })

  console.log('Seed ejecutado correctamente: Empresa, Categorías y Usuario Admin creados.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
