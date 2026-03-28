# PROYECTO: Veltrium Tech ERP — Módulo Financiero (MVP)

## CONTEXTO DE NEGOCIO

Estoy construyendo un ERP modular para **Veltrium Tech** (Cápsula 1 de Veltrium Group), una empresa de servicios técnicos industriales ubicada en Iquique, Chile. Operamos en el sector minero ofreciendo mantención eléctrica, automatización, instrumentación y refrigeración industrial.

Este es el **PRIMER MÓDULO** del ERP: el sistema financiero-contable. Los módulos futuros (CRM, Operaciones, RRHH, Inventario) se conectarán a esta misma base de datos. El modelo de datos debe ser extensible desde el día 1.

**Visión a largo plazo:** Este sistema debe poder crecer desde 1 usuario (yo) hasta un equipo de 50+ personas con múltiples cápsulas de negocio. No estamos construyendo una app desechable — estamos construyendo la columna vertebral digital de un holding empresarial.

---

## STACK TECNOLÓGICO

- **Framework:** Next.js 14+ (App Router, Server Components, Server Actions)
- **Lenguaje:** TypeScript estricto (`strict: true` en tsconfig)
- **Base de datos:** PostgreSQL (Neon o Supabase como hosting — ambos tienen tier gratuito)
- **ORM:** Prisma (tipado automático, migraciones versionadas)
- **UI:** shadcn/ui + Tailwind CSS
- **Autenticación:** NextAuth.js con credenciales (después se agregará Google/Microsoft OAuth)
- **Gráficos:** Recharts para dashboards
- **Validación:** Zod para validación de formularios y API
- **Deploy:** Vercel (plan gratuito inicial)

---

## PRINCIPIOS ARQUITECTÓNICOS (para escalar sin reescribir)

### 1. Separación en capas
```
Presentation (React Components) 
    → Application (Server Actions / API Routes)
        → Domain (Business Logic / Services)
            → Infrastructure (Prisma / Database)
```

Cada capa solo habla con la de abajo. Los componentes de React NUNCA importan Prisma directamente. Todo pasa por Server Actions o API routes que llaman a funciones de servicio.

### 2. Patrón Service Layer
Crear un archivo de servicio por dominio:
- `src/services/transactions.ts` — toda la lógica de negocio de transacciones
- `src/services/debts.ts` — cálculos de saldos, intereses, pagos
- `src/services/reports.ts` — generación de reportes mensuales
- `src/services/tax.ts` — cálculos de IVA (débito, crédito, a pagar)

Los Server Actions solo validan input (con Zod) y llaman al servicio correspondiente. Así, si mañana queremos exponer una API REST o GraphQL, reutilizamos los servicios sin tocar nada.

### 3. Multi-tenancy preparada
Aunque hoy es solo Veltrium Tech, el schema debe tener un campo `companyId` en todas las tablas transaccionales. Así, cuando agreguemos Cápsula 2 y Cápsula 3, filtramos por empresa sin cambiar la estructura.

### 4. Event sourcing ligero
Cada transacción es inmutable una vez creada. En lugar de editar, se crea un "ajuste" que referencia la transacción original. Esto deja un trail de auditoría completo — fundamental para contabilidad.

---

## MODELO DE DATOS (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// CORE — Entidades compartidas por todos los módulos
// ============================================================

model Company {
  id          String   @id @default(cuid())
  name        String   // "Veltrium Tech SpA"
  rut         String   @unique
  address     String?
  city        String?  // "Iquique"
  phone       String?
  email       String?
  logo        String?  // URL
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users        User[]
  transactions Transaction[]
  categories   TransactionCategory[]
  debts        Debt[]
  clients      Client[]
  snapshots    MonthlySnapshot[]
  assets       Asset[]
  liabilities  Liability[]
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String   // bcrypt hash
  role        Role     @default(OPERATOR)
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transactions Transaction[]
}

enum Role {
  ADMIN
  ACCOUNTANT
  OPERATOR
}

// ============================================================
// MÓDULO FINANCIERO
// ============================================================

model TransactionCategory {
  id        String          @id @default(cuid())
  name      String          // "Servicio Mant. Eléctrica"
  type      TransactionType // INCOME or EXPENSE
  subtype   ExpenseSubtype? // DIRECT_COST or OPERATIONAL (only for expenses)
  isActive  Boolean         @default(true)
  sortOrder Int             @default(0)
  companyId String
  company   Company         @relation(fields: [companyId], references: [id])

  transactions Transaction[]

  @@unique([name, companyId])
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum ExpenseSubtype {
  DIRECT_COST
  OPERATIONAL
}

model Transaction {
  id              String            @id @default(cuid())
  date            DateTime
  type            TransactionType
  categoryId      String
  category        TransactionCategory @relation(fields: [categoryId], references: [id])
  description     String
  amount          Int               // Monto bruto CON IVA (en CLP, sin decimales)
  documentType    DocumentType      @default(NO_DOCUMENT)
  taxAmount       Int               @default(0) // IVA calculado
  netAmount       Int               // Monto neto SIN IVA
  paymentMethod   PaymentMethod     @default(TRANSFER)
  clientSupplier  String?           // Texto libre (después se vinculará a Client)
  clientId        String?           // FK opcional a Client
  client          Client?           @relation(fields: [clientId], references: [id])
  notes           String?
  monthYear       String            // "2026-04" — calculado al crear
  
  // Auditoría
  createdById     String
  createdBy       User              @relation(fields: [createdById], references: [id])
  companyId       String
  company         Company           @relation(fields: [companyId], references: [id])
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  isVoided        Boolean           @default(false) // Soft delete para auditoría
  voidReason      String?

  @@index([companyId, monthYear])
  @@index([companyId, type])
  @@index([companyId, categoryId])
}

enum DocumentType {
  INVOICE     // Factura — genera crédito/débito IVA
  RECEIPT     // Boleta — IVA incluido pero NO genera crédito fiscal
  NO_DOCUMENT // Sin documento
}

enum PaymentMethod {
  TRANSFER
  CASH
  CHECK
  CREDIT_30
  CREDIT_60
}

model Debt {
  id             String       @id @default(cuid())
  name           String       // "Crédito Banco Itaú"
  initialBalance Int          // Saldo inicial
  currentBalance Int          // Saldo actual (se recalcula)
  monthlyRate    Float        // Tasa mensual (ej: 0.021 = 2.1%)
  basePayment    Int          // Cuota base mensual
  totalPayments  Int?         // Número total de cuotas (null = rotativo)
  startDate      DateTime
  status         DebtStatus   @default(ACTIVE)
  companyId      String
  company        Company      @relation(fields: [companyId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  payments DebtPayment[]
}

enum DebtStatus {
  ACTIVE
  PAID
  DELINQUENT
  RESTRUCTURED
}

model DebtPayment {
  id               String   @id @default(cuid())
  debtId           String
  debt             Debt     @relation(fields: [debtId], references: [id])
  month            String   // "2026-04"
  amountPaid       Int      // Lo que realmente se pagó
  interestCharged  Int      // Interés calculado del mes
  principalPaid    Int      // Capital amortizado (pago - interés)
  balanceAfter     Int      // Saldo después del pago
  createdAt        DateTime @default(now())

  @@unique([debtId, month])
}

model MonthlySnapshot {
  id                      String   @id @default(cuid())
  month                   String   @unique // "2026-04"
  totalIncome             Int
  totalDirectCosts        Int
  grossMargin             Int
  grossMarginPercent      Float
  totalOperationalExpenses Int
  netProfit               Int
  netMarginPercent        Float
  taxDebit                Int      // IVA Débito
  taxCredit               Int      // IVA Crédito
  taxPayable              Int      // IVA a pagar
  totalDebtBalance        Int      // Deuda total al cierre
  totalDebtPaid           Int      // Total pagado a deudas en el mes
  jobsCompleted           Int      @default(0)
  newClients              Int      @default(0)
  notes                   String?
  companyId               String
  company                 Company  @relation(fields: [companyId], references: [id])
  createdAt               DateTime @default(now())

  @@unique([month, companyId])
}

// ============================================================
// BALANCE GENERAL
// ============================================================

model Asset {
  id        String    @id @default(cuid())
  name      String    // "Caja / Cuenta empresa"
  value     Int       // Valor actual
  type      AssetType
  companyId String
  company   Company   @relation(fields: [companyId], references: [id])
  updatedAt DateTime  @updatedAt
}

enum AssetType {
  CURRENT      // Corriente (caja, cuentas por cobrar)
  NON_CURRENT  // No corriente (equipos, vehículos)
}

model Liability {
  id        String         @id @default(cuid())
  name      String
  value     Int
  type      LiabilityType
  companyId String
  company   Company        @relation(fields: [companyId], references: [id])
  updatedAt DateTime       @updatedAt
}

enum LiabilityType {
  CURRENT      // Corriente (< 1 año)
  NON_CURRENT  // No corriente (> 1 año)
}

// ============================================================
// CRM (estructura preparada, se llena después)
// ============================================================

model Client {
  id          String   @id @default(cuid())
  name        String
  rut         String?
  contactName String?
  phone       String?
  email       String?
  address     String?
  city        String?
  notes       String?
  isActive    Boolean  @default(true)
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transactions Transaction[]

  @@unique([rut, companyId])
}
```

---

## CATEGORÍAS INICIALES (Seed)

### Ingresos:
- Servicio Mant. Eléctrica
- Servicio Automatización
- Servicio Instrumentación
- Servicio Refrigeración
- Consultoría Técnica
- Proyecto Llave en Mano
- Venta Repuestos
- Otro Ingreso

### Egresos — Costos Directos:
- Repuestos/Materiales
- Honorarios Subcontrato
- EPP/Seguridad
- Transporte
- Combustible

### Egresos — Gastos Operacionales:
- Arriendo Oficina/Bodega
- Servicios Básicos
- Herramientas
- Software/Licencias
- Marketing
- Contabilidad/Legal
- Seguros
- Patente/Permisos
- Sueldo Personal
- Capacitación
- Otro Egreso

---

## PÁGINAS Y FUNCIONALIDADES

### 1. Dashboard (`/dashboard`)
- KPIs en cards grandes: Ingresos del mes, Egresos del mes, Utilidad neta, Margen bruto %
- Gráfico de barras: Ingresos vs Egresos últimos 6 meses (Recharts)
- Gráfico de línea: Evolución de deuda total
- Lista: Últimos 5 movimientos registrados
- Alerta roja si hay deudas en mora o IVA pendiente de pago

### 2. Registro de Movimientos (`/transactions`)
- Tabla con todos los movimientos, filtrable por mes, tipo, categoría
- Formulario modal para agregar nuevo movimiento con campos:
  - Fecha, Tipo (INGRESO/EGRESO), Categoría (filtrada por tipo seleccionado)
  - Descripción, Monto bruto (con IVA incluido)
  - Tipo documento (FACTURA/BOLETA/SIN DOCUMENTO) — **CRÍTICO para IVA**
  - IVA y Neto se calculan automáticamente:
    - FACTURA: `IVA = Math.round(monto / 1.19 * 0.19)`, `Neto = monto - IVA`
    - BOLETA: `IVA = 0`, `Neto = monto` (no genera crédito fiscal)
    - SIN DOCUMENTO: `IVA = 0`, `Neto = monto`
  - Método de pago, Cliente/Proveedor, Notas
- Editar (solo si no está en un mes cerrado) y anular (soft delete con razón)
- Exportar a CSV
- Búsqueda por texto en descripción y notas

### 3. Resumen Mensual (`/monthly-summary`)
- Selector de mes (YYYY-MM) con navegación rápida (< mes anterior | mes siguiente >)
- Sección INGRESOS: tabla por categoría con montos y porcentajes
- Sección COSTOS DIRECTOS: tabla por categoría
- **MARGEN BRUTO** = Ingresos Netos - Costos Directos (destacado, meta > 40%)
- Sección GASTOS OPERACIONALES: tabla por categoría
- **UTILIDAD NETA** = Margen Bruto - Gastos Operacionales
- Sección CONTROL IVA:
  - IVA Débito (cobrado en facturas de venta)
  - IVA Crédito (pagado en facturas de compra)
  - **IVA A PAGAR = Débito - Crédito** (lo que se declara al SII)
- Botón "Cerrar mes y guardar snapshot"

### 4. Control de Deudas (`/debts`)
- Lista de deudas activas con: nombre, saldo actual, tasa, cuota, estado
- Al hacer click en una deuda: historial de pagos mes a mes
- Formulario para registrar pago mensual
- Cálculo automático al registrar pago:
  - `interestCharged = balanceBefore * monthlyRate`
  - `principalPaid = amountPaid - interestCharged`
  - `balanceAfter = balanceBefore - principalPaid`
- Gráfico de evolución de deuda total (línea descendente = progreso)
- Badge de estado: ACTIVO (verde), MOROSO (rojo), PAGADO (gris)

### 5. Historial (`/history`)
- Tabla con una fila por mes: ingresos, costos, margen, gastos, utilidad, deuda total
- Gráfico de tendencia de utilidad neta (línea)
- Gráfico de composición de ingresos (stacked bar por categoría)
- KPIs acumulados: total facturado, margen promedio, utilidad acumulada

### 6. Balance General (`/balance`)
- Lado izquierdo: ACTIVOS (corrientes y no corrientes) — editables
- Lado derecho: PASIVOS — vinculados automáticamente a deudas activas
- PATRIMONIO NETO = Activos - Pasivos (destacado)
- Indicadores: ratio de endeudamiento, liquidez corriente

---

## REGLAS DE NEGOCIO (implementar en la capa de servicios)

1. `monthYear` se calcula automáticamente: `format(date, 'yyyy-MM')`
2. El IVA se calcula SOLO si `documentType === 'INVOICE'`. Boletas y sin documento = IVA 0
3. Cada categoría de egreso tiene `subtype`: `DIRECT_COST` o `OPERATIONAL` — esto determina dónde aparece en el estado de resultados
4. Margen bruto = `(ingresoNeto - costosDirectos) / ingresoNeto * 100`
5. Los saldos de deuda se recalculan cuando se registra un pago
6. IVA a pagar al SII = IVA Débito (facturas de venta) - IVA Crédito (facturas de compra)
7. Las transacciones nunca se eliminan — se anulan (`isVoided = true`) con razón obligatoria
8. El snapshot mensual se genera manualmente al "cerrar" el mes

---

## DISEÑO Y UX

- **Branding:** Veltrium Tech (bajo Veltrium Group)
  - Color primario (fondo/sidebar): Dark Navy `#1A324A`
  - Color secundario (textos fuertes): Deep Navy `#0D1B2A`
  - Acento principal (botones/highlights): Gold `#B8860B`
  - Acento hover/activo: Light Gold `#D4A84B`
  - Acento sutil (badges/borders): Muted Gold `#AB8755`
  - Texto sobre navy: White `#FFFFFF` y Gold `#D4A84B`
  - Background claro (contenido): `#F8F9FA`
  - El logo de Veltrium Group usa la paleta Navy + Gold metalizado
  - La identidad visual debe transmitir: solidez, profesionalismo minero, confianza
- Sidebar de navegación colapsable con íconos + labels
- **Responsive obligatorio:** Se usa desde celular en terreno para registrar gastos
- Tema oscuro/claro (usar CSS variables de shadcn)
- Idioma: Español (Chile)
- Moneda: CLP, formato `Intl.NumberFormat('es-CL')` con separador de miles (punto)
- Fechas: formato DD/MM/YYYY con `date-fns` locale `es`
- Loading states con Skeleton components de shadcn
- Toast notifications para feedback de acciones (sonner)

---

## ESTRUCTURA DE CARPETAS

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          # Sidebar + header
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── monthly-summary/page.tsx
│   │   ├── debts/page.tsx
│   │   ├── history/page.tsx
│   │   └── balance/page.tsx
│   ├── api/                    # API routes (para futuras integraciones)
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # shadcn components
│   ├── dashboard/              # KPI cards, charts
│   ├── transactions/           # Table, form, filters
│   ├── debts/                  # Debt cards, payment form
│   ├── reports/                # Monthly summary tables
│   └── shared/                 # Sidebar, header, currency formatter
├── services/                   # Business logic (NO Prisma imports in components)
│   ├── transactions.ts
│   ├── debts.ts
│   ├── reports.ts
│   ├── tax.ts
│   └── balance.ts
├── actions/                    # Server Actions (validate + call service)
│   ├── transactions.ts
│   ├── debts.ts
│   └── reports.ts
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── utils.ts                # Formatters, helpers
│   ├── validators.ts           # Zod schemas
│   └── constants.ts            # Enums, config
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── types/
│   └── index.ts                # Shared TypeScript types
└── hooks/                      # Custom React hooks
    ├── use-currency.ts
    └── use-month-selector.ts
```

---

## PRIORIDAD DE CONSTRUCCIÓN (seguir este orden)

### Fase 1: Fundación (Día 1-2)
1. Setup proyecto Next.js + TypeScript + Tailwind + shadcn
2. Configurar Prisma con PostgreSQL (Neon/Supabase)
3. Crear schema completo + migraciones
4. Seed de categorías y empresa base
5. Layout principal con sidebar y navegación

### Fase 2: CRUD Core (Día 3-5)
6. Página de Transacciones: tabla + formulario de creación
7. Lógica de IVA según tipo de documento
8. Filtros por mes, tipo, categoría
9. Edición y anulación de transacciones

### Fase 3: Reportes (Día 6-8)
10. Resumen Mensual auto-calculado
11. Control de IVA (débito - crédito = a pagar)
12. Dashboard con KPIs y gráficos Recharts
13. Control de Deudas con cálculo de saldos

### Fase 4: Historial y Balance (Día 9-10)
14. Historial mensual con snapshots
15. Balance General con activos/pasivos
16. Gráficos de tendencia

### Fase 5: Polish (Día 11-14)
17. Autenticación con NextAuth
18. Responsive / móvil
19. Exportar CSV
20. Manejo de errores y edge cases

---

## NOTAS PARA EL AGENTE

- Construir paso a paso. Probar cada módulo antes de pasar al siguiente.
- Todo texto visible debe estar en español (Chile). Variables y código en inglés.
- Los montos son siempre enteros (CLP no tiene decimales).
- Usar Server Components por defecto. Client Components solo cuando hay interactividad.
- No instalar dependencias innecesarias. El stack definido arriba es suficiente.
- Priorizar que FUNCIONE sobre que se vea bonito. La UI se pule después.
