const routes = {
  "/": homePage,
  "/indicadores": indicatorsPage,
  "/publicaciones": publicationsPage,
  "/informe-trimestral": reportDetailPage,
  "/datos": dataPage,
  "/datos/banco-mundial": worldBankPage,
  "/datos/agricultura-medio-ambiente": () => topicDetailPage("agriculture"),
  "/datos/ciencia-tecnologia": () => topicDetailPage("science"),
  "/datos/demografia-poblacion": () => topicDetailPage("demography"),
  "/datos/economia": () => topicDetailPage("economy"),
  "/datos/industria-energia-construccion": () => topicDetailPage("industry"),
  "/datos/mercado-laboral": () => topicDetailPage("labor"),
  "/datos/servicios": () => topicDetailPage("services"),
  "/datos/nivel-condiciones-vida": () => topicDetailPage("living"),
  "/datos/sociedad": () => topicDetailPage("society"),
  "/datos/estadisticas-experimentales": () => topicDetailPage("experiments"),
  "/nosotros": aboutPage,
  "/contacto": contactPage
};

const routeMeta = {
  "/": {
    title: "Observatorio Venezolano de Economía | Indicadores, informes y datos abiertos",
    description: "Indicadores, informes y datos abiertos para comprender la economía venezolana."
  },
  "/indicadores": {
    title: "Indicadores económicos | OVE",
    description: "Panel de indicadores económicos de Venezuela con series históricas y fuentes verificables."
  },
  "/publicaciones": {
    title: "Informes y publicaciones | OVE",
    description: "Análisis, informes y estudios del Observatorio Venezolano de Economía."
  },
  "/informe-trimestral": {
    title: "Informe económico trimestral | OVE",
    description: "Informe trimestral con análisis macroeconómico y sectorial de Venezuela."
  },
  "/datos": {
    title: "Banco de datos | OVE",
    description: "Datos abiertos, catálogos y herramientas para análisis económico."
  },
  "/datos/banco-mundial": {
    title: "Banco Mundial Venezuela | OVE",
    description: "Series del Banco Mundial organizadas para el análisis económico de Venezuela."
  },
  "/nosotros": {
    title: "Nosotros | OVE",
    description: "Conoce la misión, visión, valores y metodología del Observatorio Venezolano de Economía."
  },
  "/contacto": {
    title: "Contacto y boletín | OVE",
    description: "Escríbenos, suscríbete al boletín o plantea una colaboración institucional."
  }
};

const appRoot = document.getElementById("app");
const siteHeader = document.querySelector(".site-header");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastRoute = null;
let routeRenderId = 0;
let revealObserver = null;

const metricData = [
  {
    title: "PIB Trimestral",
    subtitle: "(Var. % interanual)",
    value: "2,4%",
    period: "T1 2024",
    trend: "0,6 p.p. vs T4 2023",
    direction: "up",
    icon: "trend"
  },
  {
    title: "Inflación Interanual",
    subtitle: "(Var. %)",
    value: "58,7%",
    period: "Abr 2024",
    trend: "2,1 p.p. vs Abr 2024",
    direction: "down",
    color: "yellow",
    icon: "coin"
  },
  {
    title: "Tipo de cambio prom.",
    subtitle: "(USD/VEF)",
    value: "36,25",
    period: "May 2024",
    trend: "1,8% vs Abr 2024",
    direction: "down",
    color: "red",
    icon: "dollar"
  },
  {
    title: "Empleo Informal",
    subtitle: "(%)",
    value: "43,8%",
    period: "T1 2024",
    trend: "1,2 p.p. vs T4 2023",
    direction: "up",
    icon: "users"
  },
  {
    title: "Reservas Internacionales",
    subtitle: "(USD millones)",
    value: "8.925",
    period: "May 2024",
    trend: "3,4% vs Abr 2024",
    direction: "down",
    icon: "bank"
  }
];

const reports = [
  ["Informe", "Panorama Económico de Venezuela", "Mayo 2024", "Análisis integral de la evolución reciente de los principales indicadores del país.", "dark"],
  ["Informe especial", "Inflación y poder adquisitivo en Venezuela", "Abril 2024", "Evolución reciente de la inflación y su impacto en el poder de compra de los hogares.", "light"],
  ["Análisis", "Finanzas públicas y sostenibilidad fiscal en Venezuela", "Mayo 2024", "Situación fiscal del gobierno central y perspectivas de sostenibilidad.", "dark"],
  ["Indicadores", "Mercado laboral venezolano", "T1 2024", "Indicadores clave del mercado laboral: empleo, desempleo e informalidad.", "light"],
  ["Coyuntura", "Coyuntura cambiaria y reservas internacionales", "Mayo 2024", "Evolucion del tipo de cambio y nivel de reservas internacionales.", "dark"],
  ["Analisis", "Panorama petrolero Venezuela 2023", "Abril 2024", "Produccion, exportaciones y entorno sectorial.", "light"],
  ["Notas metodológicas", "Cómo medimos la actividad económica", "Marzo 2024", "Criterios, fuentes y procesos de validación estadística.", "dark"],
  ["Informe", "Informe económico anual 2023", "Marzo 2024", "Balance macroeconómico anual y perspectivas.", "light"]
];

const publicationCovers = [
  "assets/publication-cover-1.png",
  "assets/publication-cover-2.png",
  "assets/publication-cover-3.png",
  "assets/publication-cover-4.png"
];

const datasets = [
  ["Cuentas nacionales", "120 datasets", "PIB, VAB, demanda, ingreso", "trend"],
  ["Precios e inflación", "85 datasets", "IPC, inflación subyacente, canastas", "tag"],
  ["Comercio exterior", "68 datasets", "Exportaciones, importaciones, balanza", "globe"],
  ["Finanzas públicas", "92 datasets", "Ingresos, gastos, deuda pública", "bank"],
  ["Mercado laboral", "54 datasets", "Empleo, desempleo, salarios", "users"],
  ["Sector real", "77 datasets", "Industria, construccion, agropecuario", "factory"]
];

const worldBankCatalog = [
  ["Demografía", "demografia", 528, 8, 1960, 2025],
  ["Educación", "educacion", 330, 5, 1960, 2025],
  ["Energía y ambiente", "energia_y_ambiente", 330, 5, 1960, 2025],
  ["Género", "genero", 330, 5, 1960, 2025],
  ["Infraestructura y digitalización", "infraestructura_y_digitalizacion", 264, 4, 1960, 2025],
  ["Macroeconomía", "macroeconomia", 660, 10, 1960, 2025],
  ["Mercado laboral", "mercado_laboral", 792, 12, 1960, 2025],
  ["Pobreza y desigualdad", "pobreza_y_desigualdad", 330, 5, 1960, 2025],
  ["Precios e inflación", "precios_e_inflacion", 462, 7, 1960, 2025],
  ["Salud", "salud", 462, 7, 1960, 2025],
  ["Sector externo", "sector_externo", 594, 9, 1960, 2025],
  ["Sector público e instituciones", "sector_publico_e_instituciones", 264, 4, 1960, 2025]
];

const topicData = [
  ["agriculture", "Agricultura y medio ambiente", "assets/topics/topic-agriculture.png", "#/datos/agricultura-medio-ambiente"],
  ["science", "Ciencia y tecnología", "assets/topics/topic-science.png", "#/datos/ciencia-tecnologia"],
  ["demography", "Demografía y población", "assets/topics/topic-demography.png", "#/datos/demografia-poblacion"],
  ["economy", "Economía", "assets/topics/topic-economy.png", "#/datos/economia"],
  ["industry", "Industria, energía y construcción", "assets/topics/topic-industry.png", "#/datos/industria-energia-construccion"],
  ["labor", "Mercado laboral", "assets/topics/topic-labor.png", "#/datos/mercado-laboral"],
  ["services", "Servicios", "assets/topics/topic-services.png", "#/datos/servicios"],
  ["living", "Nivel y condiciones de vida (IPC)", "assets/topics/topic-living.png", "#/datos/nivel-condiciones-vida"],
  ["society", "Sociedad", "assets/topics/topic-society.png", "#/datos/sociedad"],
  ["experiments", "Estadísticas experimentales", "assets/topics/topic-experiments.png", "#/datos/estadisticas-experimentales"]
];

const agricultureEnvironmentGroups = [
  {
    title: "Agricultura",
    sections: [
      {
        title: "Operaciones estadisticas prioritarias",
        rows: [
          ["Censo agropecuario nacional (en elaboración)", "Base inicial"],
          ["Superficie sembrada, cosechada y produccion agricola por cultivo (en elaboración)", "Trimestral"],
          ["Ganaderia y produccion pecuaria: bovino, porcino, avicola y leche (en elaboración)", "Semestral"],
          ["Precios coyunturales de productos agropecuarios (en elaboración)", "Mensual"]
        ]
      },
      {
        title: "Operaciones complementarias viables",
        rows: [
          ["Encuesta de costos e insumos agricolas (en elaboración)", "Anual"],
          ["Disponibilidad e importacion de insumos agroproductivos (en elaboración)", "Mensual"]
        ]
      }
    ]
  },
  {
    title: "Agua",
    sections: [
      {
        title: "Operaciones estadisticas prioritarias",
        rows: [
          ["Suministro y saneamiento de agua por entidad federal (en elaboración)", "Anual"],
          ["Uso de agua en hogares y actividades productivas (en elaboración)", "Anual"],
          ["Calidad del agua y fuentes de abastecimiento (en elaboración)", "Semestral"]
        ]
      },
      {
        title: "Seguimiento ambiental",
        rows: [
          ["Seguimiento de embalses, aguas superficiales y subterraneas (en elaboración)", "Mensual"]
        ]
      }
    ]
  },
  {
    title: "Residuos y proteccion ambiental",
    sections: [
      {
        title: "Operaciones estadisticas prioritarias",
        rows: [
          ["Generacion y gestion de residuos solidos urbanos (en elaboración)", "Anual"],
          ["Recoleccion, tratamiento y disposicion final de residuos (en elaboración)", "Anual"],
          ["Actividades de proteccion ambiental en municipios e industrias (en elaboración)", "Anual"]
        ]
      },
      {
        title: "Operaciones complementarias viables",
        rows: [
          ["Envases y residuos de envases (en elaboración)", "Anual"]
        ]
      }
    ]
  },
  {
    title: "Cuentas ambientales",
    sections: [
      {
        title: "Cuentas e indicadores viables",
        rows: [
          ["Cuenta de emisiones a la atmosfera (en elaboración)", "Serie historica"],
          ["Cuenta de flujos de materiales (en elaboración)", "Serie historica"],
          ["Cuenta de bienes y servicios ambientales (en elaboración)", "Serie historica"],
          ["Cuenta de gasto en proteccion ambiental (en elaboración)", "Serie historica"],
          ["Cuenta de los residuos (en elaboración)", "Serie historica"],
          ["Panel de indicadores ambientales nacionales (en elaboración)", "Anual"]
        ]
      }
    ]
  },
  {
    title: "Otras operaciones medioambientales",
    sections: [
      {
        title: "Operaciones viables para Venezuela",
        rows: [
          ["Estadistica de incendios forestales (en elaboración)", "Mensual"],
          ["Inventario de cobertura vegetal y salud de los bosques (en elaboración)", "Anual"],
          ["Inventario de erosion y degradacion de suelos (en elaboración)", "Anual"]
        ]
      }
    ]
  }
];

const topicDetails = {
  agriculture: {
    title: "Agricultura y medio ambiente",
    image: "assets/topics/topic-agriculture.png",
    lead: "Operaciones estadisticas viables para Venezuela en agricultura, agua, residuos, proteccion ambiental y cuentas ambientales.",
    groups: agricultureEnvironmentGroups
  },
  science: {
    title: "Ciencia y tecnologia",
    image: "assets/topics/topic-science.png",
    lead: "Operaciones para medir capacidades de investigacion, innovacion, talento tecnico y adopcion digital en Venezuela.",
    groups: [
      {
        title: "Investigacion y desarrollo",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Gasto nacional en investigacion y desarrollo por sector ejecutor (en elaboración)", "Anual"],
              ["Personal dedicado a investigacion y desarrollo por area de conocimiento (en elaboración)", "Anual"],
              ["Proyectos de investigacion activos en universidades y centros publicos (en elaboración)", "Semestral"]
            ]
          }
        ]
      },
      {
        title: "Innovacion empresarial",
        sections: [
          {
            title: "Operaciones viables para el sector productivo",
            rows: [
              ["Encuesta de innovacion en empresas industriales y de servicios (en elaboración)", "Bienal"],
              ["Adopcion de tecnologias digitales en empresas (en elaboración)", "Anual"],
              ["Patentes, marcas y registros de propiedad intelectual (en elaboración)", "Trimestral"]
            ]
          }
        ]
      },
      {
        title: "Conectividad y capacidades digitales",
        sections: [
          {
            title: "Indicadores de infraestructura y uso",
            rows: [
              ["Acceso a internet fijo y movil por entidad federal (en elaboración)", "Trimestral"],
              ["Uso de tecnologias de informacion en hogares (en elaboración)", "Anual"],
              ["Talento digital y formacion tecnica especializada (en elaboración)", "Anual"]
            ]
          }
        ]
      }
    ]
  },
  demography: {
    title: "Demografia y poblacion",
    image: "assets/topics/topic-demography.png",
    lead: "Indicadores para comprender la estructura, movilidad y dinamica de la poblacion venezolana.",
    groups: [
      {
        title: "Poblacion",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Proyecciones de poblacion por edad, sexo y entidad federal (en elaboración)", "Anual"],
              ["Estimaciones municipales de poblacion (en elaboración)", "Anual"],
              ["Estructura de hogares y composicion familiar (en elaboración)", "Anual"]
            ]
          }
        ]
      },
      {
        title: "Natalidad y mortalidad",
        sections: [
          {
            title: "Estadisticas vitales",
            rows: [
              ["Nacimientos registrados y tasas de natalidad (en elaboración)", "Anual"],
              ["Defunciones registradas y mortalidad por grupos de edad (en elaboración)", "Anual"],
              ["Mortalidad infantil y materna (en elaboración)", "Anual"]
            ]
          }
        ]
      },
      {
        title: "Migracion y movilidad",
        sections: [
          {
            title: "Operaciones viables",
            rows: [
              ["Migracion interna por entidad federal (en elaboración)", "Anual"],
              ["Retorno y movilidad internacional de hogares venezolanos (en elaboración)", "Semestral"],
              ["Movilidad cotidiana por trabajo y estudio (en elaboración)", "Anual"]
            ]
          }
        ]
      }
    ]
  },
  economy: {
    title: "Economia",
    image: "assets/topics/topic-economy.png",
    lead: "Series macroeconomicas y de precios para seguir actividad, inflacion, comercio, finanzas publicas y condiciones monetarias.",
    groups: [
      {
        title: "Actividad economica",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Producto interno bruto por actividad economica (en elaboración)", "Trimestral"],
              ["Indicador mensual de actividad economica (en elaboración)", "Mensual"],
              ["Cuentas nacionales por componentes de demanda (en elaboración)", "Trimestral"]
            ]
          }
        ]
      },
      {
        title: "Precios e inflacion",
        sections: [
          {
            title: "Indicadores de precios",
            rows: [
              ["Indice nacional de precios al consumidor (en elaboración)", "Mensual"],
              ["Canasta alimentaria y bienes esenciales (en elaboración)", "Mensual"],
              ["Precios mayoristas y de productor (en elaboración)", "Mensual"]
            ]
          }
        ]
      },
      {
        title: "Sector externo y finanzas",
        sections: [
          {
            title: "Operaciones viables",
            rows: [
              ["Comercio exterior de bienes por rubro y destino (en elaboración)", "Mensual"],
              ["Reservas internacionales y balanza de pagos (en elaboración)", "Trimestral"],
              ["Ingresos, gastos y deuda del sector publico (en elaboración)", "Trimestral"],
              ["Credito, liquidez y tasas de interes (en elaboración)", "Mensual"]
            ]
          }
        ]
      }
    ]
  },
  industry: {
    title: "Industria, energia y construccion",
    image: "assets/topics/topic-industry.png",
    lead: "Operaciones para seguir produccion industrial, energia, hidrocarburos, infraestructura y construccion.",
    groups: [
      {
        title: "Industria manufacturera",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Indice de produccion manufacturera por rama (en elaboración)", "Mensual"],
              ["Capacidad instalada y utilizacion industrial (en elaboración)", "Trimestral"],
              ["Ventas, inventarios y costos industriales (en elaboración)", "Trimestral"]
            ]
          }
        ]
      },
      {
        title: "Energia e hidrocarburos",
        sections: [
          {
            title: "Indicadores sectoriales",
            rows: [
              ["Produccion petrolera y gasifera por region (en elaboración)", "Mensual"],
              ["Generacion, demanda y fallas del sistema electrico (en elaboración)", "Mensual"],
              ["Consumo de combustibles y derivados (en elaboración)", "Mensual"],
              ["Energias renovables y capacidad instalada (en elaboración)", "Anual"]
            ]
          }
        ]
      },
      {
        title: "Construccion e infraestructura",
        sections: [
          {
            title: "Operaciones viables",
            rows: [
              ["Permisos, obras iniciadas y obras culminadas (en elaboración)", "Trimestral"],
              ["Indice de costos de construccion (en elaboración)", "Mensual"],
              ["Vivienda, infraestructura publica y mantenimiento urbano (en elaboración)", "Anual"]
            ]
          }
        ]
      }
    ]
  },
  labor: {
    title: "Mercado laboral",
    image: "assets/topics/topic-labor.png",
    lead: "Indicadores de empleo, salarios, informalidad, ocupaciones y condiciones de trabajo en Venezuela.",
    groups: [
      {
        title: "Empleo y desempleo",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Encuesta continua de fuerza de trabajo (en elaboración)", "Trimestral"],
              ["Tasa de ocupacion, desempleo y participacion laboral (en elaboración)", "Trimestral"],
              ["Empleo por rama economica y entidad federal (en elaboración)", "Trimestral"]
            ]
          }
        ]
      },
      {
        title: "Ingresos laborales",
        sections: [
          {
            title: "Remuneraciones y condiciones",
            rows: [
              ["Salarios nominales y reales por sector (en elaboración)", "Mensual"],
              ["Brechas salariales por genero, edad y ocupacion (en elaboración)", "Anual"],
              ["Beneficios laborales y modalidades de contratacion (en elaboración)", "Anual"]
            ]
          }
        ]
      },
      {
        title: "Informalidad y movilidad laboral",
        sections: [
          {
            title: "Operaciones viables",
            rows: [
              ["Empleo informal y trabajo por cuenta propia (en elaboración)", "Trimestral"],
              ["Subempleo, pluriempleo y horas trabajadas (en elaboración)", "Trimestral"],
              ["Migracion laboral y remesas asociadas al trabajo (en elaboración)", "Semestral"]
            ]
          }
        ]
      }
    ]
  },
  services: {
    title: "Servicios",
    image: "assets/topics/topic-services.png",
    lead: "Operaciones para medir comercio, turismo, transporte, telecomunicaciones y servicios profesionales.",
    groups: [
      {
        title: "Comercio y consumo",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Ventas minoristas por rubro y canal (en elaboración)", "Mensual"],
              ["Actividad de supermercados, farmacias y comercios esenciales (en elaboración)", "Mensual"],
              ["Indice de confianza y expectativas del consumidor (en elaboración)", "Trimestral"]
            ]
          }
        ]
      },
      {
        title: "Turismo, transporte y logistica",
        sections: [
          {
            title: "Indicadores sectoriales",
            rows: [
              ["Ocupacion hotelera y flujo turistico interno (en elaboración)", "Mensual"],
              ["Transporte terrestre, aereo y maritimo de pasajeros (en elaboración)", "Mensual"],
              ["Carga, encomiendas y logistica comercial (en elaboración)", "Mensual"]
            ]
          }
        ]
      },
      {
        title: "Servicios digitales y profesionales",
        sections: [
          {
            title: "Operaciones viables",
            rows: [
              ["Servicios profesionales, tecnicos y administrativos (en elaboración)", "Trimestral"],
              ["Comercio electronico y pagos digitales (en elaboración)", "Mensual"],
              ["Servicios financieros, seguros y atencion al cliente (en elaboración)", "Trimestral"]
            ]
          }
        ]
      }
    ]
  },
  living: {
    title: "Nivel y condiciones de vida (IPC)",
    image: "assets/topics/topic-living.png",
    lead: "Indicadores sociales y de costo de vida para monitorear bienestar, pobreza, acceso a servicios y consumo de hogares.",
    groups: [
      {
        title: "Condiciones de vida",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Encuesta nacional de condiciones de vida de los hogares (en elaboración)", "Anual"],
              ["Pobreza por ingresos y pobreza multidimensional (en elaboración)", "Anual"],
              ["Acceso a servicios basicos: agua, electricidad, gas e internet (en elaboración)", "Semestral"]
            ]
          }
        ]
      },
      {
        title: "Costo de vida e IPC",
        sections: [
          {
            title: "Indicadores de precios y consumo",
            rows: [
              ["Indice de precios al consumidor por ciudades y rubros (en elaboración)", "Mensual"],
              ["Canasta basica familiar y canasta alimentaria (en elaboración)", "Mensual"],
              ["Gasto de consumo de los hogares por decil de ingreso (en elaboración)", "Anual"]
            ]
          }
        ]
      },
      {
        title: "Salud, educacion y vivienda",
        sections: [
          {
            title: "Operaciones viables",
            rows: [
              ["Acceso y gasto de hogares en salud (en elaboración)", "Anual"],
              ["Asistencia escolar, rezago y conectividad educativa (en elaboración)", "Anual"],
              ["Condiciones de vivienda y hacinamiento (en elaboración)", "Anual"]
            ]
          }
        ]
      }
    ]
  },
  society: {
    title: "Sociedad",
    image: "assets/topics/topic-society.png",
    lead: "Operaciones para comprender participacion ciudadana, seguridad, cohesion social, genero y territorio.",
    groups: [
      {
        title: "Seguridad y convivencia",
        sections: [
          {
            title: "Operaciones estadisticas prioritarias",
            rows: [
              ["Victimizacion y percepcion de seguridad ciudadana (en elaboración)", "Anual"],
              ["Conflictividad social y protestas por entidad federal (en elaboración)", "Mensual"],
              ["Acceso a justicia y resolucion de conflictos (en elaboración)", "Anual"]
            ]
          }
        ]
      },
      {
        title: "Genero, juventud y grupos vulnerables",
        sections: [
          {
            title: "Indicadores sociales",
            rows: [
              ["Brechas de genero en empleo, ingresos y educacion (en elaboración)", "Anual"],
              ["Juventud: estudio, trabajo y trayectorias de vida (en elaboración)", "Anual"],
              ["Personas mayores, discapacidad y cuidados (en elaboración)", "Anual"]
            ]
          }
        ]
      },
      {
        title: "Participacion y comunidad",
        sections: [
          {
            title: "Operaciones viables",
            rows: [
              ["Participacion comunitaria y capital social (en elaboración)", "Anual"],
              ["Acceso a programas sociales y ayuda humanitaria (en elaboración)", "Semestral"],
              ["Cultura, deporte y uso del tiempo libre (en elaboración)", "Anual"]
            ]
          }
        ]
      }
    ]
  },
  experiments: {
    title: "Estadisticas Experimentales",
    image: "assets/topics/topic-experiments.png",
    lead: "Prototipos estadisticos con fuentes alternativas, sensores, datos abiertos y modelos de estimacion rapida.",
    groups: [
      {
        title: "Indicadores de alta frecuencia",
        sections: [
          {
            title: "Prototipos en elaboracion",
            rows: [
              ["Indice de precios web y seguimiento de productos esenciales (en elaboración)", "Semanal"],
              ["Actividad economica con datos de movilidad y consumo digital (en elaboración)", "Semanal"],
              ["Monitoreo de disponibilidad de bienes y servicios por ciudad (en elaboración)", "Semanal"]
            ]
          }
        ]
      },
      {
        title: "Datos geoespaciales",
        sections: [
          {
            title: "Operaciones experimentales",
            rows: [
              ["Luces nocturnas como proxy de actividad economica regional (en elaboración)", "Mensual"],
              ["Deteccion de cambios de cobertura vegetal con imagenes satelitales (en elaboración)", "Trimestral"],
              ["Mapeo de infraestructura y servicios mediante fuentes abiertas (en elaboración)", "Trimestral"]
            ]
          }
        ]
      },
      {
        title: "Modelos y nowcasting",
        sections: [
          {
            title: "Estimaciones tempranas",
            rows: [
              ["Nowcasting de inflacion y tipo de cambio (en elaboración)", "Semanal"],
              ["Estimacion temprana de empleo e ingresos laborales (en elaboración)", "Mensual"],
              ["Alertas de riesgo economico y social por territorio (en elaboración)", "Mensual"]
            ]
          }
        ]
      }
    ]
  }
};

function icon(name) {
  const paths = {
    arrow: '<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>',
    trend: '<path d="M3 18h18"></path><path d="M5 15l4-4 4 2 6-8"></path><path d="M17 5h2v2"></path>',
    coin: '<circle cx="12" cy="12" r="8"></circle><path d="M14.5 9.5c-.6-.6-1.4-.9-2.4-.9-1.5 0-2.6.8-2.6 1.9 0 2.8 5 1.2 5 4 0 1.1-1.1 1.9-2.7 1.9-1 0-2-.4-2.7-1"></path>',
    dollar: '<circle cx="12" cy="12" r="9"></circle><path d="M12 6v12"></path><path d="M15.5 8.8c-.7-.6-1.6-.9-2.8-.9-1.7 0-3 .8-3 2.1 0 3.2 6 1.3 6 4.7 0 1.4-1.4 2.3-3.2 2.3-1.5 0-2.7-.5-3.5-1.4"></path>',
    users: '<path d="M16 20v-2a4 4 0 0 0-8 0v2"></path><circle cx="12" cy="8" r="3"></circle><path d="M22 20v-2a4 4 0 0 0-3-3.9"></path><path d="M2 20v-2a4 4 0 0 1 3-3.9"></path>',
    bank: '<path d="m3 10 9-6 9 6"></path><path d="M5 10h14"></path><path d="M6 10v8"></path><path d="M10 10v8"></path><path d="M14 10v8"></path><path d="M18 10v8"></path><path d="M4 18h16"></path><path d="M3 21h18"></path>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"></path><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"></path>',
    chartbar: '<path d="M4 19V5"></path><path d="M4 19h17"></path><rect x="7" y="11" width="3" height="6"></rect><rect x="12" y="7" width="3" height="10"></rect><rect x="17" y="3" width="3" height="14"></rect>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M8 7h8"></path><path d="M8 11h2"></path><path d="M12 11h2"></path><path d="M16 11h.01"></path><path d="M8 15h2"></path><path d="M12 15h2"></path><path d="M16 15h.01"></path>',
    map: '<path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z"></path><path d="M9 4v14"></path><path d="M15 6v14"></path>',
    monitor: '<rect x="4" y="4" width="16" height="11" rx="2"></rect><path d="M8 20h8"></path><path d="M12 15v5"></path>',
    download: '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="m9 12 2 2 4-5"></path>',
    target: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4"></path><path d="M22 12h-4"></path>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"></rect><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M3 10h18"></path>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.6-3.6"></path>',
    code: '<path d="m8 9-4 3 4 3"></path><path d="m16 9 4 3-4 3"></path><path d="m14 4-4 16"></path>',
    globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a15 15 0 0 1 0 18"></path><path d="M12 3a15 15 0 0 0 0 18"></path>',
    tag: '<path d="M20 10 12 2H4v8l8 8Z"></path><circle cx="8" cy="6" r="1"></circle>',
    factory: '<path d="M3 21h18"></path><path d="M5 21V8l6 4V8l6 4V3h3v18"></path>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z"></path>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
    megaphone: '<path d="m3 11 18-5v12L3 13v-2Z"></path><path d="M7 14v5a2 2 0 0 0 2 2h1"></path>',
    quote: '<path d="M9 7H5v4h4v6H3v-6c0-2.2 1.8-4 4-4h2Z"></path><path d="M21 7h-4v4h4v6h-6v-6c0-2.2 1.8-4 4-4h2Z"></path>',
    rocket: '<path d="M4.5 16.5c-1.2 1.2-1.5 3-1.5 4.5 1.5 0 3.3-.3 4.5-1.5"></path><path d="M9 15 4 10l5-1 6-6c2.5-.4 4.4.1 6 1.5.4 1.9-.1 3.8-1.5 6l-6 6-1 5-5-5Z"></path><circle cx="15" cy="9" r="2"></circle>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"></rect><rect x="4" y="4" width="11" height="11" rx="2"></rect>',
    plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.file}</svg>`;
}

function arrow() {
  return icon("arrow");
}

function metricCards(extraClass = "") {
  return `<div class="metrics-grid ${extraClass}">
    ${metricData.map(metric => `
      <article class="metric-card">
        <div class="metric-head">
          <span class="metric-icon ${metric.color || ""}">${icon(metric.icon)}</span>
          <div>
            <div class="metric-title">${metric.title}</div>
            <div class="metric-subtitle">${metric.subtitle}</div>
          </div>
        </div>
        <div class="metric-value">${metric.value}</div>
        <div class="tiny">${metric.period}</div>
        <div class="trend ${metric.direction === "down" ? "down" : ""}">${metric.direction === "down" ? "↓" : "↑"} ${metric.trend}</div>
      </article>
    `).join("")}
  </div>`;
}

function lineChart(kind = "blue") {
  const configs = {
    blue: {
      line: "chart-line-blue",
      tag: "tag-value",
      color: "#0052B4",
      label: "2,4%",
      points: "16,70 56,112 88,87 120,72 158,25 196,48 236,60 282,52",
      circles: [[16, 70], [56, 112], [88, 87], [120, 72], [158, 25], [196, 48], [236, 60], [282, 52]]
    },
    yellow: {
      line: "chart-line-yellow",
      tag: "tag-yellow",
      color: "#FFC20E",
      label: "58,7%",
      points: "18,112 58,105 96,92 128,72 160,38 188,18 220,45 266,48",
      area: "18,112 58,105 96,92 128,72 160,38 188,18 220,45 266,48 266,124 18,124",
      circles: [[18, 112], [58, 105], [96, 92], [128, 72], [160, 38], [188, 18], [220, 45], [266, 48]]
    },
    red: {
      line: "chart-line-red",
      tag: "tag-red",
      color: "#D62828",
      label: "36,25",
      points: "18,112 56,106 90,88 126,74 162,62 196,52 228,58 266,50",
      circles: [[18, 112], [56, 106], [90, 88], [126, 74], [162, 62], [196, 52], [228, 58], [266, 50]]
    }
  };
  const cfg = configs[kind];
  return `
    <svg viewBox="0 0 320 150" role="img" aria-label="Gráfico de línea">
      <line x1="15" y1="24" x2="292" y2="24" class="chart-grid"></line>
      <line x1="15" y1="56" x2="292" y2="56" class="chart-grid"></line>
      <line x1="15" y1="88" x2="292" y2="88" class="chart-grid"></line>
      <line x1="15" y1="124" x2="292" y2="124" class="chart-axis"></line>
      ${cfg.area ? `<polygon points="${cfg.area}" class="chart-area-yellow"></polygon>` : ""}
      <polyline points="${cfg.points}" class="${cfg.line}"></polyline>
      ${cfg.circles.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="${cfg.color}" stroke-width="3"></circle>`).join("")}
      <rect x="252" y="${kind === "yellow" ? 21 : kind === "red" ? 34 : 34}" width="52" height="24" rx="4" class="${cfg.tag}"></rect>
      <text x="278" y="${kind === "yellow" ? 37 : kind === "red" ? 50 : 50}" text-anchor="middle" class="tag-text">${cfg.label}</text>
      <text x="15" y="143" class="chart-label">2019</text>
      <text x="82" y="143" class="chart-label">2020</text>
      <text x="149" y="143" class="chart-label">2021</text>
      <text x="216" y="143" class="chart-label">2023</text>
      <text x="257" y="143" class="chart-label">T1 2024</text>
    </svg>
  `;
}

function chartCard(title, small, kind) {
  return `<article class="chart-card">
    <div class="chart-title"><span>${title}</span><small>${small}</small></div>
    <div class="chart">${lineChart(kind)}</div>
  </article>`;
}

function barChart() {
  const rows = [
    ["Minería e hidrocarburos", 88],
    ["Comercio y reparación", 62],
    ["Manufactura", 42],
    ["Transporte", 34],
    ["Construcción", 24],
    ["Agricultura", 19],
    ["Electricidad", 15]
  ];
  return `<div style="display:grid;gap:9px">
    ${rows.map(([label, value]) => `
      <div style="display:grid;grid-template-columns:160px 1fr 42px;align-items:center;gap:10px;font-size:.78rem">
        <span>${label}</span>
        <span style="height:12px;background:#e9eff7;border-radius:999px;overflow:hidden"><span style="display:block;height:100%;width:${value}%;background:var(--blue-700)"></span></span>
        <strong>${(value / 5.4).toFixed(1).replace(".", ",")}%</strong>
      </div>
    `).join("")}
  </div>`;
}

function donutChart() {
  return `<svg viewBox="0 0 250 170" role="img" aria-label="Gráfico de sectores">
    <circle cx="82" cy="82" r="54" fill="none" stroke="#0052B4" stroke-width="32" stroke-dasharray="120 220" transform="rotate(-90 82 82)"></circle>
    <circle cx="82" cy="82" r="54" fill="none" stroke="#0B1D3D" stroke-width="32" stroke-dasharray="58 282" stroke-dashoffset="-120" transform="rotate(-90 82 82)"></circle>
    <circle cx="82" cy="82" r="54" fill="none" stroke="#FFC20E" stroke-width="32" stroke-dasharray="45 295" stroke-dashoffset="-178" transform="rotate(-90 82 82)"></circle>
    <circle cx="82" cy="82" r="54" fill="none" stroke="#D62828" stroke-width="32" stroke-dasharray="34 306" stroke-dashoffset="-223" transform="rotate(-90 82 82)"></circle>
    <circle cx="82" cy="82" r="36" fill="#fff"></circle>
    <g font-size="12" fill="#092454" font-weight="700">
      <rect x="160" y="35" width="10" height="10" fill="#0052B4"></rect><text x="178" y="44">Servicios 45,0%</text>
      <rect x="160" y="60" width="10" height="10" fill="#0B1D3D"></rect><text x="178" y="69">Comercio 20,3%</text>
      <rect x="160" y="85" width="10" height="10" fill="#FFC20E"></rect><text x="178" y="94">Industria 16,1%</text>
      <rect x="160" y="110" width="10" height="10" fill="#D62828"></rect><text x="178" y="119">Minería 12,7%</text>
    </g>
  </svg>`;
}

function mapWidget() {
  return `<svg viewBox="0 0 330 190" role="img" aria-label="Mapa económico por regiones">
    <path d="M45 105 72 62l52-14 44 18 50-8 58 31-18 46-55 8-50 30-57-18-38 10Z" fill="#d9e8fb"></path>
    <path d="M74 65 125 50l12 44-42 18-52-7Z" fill="#8eb8eb"></path>
    <path d="M137 94 169 66l49-7 4 54-38 26-48-4Z" fill="#6ea2df"></path>
    <path d="M95 114 137 94l-1 42 33 26-58 3-52-24Z" fill="#b9d4f5"></path>
    <path d="M223 113 277 90l-18 45-56 8Z" fill="#9fc4ef"></path>
    <g fill="#092454" font-size="12" font-weight="700">
      <text x="260" y="58">Zulia 4,1%</text>
      <text x="260" y="84">Capital 2,3%</text>
      <text x="260" y="110">Llanos 1,6%</text>
      <text x="260" y="136">Insular -3,1%</text>
    </g>
  </svg>`;
}

function reportCard(report, index = 0) {
  const [type, title, date, description] = report;
  const href = index === 0 ? "#/informe-trimestral" : "#/publicaciones";
  const cover = publicationCovers[index % publicationCovers.length];
  return `<article class="report-card">
    <a href="${href}" class="report-cover">
      <img src="${cover}" alt="Portada: ${title}">
    </a>
    <div class="report-body">
      <span class="report-type">${type}</span>
      <p>${date}</p>
      <h3>${title}</h3>
      <p>${description}</p>
      <div class="report-actions">
        <a href="${href}">${type === "Indicadores" ? "Ver indicadores" : "Ver informe"} ${arrow()}</a>
        <a href="manual_corporativo_ove_max_calidad.pdf">${icon("download")} PDF</a>
      </div>
    </div>
  </article>`;
}

function pageHero({ title, lead, image = "assets/venezuela-hero.png", breadcrumb = [], dark = false, actions = "" }) {
  return `<section class="hero ${dark ? "hero-dark" : ""}">
    <div class="container hero-grid">
      <div class="hero-copy">
        ${breadcrumb.length ? `<div class="breadcrumb">${breadcrumb.map(item => `<span>${item}</span>`).join("")}</div>` : ""}
        <h1>${title}</h1>
        <span class="accent-line"></span>
        <p class="lead">${lead}</p>
        ${actions ? `<div class="hero-actions">${actions}</div>` : ""}
      </div>
      <div class="hero-art"><img src="${image}" alt=""></div>
    </div>
  </section>`;
}

function dataBand() {
  const tools = [
    ["Descarga de datos", "Accede a series historicas en formatos abiertos para tus analisis.", "Ir a datos", "database"],
    ["API OVE", "Integra nuestros datos en tus sistemas y aplicaciones.", "Documentacion", "chartbar"],
    ["Calculadoras", "Herramientas interactivas para calculos economicos rapidos y confiables.", "Explorar", "calculator"],
    ["Mapas economicos", "Explora indicadores por regiones y entidades federales.", "Ver mapas", "map"]
  ];
  return `<section class="dark-band">
    <div class="container">
      <h2>Datos y herramientas</h2>
      <span class="accent-line"></span>
      <div class="tools-grid">
        ${tools.map(([title, text, link, ico]) => `
          <article class="tool-card">
            <span class="line-icon">${icon(ico)}</span>
            <div>
              <h3>${title}</h3>
              <p>${text}</p>
              <a class="text-link" href="#/datos">${link} ${arrow()}</a>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  </section>`;
}

function topicsSection() {
  const stats = topicStats();

  return `<section class="topic-section" aria-labelledby="topic-title">
    <div class="container">
      <div class="topic-panel">
        <h2 id="topic-title">Datos por temas</h2>
        <div class="topic-stats" aria-label="Estadisticas de datos por temas">
          <span><strong>${stats.topics}</strong> temas</span>
          <span><strong>${formatInteger(stats.operations)}</strong> operaciones en elaboración</span>
          <span><strong>${stats.worldBankAreas}</strong> areas Banco Mundial</span>
          <span><strong>${formatInteger(stats.worldBankRecords)}</strong> registros fuente</span>
        </div>
        <div class="topic-grid">
          ${topicData.map(([id, label, image, href]) => `
            <a class="topic-card" href="${href}" aria-label="Ver datos de ${label}">
              <img class="topic-icon" src="${image}" alt="" loading="lazy" decoding="async">
              <span>${label}</span>
              <small>${topicOperationCount(id)} operaciones</small>
            </a>
          `).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

function topicStats() {
  const worldBank = worldBankTotals();
  return {
    topics: topicData.length,
    operations: topicData.reduce((total, [id]) => total + topicOperationCount(id), 0),
    worldBankAreas: worldBankCatalog.length,
    worldBankRecords: worldBank.records
  };
}

function topicOperationCount(topicKey) {
  const topic = topicDetails[topicKey];
  if (!topic) return 0;
  return topic.groups.reduce((groupTotal, group) => {
    return groupTotal + group.sections.reduce((sectionTotal, section) => sectionTotal + section.rows.length, 0);
  }, 0);
}

function worldBankSourceSection() {
  const totals = worldBankTotals();
  return `<section class="section-tight">
    <div class="container">
      <article class="world-source-panel">
        <div>
          <span class="eyebrow">Fuente internacional</span>
          <h2>Banco Mundial - Venezuela</h2>
          <p>Series de World Development Indicators organizadas por área temática del OVE, listas para descarga en CSV, JSON y Excel.</p>
          <div class="source-stats">
            <span><strong>${worldBankCatalog.length}</strong> áreas</span>
            <span><strong>${formatInteger(totals.records)}</strong> registros</span>
            <span><strong>${totals.indicators}</strong> indicadores</span>
            <span><strong>${totals.firstYear}-${totals.lastYear}</strong></span>
          </div>
        </div>
        <div class="world-source-actions">
          <a class="button button-primary" href="#/datos/banco-mundial">Explorar fuente ${arrow()}</a>
          <a class="button" href="assets/data/world-bank/catalog/world-bank-catalog.json" download>Catalogo JSON ${icon("download")}</a>
        </div>
      </article>
    </div>
  </section>`;
}

function newsletter() {
  return `<section class="newsletter">
    <div class="container newsletter-inner">
      <div class="newsletter-copy">
        ${icon("mail")}
        <div>
          <h2>Mantente informado</h2>
          <p>Recibe análisis, indicadores y publicaciones directamente en tu correo.</p>
        </div>
      </div>
      <form class="subscribe-form js-form">
        <input class="field" type="email" placeholder="tu@email.com" aria-label="Correo electrónico" required>
        <button class="button button-yellow" type="submit">Suscribirme</button>
      </form>
    </div>
  </section>`;
}

function footer() {
  return `${newsletter()}
  <footer class="site-footer">
    <div class="container footer-main">
      <div class="footer-brand">
        <img src="assets/ove-logo-white.png" alt="Observatorio Venezolano de Economía">
        <p>Promovemos la comprensión de la economía para impulsar el desarrollo sostenible de Venezuela.</p>
        <div class="social" aria-label="Redes sociales">
          <a href="#/contacto">in</a>
          <a href="#/contacto">X</a>
          <a href="#/contacto">yt</a>
          <a href="#/contacto">ig</a>
        </div>
      </div>
      <div class="footer-col">
        <h3>Explora</h3>
        <a href="#/indicadores">Indicadores</a>
        <a href="#/publicaciones">Informes</a>
        <a href="#/publicaciones">Publicaciones</a>
        <a href="#/datos">Datos y herramientas</a>
        <a href="#/datos">Calendario económico</a>
      </div>
      <div class="footer-col">
        <h3>Institucional</h3>
        <a href="#/nosotros">Quiénes somos</a>
        <a href="#/nosotros">Metodología</a>
        <a href="#/nosotros">Equipo</a>
        <a href="#/nosotros">Aliados</a>
        <a href="#/nosotros">Transparencia</a>
      </div>
      <div class="footer-col">
        <h3>Recursos</h3>
        <a href="#/contacto">Preguntas frecuentes</a>
        <a href="#/datos">Glosario</a>
        <a href="#/publicaciones">Noticias</a>
        <a href="#/datos">API OVE</a>
        <a href="#/">Mapa del sitio</a>
      </div>
      <div class="footer-col">
        <h3>Contacto</h3>
        <p>Av. Francisco de Miranda, Edif. Torre Europa, Piso 11, Caracas, Venezuela.</p>
        <p>+58 412 123 4567</p>
        <p>info@observatoriodeeconomia.org.ve</p>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© 2024 Observatorio Venezolano de Economía. Todos los derechos reservados.</span>
      <span>Términos de uso &nbsp; | &nbsp; Política de privacidad</span>
    </div>
  </footer>`;
}

function homePage() {
  return `<div class="page">
    ${pageHero({
      title: "Datos económicos para mejores decisiones",
      lead: "Analizamos y difundimos información económica rigurosa, independiente y accesible para comprender la realidad venezolana.",
      actions: `<a class="button button-primary" href="#/indicadores">Explorar indicadores ${arrow()}</a>
        <a class="button" href="#/informe-trimestral">Ver último informe ${icon("file")}</a>`
    })}
    <section class="section-tight">
      <div class="container">
        ${metricCards()}
        <p class="source-note">Fuente: OVE con datos del BCV, FMI e INE. Última actualización: 28 de mayo de 2024</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h2>Indicadores destacados</h2>
          <a class="text-link" href="#/indicadores">Ver todos los indicadores ${arrow()}</a>
        </div>
        <div class="home-indicators">
          ${chartCard("PIB real", "(Var. % interanual)", "blue")}
          ${chartCard("Inflación interanual", "(Var. %)", "yellow")}
          ${chartCard("Tipo de cambio promedio", "(USD/VEF)", "red")}
          <aside class="support-panel">
            <div class="support-item">${icon("monitor")}<div><h3>Panel interactivo</h3><p class="tiny">Explora y personaliza datos y gráficos.</p></div></div>
            <div class="support-item">${icon("download")}<div><h3>Descarga de datos</h3><p class="tiny">Series históricas en formatos abiertos.</p></div></div>
            <div class="support-item">${icon("clipboard")}<div><h3>Metodologías</h3><p class="tiny">Conoce cómo medimos e integramos.</p></div></div>
          </aside>
        </div>
      </div>
    </section>
    <section class="section section-tight">
      <div class="container">
        <div class="section-title">
          <h2>Últimos informes y publicaciones</h2>
          <a class="text-link" href="#/publicaciones">Ver todas las publicaciones ${arrow()}</a>
        </div>
        <div class="reports-row">${reports.slice(0, 5).map(reportCard).join("")}</div>
      </div>
    </section>
    ${dataBand()}
    <section class="section">
      <div class="container values-layout">
        <div>
          <h2>Rigor, independencia y transparencia</h2>
          <span class="accent-line"></span>
          <div class="values-grid">
            ${[
              ["Independencia", "Somos una organización independiente, sin afiliación política ni fines de lucro.", "shield"],
              ["Rigor metodológico", "Aplicamos estándares técnicos internacionales y mejores prácticas de análisis.", "target"],
              ["Transparencia", "Publicamos nuestras fuentes, metodologías y supuestos de forma abierta.", "eye"],
              ["Impacto", "Buscamos generar valor real para la sociedad y mejores decisiones.", "users"]
            ].map(([title, text, ico]) => `<article class="value-card"><span class="line-icon">${icon(ico)}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}
          </div>
        </div>
        <div class="photo-panel"><img src="assets/venezuela-city-wide.jpg" alt="Vista panoramica de Venezuela"></div>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function indicatorsPage() {
  const categories = [
    ["Actividad economica", "trend"],
    ["Precios e inflacion", "coin"],
    ["Mercado laboral", "users"],
    ["Sector externo", "globe"],
    ["Finanzas publicas", "bank"],
    ["Monetarios y financieros", "database"],
    ["Empresas y sector productivo", "factory"],
    ["Regiones", "pin"]
  ];
  return `<div class="page">
    ${pageHero({
      title: "Indicadores",
      lead: "Datos confiables para entender la economia y tomar mejores decisiones. Explora, analiza y descarga indicadores economicos de Venezuela con series historicas actualizadas.",
      breadcrumb: ["Inicio", "Indicadores"]
    })}
    <section class="section">
      <div class="container layout-sidebar">
        <aside class="side-menu">
          <h3>Categorias</h3>
          ${categories.map((item, index) => `<a class="${index === 0 ? "is-selected" : ""}" href="#/indicadores">${icon(item[1])}<span>${item[0]}</span><span>›</span></a>`).join("")}
          <div class="filter-panel">
            <h3>¿No encuentras lo que buscas?</h3>
            <p class="tiny">Explora todos los datos disponibles en nuestro Banco de Datos.</p>
            <a class="button button-small" href="#/datos">Ir al Banco de Datos</a>
          </div>
        </aside>
        <div>
          <div class="filter-row">
            ${[
              ["Periodo", "Ene 2019 - Abr 2024", "calendar"],
              ["Tema", "PIB Trimestral", "clipboard"],
              ["Region", "Nacional", "pin"],
              ["Fuente", "Todas las fuentes", "database"]
            ].map(([label, value, ico]) => `<div class="filter-box">${icon(ico)}<div><label>${label}</label><strong>${value}</strong></div></div>`).join("")}
            <a class="text-link" href="#/indicadores">Limpiar filtros</a>
          </div>
          ${metricCards("inline-metrics")}
          <p class="source-note">Fuente: OVE con datos del BCV, INE, MPPEF, OIT, CEPAL y fuentes oficiales. Ultima actualizacion: 28 de mayo de 2024</p>
          <div class="dashboard-grid">
            <article class="panel span-7">
              <div class="panel-title"><h3>Evolucion del PIB Trimestral <span class="tiny">(Var. % interanual)</span></h3><span class="pill">5A</span></div>
              <div class="chart">${lineChart("blue")}</div>
            </article>
            <article class="panel span-5">
              <div class="panel-title"><h3>PIB por regiones <span class="tiny">(T1 2024)</span></h3></div>
              ${mapWidget()}
              <a class="text-link" href="#/indicadores">Ver detalle por entidad federativa ${arrow()}</a>
            </article>
            <article class="panel span-4"><h3>PIB por actividad economica</h3>${barChart()}</article>
            <article class="panel span-4">${chartCard("Inflacion interanual", "(Var. %)", "yellow")}</article>
            <article class="panel span-4"><h3>PIB por sector</h3>${donutChart()}</article>
            <article class="panel span-8">
              <h3>Ultimos valores disponibles</h3>
              <div class="table-wrap">${indicatorTable()}</div>
            </article>
            <aside class="span-4" style="display:grid;gap:14px">
              ${infoPanel("Metodologia", "Conoce las definiciones, fuentes, cobertura y metodologias utilizadas para cada indicador.", "clipboard", "Ver metodologia general")}
              ${infoPanel("Descargas y exportaciones", "Descarga los datos en el formato que necesites para tu analisis.", "download", "Exportar datos")}
              ${infoPanel("Notas y consideraciones", "Algunas series pueden estar sujetas a revisiones por nuevas fuentes de informacion.", "file", "Ver notas metodologicas")}
            </aside>
          </div>
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        <div class="cards-4">
          ${[
            ["Actualizacion periodica", "Datos actualizados de acuerdo con el calendario oficial de publicaciones.", "calendar"],
            ["Cobertura nacional y regional", "Series desagregadas por entidad federativa y sectores economicos.", "pin"],
            ["Fuentes oficiales y confiables", "Informacion proveniente de instituciones nacionales e internacionales.", "shield"],
            ["Datos abiertos", "Promovemos el acceso libre y uso responsable de la informacion.", "lock"]
          ].map(([title, text, ico]) => `<article class="value-card"><span class="line-icon">${icon(ico)}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}
        </div>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function infoPanel(title, text, ico, link) {
  return `<article class="panel">
    <div class="support-item">${icon(ico)}<div><h3>${title}</h3><p>${text}</p><a class="text-link" href="#/datos">${link} ${arrow()}</a></div></div>
  </article>`;
}

function indicatorTable() {
  const rows = [
    ["PIB Trimestral", "T1 2024", "2,4", "%", "↑ 0,6 p.p.", "BCV"],
    ["Inflacion Interanual", "Abr 2024", "58,7", "%", "↓ 2,1 p.p.", "BCV"],
    ["Tipo de cambio promedio", "May 2024", "36,25", "USD/VEF", "↑ 1,8%", "BCV"],
    ["Reservas internacionales", "May 2024", "8.925", "USD millones", "↓ 3,4%", "BCV"],
    ["Empleo informal", "T1 2024", "43,8", "%", "↓ 1,2 p.p.", "INE - OIT"],
    ["Liquidez monetaria (M2)", "Abr 2024", "67,9", "%", "↑ 4,5 p.p.", "BCV"]
  ];
  return `<table>
    <thead><tr><th>Indicador</th><th>Periodo</th><th>Valor</th><th>Unidad</th><th>Variacion</th><th>Fuente</th></tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function publicationsPage() {
  return `<div class="page">
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <div class="breadcrumb"><span>Inicio</span><span>Publicaciones</span><span>Informes y publicaciones</span></div>
          <h1>Informes y publicaciones</h1>
          <span class="accent-line"></span>
          <p class="lead">Explora nuestros informes, análisis y estudios sobre la economía venezolana. Información rigurosa, actualizada y confiable para comprender y transformar el país.</p>
          <form class="search-line js-form">
            <input class="field" type="search" placeholder="Buscar publicaciones por título, tema o palabra clave..." aria-label="Buscar publicaciones">
            <button class="icon-button" type="submit">${icon("search")}</button>
          </form>
          <div class="stat-row">
            <div class="stat-item">${icon("file")}<div><strong>128</strong><span class="tiny">Publicaciones disponibles</span></div></div>
            <div class="stat-item">${icon("download")}<div><strong>245k+</strong><span class="tiny">Descargas acumuladas</span></div></div>
          </div>
        </div>
        <div class="featured-panel">
          <img src="assets/publication-cover-1.png" alt="Portada Panorama Económico de Venezuela">
          <div class="featured-content">
            <span class="pill">Informe destacado</span>
            <h2>Panorama Económico de Venezuela</h2>
            <p>Mayo 2024</p>
            <p>Análisis integral de la evolución reciente de los principales indicadores macroeconómicos y sectoriales del país.</p>
            <a class="button button-ghost" href="#/informe-trimestral">Ver informe completo ${arrow()}</a>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="tabs">
          ${["Todos", "Informes", "Análisis", "Coyuntura", "Indicadores", "Notas metodológicas"].map((tab, i) => `<a class="${i === 0 ? "is-selected" : ""}" href="#/publicaciones">${tab}</a>`).join("")}
        </div>
        <div class="filter-row pub-controls">
          <p class="tiny">Mostrando 1-12 de 128 publicaciones</p>
          <select aria-label="Año"><option>Año: Todos</option></select>
          <select aria-label="Tema"><option>Tema: Todos</option></select>
          <select aria-label="Formato"><option>Formato: Todos</option></select>
          <select aria-label="Orden"><option>Más recientes</option></select>
        </div>
        <div class="pub-layout">
          <div class="publications-grid">${reports.map(reportCard).join("")}</div>
          <aside class="filter-sidebar">
            <div class="filter-panel">
              <h3>Refina tu búsqueda</h3>
              <strong>Año de publicación</strong>
              <a href="#/publicaciones">2024 (28)</a>
              <a href="#/publicaciones">2023 (32)</a>
              <a href="#/publicaciones">2022 (24)</a>
              <a href="#/publicaciones">2021 (18)</a>
              <a href="#/publicaciones">Ver más</a>
              <hr>
              <strong>Tema</strong>
              <a href="#/publicaciones">Macroeconomía (42)</a>
              <a href="#/publicaciones">Finanzas públicas (23)</a>
              <a href="#/publicaciones">Sector externo (18)</a>
              <a href="#/publicaciones">Mercado laboral (15)</a>
              <hr>
              <strong>Formato</strong>
              <a href="#/publicaciones">PDF (98)</a>
              <a href="#/publicaciones">Excel (14)</a>
              <a href="#/publicaciones">Presentación (9)</a>
            </div>
            <div class="filter-panel">
              <h3>¿No encuentras lo que buscas?</h3>
              <p>Explora nuestras colecciones temáticas o usa la búsqueda avanzada.</p>
              <a class="text-link" href="#/datos">Búsqueda avanzada ${arrow()}</a>
            </div>
          </aside>
        </div>
        <div style="text-align:center;margin-top:30px">
          <a class="button" href="#/publicaciones">Cargar más publicaciones ${icon("download")}</a>
        </div>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function reportDetailPage() {
  return `<div class="page">
    <section class="detail-hero">
      <div class="container">
        <div class="breadcrumb"><span>Inicio</span><span>Publicaciones</span><span>Informes economicos</span><span>T1 2024</span></div>
        <div class="detail-grid">
          <div>
            <div class="cover-img"><img src="assets/publication-cover-1.png" alt="Portada del informe economico trimestral"></div>
            <div class="button-row" style="margin-top:24px">
              <a class="button button-primary" href="manual_corporativo_ove_max_calidad.pdf">Descargar informe completo ${icon("download")}</a>
            </div>
          </div>
          <article>
            <span class="eyebrow">Informe economico trimestral</span>
            <h1>Informe economico trimestral T1 2024</h1>
            <p class="lead">Crecimiento resiliente en un entorno desafiante</p>
            <div class="detail-meta">
              <span>${icon("calendar")} Mayo 2024</span>
              <span>${icon("users")} Observatorio Venezolano de Economia</span>
              <span>${icon("file")} 52 paginas</span>
            </div>
            <h3 style="margin-top:28px">Resumen ejecutivo</h3>
            <p>Durante el primer trimestre de 2024, la economia venezolana mostro señales de resiliencia en medio de un contexto desafiante. El PIB real registro un crecimiento de 2,4% interanual, impulsado principalmente por el dinamismo del sector servicios y la recuperacion de la actividad petrolera.</p>
            <div class="button-row" style="margin-top:24px">
              <a class="button" href="manual_corporativo_ove_max_calidad.pdf">Resumen ejecutivo ${icon("download")}</a>
              <a class="button button-ghost" href="#/informe-trimestral">Ver version accesible</a>
            </div>
          </article>
          <aside class="key-data">
            <h3>Datos clave del informe</h3>
            ${metricData.slice(0, 4).map(metric => `<div class="key-item"><span class="tiny">${metric.title} ${metric.subtitle}</span><strong>${metric.value}</strong><span class="trend ${metric.direction === "down" ? "down" : ""}">${metric.direction === "down" ? "↓" : "↑"} ${metric.trend}</span></div>`).join("")}
          </aside>
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        <div style="display:flex;justify-content:space-between;gap:18px;align-items:center;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:18px 0">
          <div class="social"><a href="#/contacto">in</a><a href="#/contacto">X</a><a href="#/contacto">f</a></div>
          <a class="text-link" href="#/informe-trimestral">Guardar para despues ${icon("file")}</a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2>Hallazgos principales</h2>
        <span class="accent-line"></span>
        <div class="findings-grid">
          ${[
            ["Crecimiento moderado", "El PIB real crecio 2,4% interanual, impulsado por servicios e industria.", "trend"],
            ["Inflacion en moderacion", "La inflacion interanual se ubico en 58,7%, con una desaceleracion reciente.", "coin"],
            ["Tipo de cambio estable", "El tipo de cambio promedio se aprecio 1,8% respecto al mes anterior.", "dollar"],
            ["Reservas en recuperacion", "Las reservas internacionales aumentaron 3,4% respecto al mes anterior.", "bank"]
          ].map(([title, text, ico]) => `<article class="finding-card"><span class="line-icon">${icon(ico)}</span><div><h3>${title}</h3><p class="tiny">${text}</p></div></article>`).join("")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container content-sidebar">
        <div>
          <h2>Contenido del informe</h2>
          <span class="accent-line"></span>
          <div class="tabs" style="margin-bottom:18px"><a class="is-selected" href="#/informe-trimestral">Vista previa</a><a href="#/informe-trimestral">Tabla de contenidos</a></div>
          <div class="home-indicators three-charts">
            ${chartCard("Crecimiento del PIB real", "(Var. % interanual)", "blue")}
            ${chartCard("Inflacion interanual", "(Var. %)", "yellow")}
            ${chartCard("Tipo de cambio promedio", "(USD/VEF)", "red")}
          </div>
          <article class="panel" style="margin-top:18px">
            <h3>Sobre este informe</h3>
            <div class="cards-4 mini-grid-3">
              ${[
                ["Autores", "Equipo de investigacion del OVE", "file"],
                ["Fuente de datos", "BCV, INE, MPPEF, OPEP, FMI y fuentes nacionales.", "database"],
                ["Fecha de publicacion", "30 de mayo de 2024", "calendar"]
              ].map(([title, text, ico]) => `<div class="support-item">${icon(ico)}<div><h3>${title}</h3><p class="tiny">${text}</p></div></div>`).join("")}
            </div>
          </article>
        </div>
        <aside>
          <h2>Publicaciones relacionadas</h2>
          <div class="related-list">
            ${["Informe economico trimestral T4 2023", "Informe economico anual 2023", "Informe sectorial Panorama Petrolero Venezuela 2023"].map((title, index) => `<a class="related-item" href="#/publicaciones"><img src="${publicationCovers[(index + 1) % publicationCovers.length]}" alt="Portada relacionada"><div><h3>${title}</h3><p class="tiny">PDF ${icon("download")}</p></div></a>`).join("")}
          </div>
          <a class="text-link" style="margin-top:16px" href="#/publicaciones">Ver todas las publicaciones ${arrow()}</a>
        </aside>
      </div>
    </section>
    <section class="section-tight">
      <div class="container dashboard-grid">
        <article class="panel span-5">${infoPanel("Metodologia", "Este informe utiliza una metodologia rigurosa y transparente. Conoce los enfoques, definiciones y fuentes utilizadas en el analisis.", "clipboard", "Ver metodologia completa")}</article>
        <article class="panel span-7">
          <h3>Como citar este informe</h3>
          <p>Observatorio Venezolano de Economia. (2024). Informe economico trimestral T1 2024: Crecimiento resiliente en un entorno desafiante. OVE.</p>
          <button class="button button-small js-copy" type="button">Copiar cita ${icon("copy")}</button>
        </article>
      </div>
    </section>
    ${dataBand()}
    ${footer()}
  </div>`;
}

function dataPage() {
  return `<div class="page">
    ${pageHero({
      title: "Datos abiertos y API",
      lead: "Accede, descarga e integra informacion economica confiable para analizar, innovar y construir soluciones basadas en evidencia.",
      breadcrumb: ["Inicio", "Datos", "Datos abiertos y API"],
      actions: `<a class="button button-primary" href="#/datos">Explorar datasets ${arrow()}</a><a class="button" href="#/datos">Ver documentacion API ${icon("code")}</a>`
    })}
    ${topicsSection()}
    ${worldBankSourceSection()}
    <section id="datasets" class="section">
      <div class="container">
        <div class="section-title"><h2>Descarga datasets</h2><a class="text-link" href="#/datos">Ver todos los datasets ${arrow()}</a></div>
        <div class="dataset-grid">${datasets.map(datasetCard).join("")}</div>
      </div>
    </section>
    <section id="api" class="section-tight">
      <div class="container">
        <div class="section-title"><h2>Documentacion de la API</h2><a class="text-link" href="#/datos">Ver documentacion completa ${arrow()}</a></div>
        <article class="panel api-panel">
          <div>
            <h3>${icon("code")} Acceso programatico</h3>
            <p>Nuestra API REST permite consultar datos economicos de forma facil, segura y eficiente.</p>
            <p class="trend">✓ Autenticacion con API Key</p>
            <p class="trend">✓ Respuestas en JSON</p>
            <p class="trend">✓ Paginacion y filtros avanzados</p>
            <a class="button" href="#/contacto">Obtener API Key</a>
          </div>
          <div>
            <h3>Ejemplo de endpoint</h3>
            <p><span class="method">GET</span> /api/v1/indicadores/pib</p>
            <pre class="code-box">{
  "data": {
    "fecha": "2024-05-31",
    "valor": 128.4,
    "unidad": "indice (2010=100)",
    "variacion_interanual": 2.4
  },
  "meta": { "total": 1, "pagina": 1 }
}</pre>
          </div>
          <div>
            <h3>Parametros comunes</h3>
            <div style="display:grid;gap:10px">
              <input class="field" value="fecha_desde   YYYY-MM-DD" readonly>
              <input class="field" value="fecha_hasta   YYYY-MM-DD" readonly>
              <input class="field" value="frecuencia   mensual" readonly>
              <input class="field" value="formato   json" readonly>
            </div>
            <a class="button" style="margin-top:18px" href="#/datos">Probar en Swagger</a>
          </div>
        </article>
      </div>
    </section>
    <section class="section">
      <div class="container dashboard-grid">
        <div class="span-8">
          <div class="section-title"><h2>Formatos disponibles</h2></div>
          <div class="format-grid">
            ${[
              ["CSV", "Valores separados por comas, ideal para hojas de calculo y analisis tabular.", "file"],
              ["XLSX", "Formato nativo de Excel con metadatos y estructura de datos.", "file"],
              ["JSON", "Formato ligero para integracion en aplicaciones y servicios.", "code"]
            ].map(([title, text, ico]) => `<article class="value-card"><span class="line-icon">${icon(ico)}</span><h3>${title}</h3><p>${text}</p><a class="text-link" href="#/datos">Mas informacion ${arrow()}</a></article>`).join("")}
          </div>
        </div>
        <article class="panel span-4" style="align-self:end">
          <div class="support-item">${icon("monitor")}<div><h3>¿Eres desarrollador?</h3><p>Integra nuestros datos en tus aplicaciones, dashboards o investigaciones.</p><a class="button button-primary" href="#/datos">Explorar API ${arrow()}</a></div></div>
        </article>
        <article class="panel span-5">
          <h2>Datasets recientes</h2>
          <div class="table-wrap">${recentDatasetTable()}</div>
        </article>
        <div class="span-7">
          <div class="section-title"><h2>Categorias tematicas</h2><a class="text-link" href="#/datos">Ver todas ${arrow()}</a></div>
          <div class="category-grid">${datasets.concat([["Dinero y banca", "36 datasets", "", "database"], ["Social y demografia", "41 datasets", "", "users"]]).map(datasetCard).join("")}</div>
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        <div class="section-title"><h2>Herramientas para explorar datos</h2></div>
        <div class="format-grid">
          ${[
            ["Calculadoras interactivas", "Herramientas para calculos economicos rapidos y confiables.", "calculator"],
            ["Mapas economicos", "Visualiza indicadores economicos por regiones y entidades federales.", "map"],
            ["API Playground", "Prueba consultas, explora endpoints y genera codigo de ejemplo.", "code"]
          ].map(([title, text, ico]) => `<article class="value-card"><span class="line-icon">${icon(ico)}</span><h3>${title}</h3><p>${text}</p><a class="text-link" href="#/datos">Explorar ${arrow()}</a></article>`).join("")}
        </div>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function topicDetailPage(topicKey) {
  const topic = topicDetails[topicKey] || topicDetails.agriculture;

  return `<div class="page">
    ${pageHero({
      title: topic.title,
      lead: topic.lead,
      image: topic.image,
      breadcrumb: ["Inicio", "Datos", topic.title],
      actions: `<a class="button button-primary" href="#/datos">Volver a datos por temas ${arrow()}</a>`
    })}
    <section class="section">
      <div class="container">
        <div class="topic-detail-head">
          <div>
            <span class="eyebrow">En desarrollo</span>
            <h2>Operaciones priorizadas</h2>
            <p>Seleccionadas por pertinencia para Venezuela y marcadas como procesos en elaboración mientras se definen fuentes, periodicidad y metodologia.</p>
          </div>
          <img src="${topic.image}" alt="" loading="lazy" decoding="async">
        </div>
        <div class="topic-accordion">
          ${topic.groups.map((group, index) => topicGroup(group, index === 0)).join("")}
        </div>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function worldBankPage() {
  const totals = worldBankTotals();
  return `<div class="page">
    ${pageHero({
      title: "Banco Mundial - Venezuela",
      lead: "Catalogo descargable de indicadores del Banco Mundial para Venezuela, organizado por areas tematicas del Observatorio.",
      image: "assets/topics/topic-economy.png",
      breadcrumb: ["Inicio", "Datos", "Banco Mundial"],
      actions: `<a class="button button-primary" href="#/datos">Volver a Datos ${arrow()}</a>
        <a class="button" href="assets/data/world-bank/catalog/catalogo_dataset_web_ove_banco_mundial.xlsx" download>Descargar catalogo Excel ${icon("download")}</a>`
    })}
    <section class="section">
      <div class="container">
        <div class="world-bank-summary">
          <div>
            <span class="eyebrow">World Development Indicators</span>
            <h2>Fuente: Banco Mundial</h2>
            <p>Los archivos se guardan dentro del proyecto para publicacion estatica. El catalogo web usa rutas relativas y evita dependencias locales.</p>
          </div>
          <div class="source-stats">
            <span><strong>${worldBankCatalog.length}</strong> areas</span>
            <span><strong>${formatInteger(totals.records)}</strong> registros</span>
            <span><strong>${totals.indicators}</strong> indicadores</span>
            <span><strong>${totals.firstYear}-${totals.lastYear}</strong></span>
          </div>
        </div>
        <div class="world-bank-catalog-grid">
          ${worldBankCatalog.map(worldBankDatasetCard).join("")}
        </div>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function worldBankDatasetCard([area, id, records, indicators, firstYear, lastYear]) {
  const base = `assets/data/world-bank`;
  return `<article class="world-bank-card">
    <div>
      <span class="source-tag">Banco Mundial</span>
      <h3>${area}</h3>
      <p>${indicators} indicadores, ${formatInteger(records)} registros disponibles para Venezuela.</p>
    </div>
    <dl class="source-meta">
      <div><dt>Periodo</dt><dd>${firstYear}-${lastYear}</dd></div>
      <div><dt>ID</dt><dd>${id}</dd></div>
    </dl>
    <div class="download-row">
      <a href="${base}/csv/ove_banco_mundial_venezuela_${id}.csv" download>CSV</a>
      <a href="${base}/json/ove_banco_mundial_venezuela_${id}.json" download>JSON</a>
      <a href="${base}/excel/ove_banco_mundial_venezuela_${id}.xlsx" download>Excel</a>
    </div>
  </article>`;
}

function worldBankTotals() {
  return worldBankCatalog.reduce((totals, [, , records, indicators, firstYear, lastYear]) => ({
    records: totals.records + records,
    indicators: totals.indicators + indicators,
    firstYear: Math.min(totals.firstYear, firstYear),
    lastYear: Math.max(totals.lastYear, lastYear)
  }), { records: 0, indicators: 0, firstYear: Infinity, lastYear: 0 });
}

function formatInteger(value) {
  return new Intl.NumberFormat("es-VE").format(value);
}

function topicGroup(group, open = false) {
  return `<details class="topic-detail" ${open ? "open" : ""}>
    <summary><span>${group.title}</span></summary>
    <div class="topic-detail-body">
      ${group.sections.map(section => `
        <div class="topic-table">
          <div class="topic-table-head">
            <strong>${section.title}</strong>
            <strong>Periodicidad objetivo</strong>
          </div>
          ${section.rows.map(([name, status]) => `
            <div class="topic-table-row">
              <span>${name}</span>
              <span>${status}</span>
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>
  </details>`;
}

function datasetCard([title, count, text, ico]) {
  return `<article class="dataset-card">
    <span class="line-icon">${icon(ico)}</span>
    <h3>${title}</h3>
    <p class="tiny">${count}</p>
    ${text ? `<p>${text}</p>` : ""}
    <div class="format-tags"><span>CSV</span><span>XLSX</span><span>JSON</span></div>
  </article>`;
}

function recentDatasetTable() {
  const rows = [
    ["PIB Trimestral", "CSV", "11.2 KB", "28 May 2024"],
    ["Indice de Precios al Consumidor", "XLSX", "34.7 KB", "27 May 2024"],
    ["Exportaciones Totales", "CSV", "22.1 KB", "27 May 2024"],
    ["Ingresos del Sector Publico", "XLSX", "18.9 KB", "24 May 2024"],
    ["Encuesta de Coyuntura Laboral", "JSON", "12.3 KB", "23 May 2024"]
  ];
  return `<table><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}<td>${icon("download")}</td></tr>`).join("")}</tbody></table>`;
}

function aboutPage() {
  return `<div class="page">
    ${pageHero({
      title: "Nosotros",
      lead: "En el Observatorio Venezolano de Economía generamos información confiable, independiente y accesible para comprender la economía y contribuir a mejores decisiones para el país.",
      image: "assets/venezuela-city-wide.jpg",
      breadcrumb: ["Inicio", "Nosotros", "Metodología / Transparencia"],
      dark: true
    })}
    <section class="section">
      <div class="container about-grid">
        ${[
          ["Misión", "Generar, analizar y difundir información económica rigurosa, independiente y accesible para impulsar mejores decisiones y contribuir al desarrollo sostenible del país.", "target"],
          ["Visión", "Ser el referente nacional en información económica confiable y análisis aplicado, reconocido por su impacto, independencia y compromiso con Venezuela.", "eye"],
          ["Valores", "Independencia, rigor técnico, transparencia, servicio público, innovación y colaboración.", "users"]
        ].map(([title, text, ico]) => `<article class="value-card"><span class="line-icon">${icon(ico)}</span><h2>${title}</h2><span class="accent-line"></span><p>${text}</p></article>`).join("")}
      </div>
    </section>
    <section class="section-tight">
      <div class="container dashboard-grid">
        <article class="panel span-5">
          <h2>Nuestro equipo</h2>
          <span class="accent-line"></span>
          <p>Actualmente el Observatorio está en una etapa inicial de desarrollo, con Carlos Marzol liderando la construcción de la plataforma, la identidad digital y la organización del contenido.</p>
          <div class="profile-row">
            <div class="profile profile-featured">
              <span class="avatar">CM</span>
              <strong>Carlos Marzol</strong>
              <p class="tiny">Fundador y responsable del proyecto</p>
            </div>
          </div>
          <a class="button" href="#/contacto">Contactar con Carlos ${arrow()}</a>
        </article>
        <article class="panel span-7">
          <h2>Nuestra metodología</h2>
          <span class="accent-line"></span>
          <p>Aplicamos principios metodológicos que garantizan la calidad y consistencia de nuestra información.</p>
          <div class="cards-4 mini-grid-5">
            ${[
              ["Rigor técnico", "Métodos estadísticos y econométricos estandarizados.", "trend"],
              ["Fuentes verificadas", "Usamos fuentes oficiales y alternativas de alta calidad.", "shield"],
              ["Transparencia", "Documentamos procesos, supuestos y limitaciones.", "eye"],
              ["Reproducibilidad", "Nuestros cálculos pueden ser replicados y auditados.", "code"],
              ["Actualización", "Revisamos y actualizamos la información periódicamente.", "plus"]
            ].map(([title, text, ico]) => `<div><span class="line-icon">${icon(ico)}</span><h3>${title}</h3><p class="tiny">${text}</p></div>`).join("")}
          </div>
        </article>
      </div>
    </section>
    <section class="section">
      <div class="container dashboard-grid">
        <article class="panel span-5">
          <h2>Fuentes de información</h2>
          <span class="accent-line"></span>
          <p>Combinamos fuentes oficiales y alternativas para ofrecer una visión integral y actualizada.</p>
          <div class="cards-4 mini-grid-3">
            ${[
              ["Fuentes oficiales", "BCV, INE, MPPEF, Cantv, Sudeban, PDVSA, entre otras.", "bank"],
              ["Fuentes alternativas", "Organismos internacionales, investigaciones académicas y reportes especializados.", "globe"],
              ["Datos propios", "Índices y encuestas diseñadas por el OVE para necesidades específicas.", "users"]
            ].map(([title, text, ico]) => `<div><span class="line-icon">${icon(ico)}</span><h3>${title}</h3><p class="tiny">${text}</p></div>`).join("")}
          </div>
        </article>
        <article class="panel span-7">
          <h2>Transparencia y gobernanza</h2>
          <span class="accent-line"></span>
          <p>Operamos con independencia y rendición de cuentas.</p>
          <div class="cards-4 mini-grid-3">
            ${[
              ["Independencia institucional", "No respondemos a intereses partidistas ni económicos.", "shield"],
              ["Financiamiento transparente", "Promovemos el acceso libre y responsable a los datos.", "bank"],
              ["Ética y buenas prácticas", "Seguimos estándares internacionales de investigación y publicación.", "target"]
            ].map(([title, text, ico]) => `<div class="support-item">${icon(ico)}<div><h3>${title}</h3><p class="tiny">${text}</p></div></div>`).join("")}
          </div>
        </article>
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        <h2>Nuestra trayectoria</h2>
        <p>Más de una década generando información que impulsa el debate público y mejores decisiones.</p>
        <div class="timeline">
          ${[
            ["2014", "Nace el OVE con la misión de promover economía basada en evidencia."],
            ["2016", "Lanzamos nuestro portal web con indicadores económicos clave."],
            ["2018", "Iniciamos la publicación de informes y reportes especializados."],
            ["2020", "Ampliamos fuentes y desarrollamos indicadores propios."],
            ["2022", "Alcanzamos 10 millones de visualizaciones en nuestras plataformas."],
            ["2024", "Reafirmamos nuestro compromiso con transparencia y país."]
          ].map(([year, text]) => `<div class="timeline-item"><h3>${year}</h3><p class="tiny">${text}</p></div>`).join("")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container dashboard-grid">
        <article class="panel span-4">
          <h2>Aliados estratégicos</h2>
          <span class="accent-line"></span>
          <p>Colaboramos con instituciones nacionales e internacionales que comparten nuestra visión.</p>
          <div class="logos-row"><span>CAF</span><span>BID</span><span>ONU</span><span>UCAB</span></div>
        </article>
        <article class="panel span-4">
          <h2>Preguntas frecuentes</h2>
          ${faqList(["¿El OVE recibe financiamiento del gobierno?", "¿Cómo se financia el Observatorio?", "¿Cómo se seleccionan y validan los datos?", "¿Puedo utilizar la información del OVE?"])}
        </article>
        <article class="panel span-4 about-cta-card">
          <h2>Con información confiable construimos un mejor país.</h2>
          <p>Tu confianza nos impulsa a seguir trabajando con rigor, independencia y transparencia.</p>
          <a class="button button-primary" href="#/indicadores">Explorar indicadores ${arrow()}</a>
        </article>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function faqList(items) {
  return `<div class="faq-list">${items.map(item => `<details class="faq-item"><summary>${item}</summary><p class="tiny">Nuestro equipo responde con criterios técnicos, fuentes verificables y procesos documentados.</p></details>`).join("")}</div>`;
}

function contactPage() {
  return `<div class="page">
    ${pageHero({
      title: "Contacto y boletín",
      lead: "Estamos para escucharte. Escríbenos, visítanos o suscríbete para recibir información económica confiable y oportuna.",
      image: "assets/venezuela-avila.jpg",
      actions: `<a class="text-link" href="#/contacto">${icon("mail")} Envíanos un mensaje</a><a class="text-link" href="#/contacto">${icon("phone")} Llámanos</a><a class="text-link" href="#/contacto">${icon("pin")} Visítanos</a>`,
      breadcrumb: []
    })}
    <section class="section">
      <div class="container contact-grid">
        <article id="mensaje" class="panel">
          <h2>${icon("mail")} Envíanos un mensaje</h2>
          <form class="form-grid js-form">
            <input class="field full" type="text" placeholder="Nombre completo *" required>
            <input class="field full" type="email" placeholder="Correo electrónico *" required>
            <input class="field" type="tel" placeholder="Teléfono">
            <select class="field" required><option>Consulta general</option><option>Datos</option><option>Prensa</option></select>
            <textarea class="field full" placeholder="Cuéntanos en qué podemos ayudarte..." required></textarea>
            <label class="check-line full"><input type="checkbox" required> Acepto la política de privacidad y el tratamiento de mis datos personales.</label>
            <button class="button button-primary full" type="submit">Enviar mensaje ${arrow()}</button>
          </form>
          <p class="tiny">Te responderemos a la brevedad posible.</p>
        </article>
        <article id="sedes" class="panel">
          <h2>${icon("bank")} Nuestras sedes</h2>
          <div class="office">
            <h3>Sede principal - Caracas</h3>
            <p>${icon("pin")} Av. Francisco de Miranda, Torre Europa, Piso 11, Caracas, Venezuela.</p>
            <p>${icon("phone")} +58 412 123 4567</p>
            <p>${icon("mail")} info@observatoriodeeconomia.org.ve</p>
            <p>${icon("calendar")} Lun - Vie: 8:30 a. m. - 5:30 p. m.</p>
          </div>
          <div class="office">
            <h3>Sede centro - Valencia</h3>
            <p>${icon("pin")} C.C. Concepto La Viña, Torre A, Piso 6, Oficina 6-A, Valencia.</p>
            <p>${icon("phone")} +58 241 123 4567</p>
            <p>${icon("mail")} info.valencia@observatoriodeeconomia.org.ve</p>
          </div>
        </article>
        <aside class="stack-gap">
          <article class="panel">
            <h2>${icon("megaphone")} Contacto para medios</h2>
            <p>Para entrevistas, declaraciones o solicitudes de información para prensa.</p>
            <div class="filter-panel">
              <h3>Maria Fernanda Lopez</h3>
              <p>Coordinadora de Comunicaciones</p>
              <p>${icon("phone")} +58 412 123 4567</p>
              <p>${icon("mail")} prensa@observatoriodeeconomia.org.ve</p>
              <p>${icon("pin")} Caracas, Venezuela</p>
            </div>
          </article>
          <article class="panel">
            <span class="line-icon">${icon("quote")}</span>
            <p><strong>Promovemos el análisis riguroso y la difusión de información económica confiable para contribuir a mejores decisiones para el país.</strong></p>
            <span class="accent-line"></span>
          </article>
        </aside>
      </div>
    </section>
    <section class="section-tight">
      <div class="container dashboard-grid">
        <article class="panel span-4" style="color:#fff;background:linear-gradient(135deg,var(--navy-950),var(--blue-700))">
          <h2 style="color:#fff">${icon("mail")} Suscríbete a nuestro boletín</h2>
          <p>Recibe análisis, indicadores y publicaciones directamente en tu correo.</p>
          <form class="subscribe-form js-form"><input class="field" type="email" placeholder="tu@email.com" required><button class="button button-yellow">Suscribirme ${arrow()}</button></form>
          <p class="tiny" style="color:#dce8ff">Al suscribirte, aceptas nuestra política de privacidad.</p>
        </article>
        <article class="panel span-3">
          <h2>Síguenos en redes sociales</h2>
          <p class="social"><a href="#/contacto">f</a><a href="#/contacto">X</a><a href="#/contacto">ig</a><a href="#/contacto">in</a><a href="#/contacto">yt</a></p>
        </article>
        <article id="mapa" class="panel span-5 map-card">
          <h2>Dónde estamos</h2>
          <img src="assets/map-preview.png" alt="Mapa de ubicación del OVE">
          <a class="text-link" href="#/contacto">Ver en Google Maps ${arrow()}</a>
        </article>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2>Preguntas frecuentes</h2>
        <div class="cards-4">
          ${[
            ["¿Qué tipo de consultas atienden?", "Respondemos consultas sobre indicadores, informes, publicaciones, datos y colaboración institucional."],
            ["¿En cuánto tiempo responden?", "Nuestro tiempo de respuesta habitual es de 24 a 48 horas hábiles."],
            ["¿Puedo solicitar datos específicos?", "Sí. Escríbenos tu requerimiento y te orientaremos sobre la información disponible."],
            ["¿Cómo puedo colaborar con el OVE?", "Completa el formulario de colaboración y nuestro equipo se pondrá en contacto contigo."]
          ].map(([q, a]) => `<details class="faq-item"><summary>${q}</summary><p>${a}</p></details>`).join("")}
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container panel">
        <div class="contact-grid collab-grid">
          <div>
            <h2>${icon("users")} Colabora con nosotros</h2>
            <p>Si eres investigador, estudiante, institución o profesional independiente y deseas contribuir con análisis, estudios o proyectos, completa el siguiente formulario.</p>
            <a class="button" href="#/nosotros">Conoce nuestras líneas de trabajo ${arrow()}</a>
          </div>
          <form class="form-grid js-form">
            <input class="field" type="text" placeholder="Nombre completo *" required>
            <input class="field" type="email" placeholder="Correo electrónico *" required>
            <select class="field"><option>Investigación</option><option>Datos</option><option>Alianzas</option></select>
            <textarea class="field full" placeholder="Describe brevemente tu propuesta..." required></textarea>
            <button class="button button-primary full" type="submit">Enviar propuesta ${arrow()}</button>
          </form>
        </div>
      </div>
    </section>
    <section class="dark-band">
      <div class="container cta-panel">
        <div>
          <h2>Conectemos para transformar información en mejores decisiones.</h2>
          <p>Tu opinión y participación son fundamentales para seguir construyendo un país con datos, análisis y futuro.</p>
        </div>
        <a class="button button-ghost" href="#/contacto">Escríbenos ahora ${arrow()}</a>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function render() {
  const route = normalizeRoute(location.hash.replace("#", "") || "/");
  const view = routes[route] || routes["/"];
  const meta = routeMeta[route] || routeMeta["/"];
  const currentRender = ++routeRenderId;
  const firstRender = lastRoute === null;

  const paintView = () => {
    if (currentRender !== routeRenderId) return;

    appRoot.innerHTML = view();
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);
    appRoot.focus({ preventScroll: true });
    updateActiveNav(route);
    wireForms();
    prepareRevealAnimations(appRoot);

    if (!firstRender) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }

    appRoot.classList.remove("route-leaving");
    appRoot.classList.add("route-entering");

    window.requestAnimationFrame(() => {
      if (currentRender !== routeRenderId) return;
      appRoot.classList.add("route-ready");
      window.setTimeout(() => {
        if (currentRender !== routeRenderId) return;
        appRoot.classList.remove("route-entering", "route-ready");
      }, prefersReducedMotion ? 0 : 1250);
    });

    lastRoute = route;
  };

  if (firstRender || prefersReducedMotion) {
    paintView();
    return;
  }

  appRoot.classList.remove("route-entering", "route-ready");
  appRoot.classList.add("route-leaving");
  window.setTimeout(paintView, 150);
}

function normalizeRoute(route) {
  if (!route || route === "") return "/";
  return route.startsWith("/") ? route : `/${route}`;
}

function updateActiveNav(route) {
  document.querySelectorAll("[data-route]").forEach(link => {
    const linkRoute = link.getAttribute("data-route");
    const active = linkRoute === "/" ? route === "/" : route.startsWith(linkRoute);
    link.classList.toggle("is-active", active);
  });
}

function wireForms() {
  document.querySelectorAll(".js-form").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const button = form.querySelector("button");
      if (!button) return;
      const original = button.innerHTML;
      button.innerHTML = "Enviado";
      button.disabled = true;
      window.setTimeout(() => {
        button.innerHTML = original;
        button.disabled = false;
        form.reset();
      }, 1800);
    });
  });
  const copy = document.querySelector(".js-copy");
  if (copy) {
    copy.addEventListener("click", async () => {
      const text = "Observatorio Venezolano de Economía. (2024). Informe económico trimestral T1 2024.";
      try {
        await navigator.clipboard.writeText(text);
        copy.textContent = "Cita copiada";
      } catch {
        copy.textContent = "Cita lista";
      }
    });
  }
}

function prepareRevealAnimations(root) {
  const revealItems = root.querySelectorAll([
    ".hero-copy",
    ".hero-art",
    ".topic-panel h2",
    ".topic-card",
    ".topic-detail-head",
    ".topic-detail",
    ".world-source-panel",
    ".world-bank-summary",
    ".world-bank-card",
    ".metric-card",
    ".chart-card",
    ".support-panel",
    ".report-card",
    ".tool-card",
    ".value-card",
    ".photo-panel",
    ".newsletter-inner > *",
    ".footer-brand",
    ".footer-col",
    ".side-menu",
    ".filter-box",
    ".panel",
    ".tabs",
    ".featured-panel",
    ".filter-panel",
    ".detail-grid > *",
    ".finding-card",
    ".related-item",
    ".dataset-card",
    ".category-grid > *",
    ".about-grid > *",
    ".timeline-item",
    ".faq-item",
    ".office",
    ".map-card",
    ".cta-panel > *"
  ].join(","));

  if (revealObserver) {
    revealObserver.disconnect();
  }

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(item => item.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px"
  });

  revealItems.forEach((item, index) => {
    item.classList.add("reveal-on-scroll");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 10, 7) * 45}ms`);
    revealObserver.observe(item);
  });
}

function syncHeaderState() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
}

document.querySelector(".nav-toggle").addEventListener("click", event => {
  const open = document.body.classList.toggle("nav-open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".main-nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    document.querySelector(".nav-toggle").setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("scroll", syncHeaderState, { passive: true });
window.addEventListener("hashchange", render);
syncHeaderState();
render();
