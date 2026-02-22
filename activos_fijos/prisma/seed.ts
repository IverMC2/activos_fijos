import {
  PrismaClient,
  Rol,
  EstadoActivo,
  MetodoDepreciacion,
  TipoDocumento,
  TipoMantenimiento,
  MotivoBaja,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker/locale/es";

const prisma = new PrismaClient();

const CONFIG = {
  USUARIOS: 20,
  ACTIVOS: 100,
  DOCUMENTOS_POR_ACTIVO: { min: 0, max: 3 },
  DEPRECIACIONES_POR_ACTIVO: { min: 6, max: 24 },
  MANTENIMIENTOS_POR_ACTIVO: { min: 0, max: 5 },
  TRASLADOS_POR_ACTIVO: { min: 0, max: 3 },
  PROVEEDORES: 15,
  BAJAS_PORCENTAJE: 0.05,
};

const DEPARTAMENTOS_BOLIVIA = [
  { nombre: "La Paz", ciudad: "La Paz" },
  { nombre: "Cochabamba", ciudad: "Cochabamba" },
  { nombre: "Santa Cruz", ciudad: "Santa Cruz" },
  { nombre: "Oruro", ciudad: "Oruro" },
  { nombre: "Potosí", ciudad: "Potosí" },
  { nombre: "Chuquisaca", ciudad: "Sucre" },
  { nombre: "Tarija", ciudad: "Tarija" },
  { nombre: "Beni", ciudad: "Trinidad" },
  { nombre: "Pando", ciudad: "Cobija" },
];

const CATEGORIAS_BASE = [
  {
    nombre: "Equipos de Computación",
    vidaUtilAnios: 4,
    cuentaContable: "1.2.1.01",
    marcas: ["HP", "Dell", "Lenovo", "Apple", "Asus", "Acer"],
    tiposActivo: ["Laptop", "Desktop", "Monitor", "Tablet", "Impresora"],
  },
  {
    nombre: "Muebles y Enseres",
    vidaUtilAnios: 10,
    cuentaContable: "1.2.1.02",
    marcas: ["OfficeLine", "Herman Miller", "Steelcase", "IKEA", "Flex"],
    tiposActivo: ["Escritorio", "Silla", "Archivador", "Mesa", "Estantería"],
  },
  {
    nombre: "Vehículos",
    vidaUtilAnios: 5,
    cuentaContable: "1.2.1.03",
    marcas: ["Toyota", "Nissan", "Suzuki", "Hyundai", "Kia", "Volkswagen"],
    tiposActivo: ["Automóvil", "Camioneta", "Furgón", "Motocicleta"],
  },
  {
    nombre: "Maquinaria y Equipo",
    vidaUtilAnios: 8,
    cuentaContable: "1.2.1.04",
    marcas: ["Bosch", "Makita", "DeWalt", "Stanley", "Black+Decker"],
    tiposActivo: ["Taladro", "Sierra", "Compresor", "Generador", "Soldadora"],
  },
  {
    nombre: "Edificios",
    vidaUtilAnios: 40,
    cuentaContable: "1.2.1.05",
    marcas: ["Construcción"],
    tiposActivo: ["Oficina", "Bodega", "Local Comercial", "Estacionamiento"],
  },
  {
    nombre: "Equipos de Comunicación",
    vidaUtilAnios: 3,
    cuentaContable: "1.2.1.06",
    marcas: ["Cisco", "Ubiquiti", "MikroTik", "TP-Link", "Zyxel"],
    tiposActivo: ["Router", "Switch", "Access Point", "Teléfono IP"],
  },
  {
    nombre: "Herramientas",
    vidaUtilAnios: 3,
    cuentaContable: "1.2.1.07",
    marcas: ["Stanley", "Bosch", "Makita", "DeWalt", "Truper"],
    tiposActivo: [
      "Juego de herramientas",
      "Martillo",
      "Destornillador",
      "Llave inglesa",
      "Alicate",
    ],
  },
];

const TIPOS_UBICACION = [
  "sucursal",
  "departamento",
];

function generarCodigo(categoria: string, index: number): string {
  const prefijo = categoria.substring(0, 3).toUpperCase();
  const numero = String(index + 1).padStart(4, "0");
  return `${prefijo}-${numero}`;
}

function calcularDepreciacionMensual(
  costo: number,
  residual: number,
  vidaUtilAnios: number,
  metodo: MetodoDepreciacion,
): number {
  const vidaUtilMeses = vidaUtilAnios * 12;
  const montoDepreciable = costo - residual;

  if (metodo === MetodoDepreciacion.LINEAL) {
    return Number((montoDepreciable / vidaUtilMeses).toFixed(2));
  } else {
    const tasaLineal = 1 / vidaUtilMeses;
    const tasaAcelerada = tasaLineal * 2;
    return Number((montoDepreciable * tasaAcelerada).toFixed(2));
  }
}

async function main() {
  console.log("🌱 Iniciando seed con Faker.js...");
  console.log(
    `Configuración: ${CONFIG.USUARIOS} usuarios, ${CONFIG.ACTIVOS} activos`,
  );

  console.log("Creando departamentos...");
  for (const dept of DEPARTAMENTOS_BOLIVIA) {
    await prisma.departamento.upsert({
      where: { nombre: dept.nombre },
      update: {},
      create: dept,
    });
  }

  const departamentos = await prisma.departamento.findMany();

  console.log("Creando usuarios...");
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@empresa.com",
      passwordHash,
      rol: Rol.ADMIN,
      departamentoId: faker.helpers.arrayElement(departamentos).id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "consulta@empresa.com" },
    update: {},
    create: {
      nombre: "Consulta",
      email: "consulta@empresa.com",
      passwordHash,
      rol: Rol.CONSULTA,
      departamentoId: faker.helpers.arrayElement(departamentos).id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "contabilidad@empresa.com" },
    update: {},
    create: {
      nombre: "Contabilidad",
      email: "contabilidad@empresa.com",
      passwordHash,
      rol: Rol.CONTABILIDAD,
      departamentoId: faker.helpers.arrayElement(departamentos).id,
    },
  });

  for (let i = 0; i < CONFIG.USUARIOS; i++) {
    const nombre = faker.person.fullName();
    const email = faker.internet
      .email({ firstName: nombre.split(" ")[0], provider: "empresa.com" })
      .toLowerCase();

    await prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        rol: faker.helpers.arrayElement([
          Rol.ADMIN,
          Rol.CONTABILIDAD,
          Rol.CONSULTA,
        ]),
        activo: faker.datatype.boolean(0.9),
        departamentoId: faker.helpers.arrayElement(departamentos).id,
      },
    });
  }

  const usuarios = await prisma.usuario.findMany();

  console.log("Creando categorías...");
  for (const cat of CATEGORIAS_BASE) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: {
        nombre: cat.nombre,
        vidaUtilAnios: cat.vidaUtilAnios,
        cuentaContable: cat.cuentaContable,
      },
    });
  }

  const categorias = await prisma.categoria.findMany();

  console.log("Creando proveedores...");
  for (let i = 0; i < CONFIG.PROVEEDORES; i++) {
    await prisma.proveedor.create({
      data: {
        nombre: faker.company.name(),
        nit: faker.string.numeric(11),
        telefono: faker.phone.number({ style: "international" }),
        email: faker.internet.email(),
      },
    });
  }

  const proveedores = await prisma.proveedor.findMany();

  console.log("Creando ubicaciones...");

  const ubicacionesPrincipales = [];
  for (const dept of departamentos) {
    const ubicacion = await prisma.ubicacion.create({
      data: {
        nombre: `Oficina Central ${dept.nombre}`,
        tipo: faker.helpers.arrayElement(TIPOS_UBICACION),
        departamentoId: dept.id,
      },
    });
    ubicacionesPrincipales.push(ubicacion);
  }

  for (const ubicacionPrincipal of ubicacionesPrincipales) {
    const numSububicaciones = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < numSububicaciones; i++) {
      await prisma.ubicacion.create({
        data: {
          nombre: `${faker.helpers.arrayElement(TIPOS_UBICACION)} ${faker.number.int({ min: 1, max: 20 })}`,
          tipo: faker.helpers.arrayElement(TIPOS_UBICACION),
          parentId: ubicacionPrincipal.id,
          departamentoId: ubicacionPrincipal.departamentoId,
        },
      });
    }
  }

  const ubicaciones = await prisma.ubicacion.findMany();

  console.log("Creando activos...");
  const activosCreados = [];

  for (let i = 0; i < CONFIG.ACTIVOS; i++) {
    const categoria = faker.helpers.arrayElement(categorias);
    const categoriaBase = CATEGORIAS_BASE.find(
      (c) => c.nombre === categoria.nombre,
    )!;
    const marca = faker.helpers.arrayElement(categoriaBase.marcas);
    const tipoActivo = faker.helpers.arrayElement(categoriaBase.tiposActivo);

    const costoAdquisicion = Number(
      faker.commerce.price({ min: 500, max: 50000, dec: 2 }),
    );
    const valorResidual = costoAdquisicion * 0.1;
    const fechaCompra = faker.date.past({ years: 3 });
    const vidaUtilAnios = categoria.vidaUtilAnios;
    const metodoDepreciacion = faker.helpers.arrayElement([
      MetodoDepreciacion.LINEAL,
      MetodoDepreciacion.ACELERADO,
    ]);

    const mesesDesdeCompra = Math.floor(
      (Date.now() - fechaCompra.getTime()) / (30 * 24 * 60 * 60 * 1000),
    );
    const cuotaMensual = calcularDepreciacionMensual(
      costoAdquisicion,
      valorResidual,
      vidaUtilAnios,
      metodoDepreciacion,
    );
    const depreciacionTotal = Math.min(
      mesesDesdeCompra * cuotaMensual,
      costoAdquisicion - valorResidual,
    );
    const valorLibro = Number(
      (costoAdquisicion - depreciacionTotal).toFixed(2),
    );

    const activo = await prisma.activo.create({
      data: {
        codigo: generarCodigo(categoria.nombre, i),
        nombre: `${marca} ${tipoActivo} ${faker.string.alphanumeric(3)}`,
        descripcion: faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.7,
        }),
        marca,
        modelo: `${faker.string.alphanumeric(2)}-${faker.number.int({ min: 1000, max: 9999 })}`,
        numeroSerie: faker.string.uuid().substring(0, 10),
        fechaCompra,
        numeroFactura: faker.helpers.maybe(
          () => `FAC-${faker.string.numeric(8)}`,
          { probability: 0.8 },
        ),
        costoAdquisicion,
        valorResidual,
        valorLibro: Math.max(valorLibro, valorResidual),
        vidaUtilAnios,
        metodoDepreciacion,
        estado: faker.helpers.arrayElement([
          EstadoActivo.ACTIVO,
          EstadoActivo.EN_MANTENIMIENTO,
        ]),
        categoriaId: categoria.id,
        ubicacionId: faker.helpers.arrayElement(ubicaciones).id,
        responsableId: faker.helpers.maybe(
          () => faker.helpers.arrayElement(usuarios).id,
          { probability: 0.6 },
        ),
        proveedorId: faker.helpers.maybe(
          () => faker.helpers.arrayElement(proveedores).id,
          { probability: 0.8 },
        ),
      },
    });

    activosCreados.push(activo);
  }

  console.log("Creando documentos...");
  for (const activo of activosCreados) {
    const numDocumentos = faker.number.int(CONFIG.DOCUMENTOS_POR_ACTIVO);

    for (let i = 0; i < numDocumentos; i++) {
      const tipo = faker.helpers.arrayElement([
        TipoDocumento.FACTURA,
        TipoDocumento.FOTO,
        TipoDocumento.GARANTIA,
        TipoDocumento.OTRO,
      ]);
      await prisma.documento.create({
        data: {
          activoId: activo.id,
          tipo,
          nombre: `${tipo.toLowerCase()}_${activo.codigo}_${i + 1}.${faker.helpers.arrayElement(["pdf", "jpg", "png"])}`,
          url: faker.internet.url(),
          tamanio: faker.number.int({ min: 100, max: 10000 }),
        },
      });
    }
  }

  console.log("Creando depreciaciones históricas...");
  for (const activo of activosCreados) {
    const mesesHistoricos = faker.number.int(CONFIG.DEPRECIACIONES_POR_ACTIVO);
    const cuotaMensual = calcularDepreciacionMensual(
      Number(activo.costoAdquisicion),
      Number(activo.valorResidual),
      activo.vidaUtilAnios,
      activo.metodoDepreciacion,
    );

    let depreciacionAcum = 0;
    for (let i = 0; i < mesesHistoricos; i++) {
      const fecha = new Date(activo.fechaCompra);
      fecha.setMonth(fecha.getMonth() + i + 1);

      if (fecha < new Date()) {
        depreciacionAcum += cuotaMensual;
        const valorLibro = Math.max(
          Number(activo.costoAdquisicion) - depreciacionAcum,
          Number(activo.valorResidual),
        );

        await prisma.depreciacion
          .create({
            data: {
              activoId: activo.id,
              mes: fecha.getMonth() + 1,
              anio: fecha.getFullYear(),
              cuotaMensual,
              depreciacionAcum,
              valorLibro,
            },
          })
          .catch(() => { });
      }
    }
  }

  console.log("🔧 Creando mantenimientos...");
  for (const activo of activosCreados) {
    const numMantenimientos = faker.number.int(
      CONFIG.MANTENIMIENTOS_POR_ACTIVO,
    );

    for (let i = 0; i < numMantenimientos; i++) {
      const fechaMantenimiento = faker.date.between({
        from: activo.fechaCompra,
        to: new Date(),
      });
      const tipo = faker.helpers.arrayElement([
        TipoMantenimiento.PREVENTIVO,
        TipoMantenimiento.CORRECTIVO,
      ]);

      await prisma.mantenimiento.create({
        data: {
          activoId: activo.id,
          tipo,
          descripcion: faker.lorem.sentence(),
          costo: faker.helpers.maybe(
            () => Number(faker.commerce.price({ min: 100, max: 2000 })),
            { probability: 0.7 },
          ),
          fecha: fechaMantenimiento,
          proximaFecha:
            tipo === TipoMantenimiento.PREVENTIVO
              ? faker.date.future({ years: 1, refDate: fechaMantenimiento })
              : null,
          proveedorId: faker.helpers.maybe(
            () => faker.helpers.arrayElement(proveedores).id,
            { probability: 0.5 },
          ),
        },
      });
    }
  }

  console.log("Creando traslados...");
  for (const activo of activosCreados) {
    const numTraslados = faker.number.int(CONFIG.TRASLADOS_POR_ACTIVO);
    let ubicacionActual = activo.ubicacionId;

    for (let i = 0; i < numTraslados; i++) {
      const nuevaUbicacion = faker.helpers.arrayElement(
        ubicaciones.filter((u) => u.id !== ubicacionActual),
      );

      await prisma.traslado.create({
        data: {
          activoId: activo.id,
          ubicacionOrigenId: ubicacionActual,
          responsableId: faker.helpers.maybe(
            () => faker.helpers.arrayElement(usuarios).id,
            { probability: 0.7 },
          ),
          motivo: faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.8,
          }),
          fecha: faker.date.between({
            from: activo.fechaCompra,
            to: new Date(),
          }),
        },
      });

      ubicacionActual = nuevaUbicacion.id;
    }
  }

  console.log("Creando bajas...");
  const numBajas = Math.floor(CONFIG.ACTIVOS * CONFIG.BAJAS_PORCENTAJE);
  const activosParaBaja = faker.helpers.arrayElements(activosCreados, numBajas);

  for (const activo of activosParaBaja) {
    const fechaBaja = faker.date.between({
      from: activo.fechaCompra,
      to: new Date(),
    });
    const motivo = faker.helpers.arrayElement([
      MotivoBaja.VENTA,
      MotivoBaja.DETERIORO,
      MotivoBaja.ROBO,
      MotivoBaja.OBSOLESCENCIA,
    ]);

    await prisma.activo.update({
      where: { id: activo.id },
      data: { estado: EstadoActivo.DADO_DE_BAJA },
    });

    await prisma.baja.create({
      data: {
        activoId: activo.id,
        motivo,
        descripcion: faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.7,
        }),
        valorBaja: Number(
          faker.commerce.price({ min: 100, max: Number(activo.valorLibro) }),
        ),
        fecha: fechaBaja,
      },
    });
  }

  console.log("Creando bitácoras...");
  const acciones = [
    "CREAR",
    "ACTUALIZAR",
    "ELIMINAR",
    "TRASLADAR",
    "MANTENER",
    "DEPRECIAR",
  ];
  const tablas = [
    "Activo",
    "Usuario",
    "Ubicacion",
    "Proveedor",
    "Mantenimiento",
    "Documento",
  ];

  for (let i = 0; i < 100; i++) {
    await prisma.bitacora.create({
      data: {
        accion: faker.helpers.arrayElement(acciones),
        tabla: faker.helpers.arrayElement(tablas),
        registroId: faker.helpers.maybe(() => faker.string.uuid(), {
          probability: 0.8,
        }),
        usuarioId: faker.helpers.maybe(
          () => faker.helpers.arrayElement(usuarios).id,
          { probability: 0.9 },
        ),
        datos: faker.helpers.maybe(
          () => JSON.stringify({ cambio: faker.lorem.word() }),
          { probability: 0.5 },
        ),
        fecha: faker.date.recent({ days: 30 }),
      },
    });
  }

  const stats = {
    departamentos: await prisma.departamento.count(),
    usuarios: await prisma.usuario.count(),
    categorias: await prisma.categoria.count(),
    proveedores: await prisma.proveedor.count(),
    ubicaciones: await prisma.ubicacion.count(),
    activos: await prisma.activo.count(),
    documentos: await prisma.documento.count(),
    depreciaciones: await prisma.depreciacion.count(),
    mantenimientos: await prisma.mantenimiento.count(),
    traslados: await prisma.traslado.count(),
    bajas: await prisma.baja.count(),
    bitacoras: await prisma.bitacora.count(),
  };

  console.log("\nSeed completado exitosamente!");
  console.log("Estadísticas finales:");
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
