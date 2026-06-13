# PLAN DE ACCIÓN EJECUTIVO — ZENBOTS IBERIA S.L.
### Hoja de ruta completa: constitución → primera venta → escala

---

## FASE 0: PRE-LANZAMIENTO (Semanas 1-4)

### Semana 1: Fundamentos legales

**ACCIÓN 1: Reserva de denominación social**
- Plataforma: https://www.rmc.es (Registro Mercantil Central)
- Solicitar certificado negativo del nombre "ZENBOTS IBERIA"
- Coste: €13,52
- Plazo respuesta: 3-5 días hábiles
- Alternativas si no disponible: ZENBOTS MADRID S.L. / ZENBOTS ROBOTICS S.L.

**ACCIÓN 2: Cuenta bancaria para constitución**
- Banco recomendado: Banco Sabadell o BBVA (mejores condiciones para pymes)
- Abrir cuenta provisional y depositar capital social mínimo
- Capital social mínimo S.L.: €1 (nuevo régimen), recomendamos €3.000
- Documento necesario: DNI + certificado denominación social

**ACCIÓN 3: Contratar asesoría/gestoría**
- Opciones Madrid: 
  - Gestoría Fraternidad (C/ Gran Vía) — €120-150/mes, incluye RETA
  - Grupo 2000 (C/ Alcalá) — especializados en startups
  - Infoautónomos / Declarando (online) — opción económica €49/mes
- Servicios incluidos: altas censales, declaraciones trimestrales, nóminas, contabilidad

### Semana 2: Constitución S.L.

**ACCIÓN 4: Escritura de constitución ante notaría**
- Notaría recomendada: Cualquier notaría Madrid (cita online en notariado.org)
- Documentos necesarios:
  - DNI fundadores
  - Certificado denominación social
  - Estatutos sociales (redactados por gestoría)
  - Justificante ingreso capital social
- Coste notaría: ~€450-600
- El mismo día: NIF provisional (36 horas)

**ACCIÓN 5: Inscripción en Registro Mercantil de Madrid**
- Aportar escritura notarial + liquidación Impuesto Transmisiones Patrimoniales (exento S.L. nueva)
- Registro Mercantil Madrid: C/ Príncipe de Vergara, 94
- Plazo: 7-15 días hábiles
- Coste: ~€150-300

**ACCIÓN 6: NIF definitivo en Agencia Tributaria**
- Cita previa: agenciatributaria.gob.es
- Aportar escritura inscrita
- Alta en IAE (Epígrafe 615.6: Comercio mayor maquinaria)
- Alta en IVA (modelo 036)
- Alta RETA (si no tienes ya): agencia tributaria + TGSS

### Semana 3: Operaciones

**ACCIÓN 7: Dominio y hosting web**
- Dominio: zenbotsiberia.com (registro en Namecheap o Nominalia)
  - Precio: ~€10/año
  - DNS: apuntar a servidor VPS
- Hosting: DigitalOcean Droplet Basic (~€6/mes) o Render.com (gratis tier)
- SSL: Let's Encrypt (gratuito)
- Deploy de la web (ya programada en este paquete)

**ACCIÓN 8: Email corporativo**
- Proveedor: Google Workspace Business Starter
- Precio: €6/usuario/mes
- Configurar: info@zenbotsiberia.com / ventas@zenbotsiberia.com / soporte@zenbotsiberia.com
- Alternativa económica: Zoho Mail (gratis hasta 5 usuarios)
- Ver guía completa: `09-email-erp-setup.md`

**ACCIÓN 9: Alta EORI (importador)**
- Necesario para importar desde China
- Solicitarlo en Agencia Tributaria (misma cita del NIF)
- Es el mismo NIF con prefijo ES: ejemplo ES-B12345678
- Gratis, mismo día

**ACCIÓN 10: Apertura cuenta bancaria empresa**
- Banco recomendado: BBVA o Sabadell (mejores condiciones para nuevas empresas)
- Solicitar: cuenta corriente + tarjeta empresa + TPV virtual
- Negociar: sin comisiones 1 año + TPV físico gratuito
- Contacto BBVA empresas Madrid: 91 374 62 00

### Semana 4: Infraestructura

**ACCIÓN 11: Búsqueda y firma local showroom**
- Zona objetivo: Chamberí / Almagro / Salamanca (Madrid)
- Superficie: 60-100 m²
- Presupuesto: €1.200-1.800/mes + IVA
- Portales: Idealista.com, Fotocasa, Habitaclia
- Búsqueda: "local comercial Madrid Chamberí" — disponibilidad alta
- Plazo firma: 1-2 semanas de búsqueda

**ACCIÓN 12: Configuración ERP (Odoo)**
- Instalar Odoo Community 17 en servidor VPS
- Módulos a activar: CRM, Inventario, Ventas, Contabilidad, Sitio Web
- Ver guía detallada: `09-email-erp-setup.md`
- Tiempo configuración: 2-3 días

---

## FASE 1: LANZAMIENTO (Mes 2-3)

### Mes 2: Primer pedido a China

**ACCIÓN 13: Contactar proveedores (ver lista completa en `05-plan-comercial.md`)**
- Contacto Alibaba Trade Assurance: buscar Keenon Robotics, Narwal, Dreame
- Email tipo (en inglés): solicitar catálogo, MOQ, precio FOB Shanghai
- Solicitar muestras: 1 unidad por modelo (coste ~€300-500 total, reembolsable en primer pedido)
- Plazo respuesta: 24-48h

**ACCIÓN 14: Negociación términos con proveedor**
- Términos de pago objetivo: T/T 30% anticipo + 70% contra BL
- Incoterm: FOB Shanghai o CIF Barcelona/Valencia
- MOQ objetivo: 2-5 unidades por modelo (negociable como nuevo distribuidor)
- Solicitar: certificados CE, manual en español, garantía escritura

**ACCIÓN 15: Primer pedido (stock inicial)**
- Importe: ~€18.000 (ver plan financiero)
- Transferencia bancaria internacional SWIFT
- Contratar agente de aduanas: Transitalia, DB Schenker, Kuehne+Nagel Madrid
- Tiempo tránsito: 25-35 días vía marítima desde Shanghai
- Despacho aduanero: gestiona el agente, presentar factura + BL + packing list

### Mes 3: Primeras ventas

**ACCIÓN 16: Inauguración showroom**
- Evento de apertura: invitación a prensa local, blogs seniors, ONGs personas mayores Madrid
- Nota de prensa: enviar a Madrid.org, 20minutos Madrid, ElEspañol
- Demostración en vivo de los robots
- Ofrecer café y demostración gratuita

**ACCIÓN 17: Primeras acciones comerciales B2B**
- Listar residencias de mayores en Madrid:
  - Fuente: Consejería de Políticas Sociales Madrid (directorio público)
  - 420 centros registrados en Comunidad de Madrid
  - Filtrar: >50 plazas, gestión privada/concertada, zona norte/centro Madrid
- Visitas comerciales: 5 visitas/semana desde mes 3
- Presentación: dossier + demo robot en el centro
- Propuesta: prueba piloto gratuita 30 días

---

## FASE 2: CRECIMIENTO (Meses 4-12)

**ACCIÓN 18: Programa de partners**
- Contactar ortopedias de Madrid (300+ establecimientos)
- Contactar farmacias con sección de mayores
- Propuesta: comisión 8% por referencia + material expositor gratuito
- Objetivo: 20 partners referidores en Madrid

**ACCIÓN 19: Canal Amazon**
- Registro en Amazon Seller Central (vendedor profesional): €39/mes
- Abrir cuenta Amazon.es + Amazon.de (Alemania, mismos productos)
- Productos línea ZENCLEAN principalmente
- Gestión logística: FBA (Amazon gestiona almacén y envíos)

**ACCIÓN 20: Subvención Comunidad de Madrid**
- Programa PICE (Jóvenes Emprendedores) si fundador <35 años: hasta €10.000
- Programa Emprendetur Madrid: subvenciones pymes tecnológicas
- Convocatoria anual: típicamente febrero-abril
- Contacto: IMADE (Instituto Madrileño de Desarrollo) — 91 580 36 00
- Documentación necesaria: plan de negocio, modelo 036, escritura S.L.

**ACCIÓN 21: Presencia en ferias**
- Feria SIMA (Salón Inmobiliario de Madrid) — abril 2027 — target: property managers
- Madrid Senior (Congreso mayores) — noviembre 2026
- Hospital+Salud (IFEMA) — mayo 2027 — target: residencias y hospitales
- Stand estándar: €1.500-3.500 por feria

**ACCIÓN 22: Canal seguros y mutuas**
- Contactar: Mapfre Salud, Adeslas, Sanitas, Asisa
- Propuesta: Incluir robots de asistencia en pólizas de hogar senior
- Interlocutor: Director de innovación / Director de producto
- Canal ideal para escala masiva

---

## FASE 3: ESCALA (Año 2+)

**ACCIÓN 23: Distribuidores regionales**
- Buscar distribuidores en Barcelona, Valencia, Sevilla, Bilbao
- Modelo: exclusividad por provincia + precio distribuidor (60% PVP)
- Contrato distribución: redactar con asesoría jurídica especializada

**ACCIÓN 24: Financiación para escala**
- Ronda seed: €150.000 en business angels (red AEBAN)
- Contactar: South Summit Madrid (evento networking inversores) — octubre 2027
- Participar en aceleradoras: Lanzadera Valencia, Wayra Madrid
- Alternativa: crédito bancario respaldado en historial de facturación

**ACCIÓN 25: Expansión catálogo**
- Robots jardinería industrial (césped grandes superficies)
- Robots limpieza hospitalaria (mercado B2B premium)
- Robots reparto dentro de edificios (portales, hoteles)
- Negocia acuerdo OEM con fabricante chino para marca propia "ZENBOTS"

---

## CALENDARIO EJECUTIVO RESUMIDO

```
Mes 0  (Jun 26): Reserva nombre + gestoría + cuenta bancaria
Mes 1  (Jul 26): Constitución S.L. + NIF + EORI + web live + email
Mes 2  (Ago 26): Primer pedido China + local showroom firmado
Mes 3  (Sep 26): Recepción stock + primera venta + inauguración
Mes 4  (Oct 26): Campaña ads activa + visitas B2B residencias
Mes 5  (Nov 26): Break-even + 2 contratos mantenimiento firmados
Mes 6  (Dic 26): €28.000 revenue + catálogo completo + 15 clientes
Mes 8  (Feb 27): Solicitar línea póliza crédito + Amazon activo
Mes 12 (Jun 27): €274.534 revenue acumulado + 4 empleados
Mes 18 (Dic 27): Distribuidores en 2 ciudades + €500K revenue
Mes 24 (Jun 28): €720.000 revenue + planificar ronda seed
```

---

*ZENBOTS IBERIA S.L. | Plan de Acción | Junio 2026*
