# Manual de Operaciones Financieras: Veltrium Tech ERP

---

**Veltrium Group | Cápsula 1: Veltrium Tech SpA**  
*Módulo Financiero y Control de Gestión (B2B)*

---

Este manual está diseñado para capacitar a administradores, contadores y operadores en el correcto uso del **Sistema Financiero** de Veltrium Tech, la columna vertebral corporativa del grupo.

## Índice
1. [Filosofía Contable del ERP](#1-filosof%C3%ADa-contable-del-erp)
2. [El Dashboard: Entendiendo tus Números](#2-el-dashboard-entendiendo-tus-n%C3%BAmeros)
3. [Registro de Transacciones Diarias](#3-registro-de-transacciones-diarias)
4. [Tributación y Control de IVA](#4-tributaci%C3%B3n-y-control-de-iva)
5. [Cierre Mensual (Snapshot)](#5-cierre-mensual-snapshot)
6. [Manejo de Activos y Deudas (Balance)](#6-manejo-de-activos-y-deudas-balance)
7. [Simulador de Rentabilidad](#7-simulador-de-rentabilidad)

---

## 1. Filosofía Contable del ERP

El ERP Veltrium está diseñado bajo la metodología corporativa "Mid-Market", separando estrictamente:

- **Costos Directos:** Todo gasto que influye directamente en ejecutar un servicio (Repuestos, subcontratos en terreno, viáticos para una faena específica).  
- **Gastos Operacionales:** Todo egreso fijo de la empresa para funcionar (Arriendo de tu oficina, sueldo del programador, patentes municipales).  
- **Activos Fijos:** Compras de bienes duraderos (Un camión 4x4 o un fusionador de fibra óptica NO se registran como egreso. Son un patrimonio).

> [!CAUTION] 
> Jamás ingrese un equipo pesado de >$1M como "Gasto". Eso distorsiona la rentabilidad del mes. Ingréselo en el Módulo de **Balance General** como *Activo*.

---

## 2. El Dashboard: Entendiendo tus Números

El **Dashboard** es tu visión general en tiempo real. 

### Devengado vs Flujo de Caja
En B2B y Minería, las corporaciones pagan a 30, 60 o 90 días.
* **Métrica [Devengado]:** Refleja la totalidad facturada. Indica prosperidad futura, pero **conlleva el pago de IVA a tu cuenta** el día 20 del mes siguiente, hayan pagado tu factura o no.
* **Métrica [Base Caja]:** Es la liquidez real. Solo registra transacciones cuyo estatus es explícitamente "PAGADO" o tienen fecha actual acreditada. Útil para pagar planillas y calcular dividendos.

---

## 3. Registro de Transacciones Diarias 

Ingresa a la pestaña "Transacciones".  
Cualquier técnico o contador autorizado registrará movimientos aquí. El formulario cuenta con validación estricta y previene de borrados.

![Ejemplo Formulario de Transacción](file:///C:/Users/lorti/.gemini/antigravity/brain/d069d29d-0ca4-49b4-9b4b-6985b59ef877/media__1774733751136.png)

### Reglas de Auditoría
El sistema prohíbe explícitamente "Eliminar" transacciones para evitar descuadres o manipulación de fondos.  
Si cometes un error en un registro:
1. Haz clic en "Anular" dentro de los "..." a la derecha de la fila en la tabla.
2. Ingresa la *Razón Documentada* estricta.
3. El sistema hará "Soft-Delete", tachando el monto del consolidado del mes.

---

## 4. Tributación y Control de IVA

Veltrium automatiza los tediosos cálculos de "Líquido a Pagar" al SII y previene el desfinanciamiento mensual de la caja chica.

El ERP toma decisiones lógicas por sí mismo basadas en el **Tipo de Documento** ingresado:
* **Si es (Factura):** El sistema separará mágicamente el IVA. En un servicio de $1.190.000 (Bruto), el sistema anotará $1.000.000 en rentabilidad neta y $190.000 los retendrá como "IVA Débito" para ser pagado a final del mes.
* **Si es (Boleta) o (Sin Documento):** El ERP interpretará el total neto al 100% de rentabilidad. No hay derecho a crédito ni obligaciones a debitar.

En el **Dashboard**, un widget te dirá mensualmente: `(Tus Facturas de Egreso) - (Tus Facturas de Ingreso) = Tu Cheque al Estado el día 20`.

---

## 5. Cierre Mensual (Historial y Snapshots) 

En el módulo **Historial**, puedes visualizar un archivo perpetuo de la historia financiera de Veltrium Tech.
Al final de cada mes (y antes del día 12), el administrador debe ir al Resumen y asegurarse de cuadrar la caja.
El ERP automáticamente genera la tarjeta de "Estado de Resultado" separando **Margen Bruto** (Tus servicios vs Tu materia prima comprada) y **Margen Neto** (Margen Bruto - Tu Arriendo y Sueldos fijos).

![Estado de Resultado Corporativo](file:///C:/Users/lorti/.gemini/antigravity/brain/d069d29d-0ca4-49b4-9b4b-6985b59ef877/estado_de_resultados_dashboard_1774735732354.png)

---

## 6. Manejo de Activos y Deudas (Balance)

Todo crecimiento corporativo viene apalancado (créditos empresariales, líneas bancarias CMF).

* **Deudas:** En `Deudas`, ingresas el compromiso a Tasa Fija o Cuota Rotativa. El sistema generará una tabla de amortización inteligente mes a mes descontando interés.
* **Balance Patrimonial:** Actúa como balanza contra el módulo de Deudas. Ingresa todas las cuentas bancarias de la empresa actualizadas, propiedades y licencias intelectuales para que el **Patrimonio** Veltrium (Assets - Liabilities) sea real y positivo ante inversionistas.

---

## 7. Simulador de Rentabilidad e Inversión B2B

El módulo preferido de proyecciones Veltrium.
Si la empresa desea contratar bajo nómina a 3 ingenieros seniors ($6M de Costo Fijo Mensual Nuevo) o rentar 3 camionetas Toyota Hilux extra, utiliza el simulador *antes* de aprobar la decisión.

El Simulador cruzará todos los gastos de tu Historial real, te dirá cuál es el **Punto de Equilibrio (Break-Even)** necesario a facturar extra, y predecirá cuántos dólares necesitas levantar este mes para seguir a flote sin quemar reservas de caja.

![Simulador Punto de Equilibrio](file:///C:/Users/lorti/.gemini/antigravity/brain/d069d29d-0ca4-49b4-9b4b-6985b59ef877/simulador_negocio_full_1774736269098.png)
