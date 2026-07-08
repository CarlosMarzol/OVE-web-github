const routes = {
  "/": homePage,
  "/indicadores": indicatorsPage,
  "/publicaciones": publicationsPage,
  "/informe-trimestral": reportDetailPage,
  "/datos": dataPage,
  "/datos/banco-mundial": worldBankPage,
  "/datos/bcv": bcvPage,
  "/datos/tipo-cambio": exchangeRatePage,
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
    description: "Indicadores actualizados para Venezuela con fuentes BCV y Banco Mundial."
  },
  "/publicaciones": {
    title: "Informes y publicaciones | OVE",
    description: "Repositorio de informes del OVE en construcción. Aún no hay informes publicados."
  },
  "/informe-trimestral": {
    title: "Ejemplo de informe económico | OVE",
    description: "Plantilla de informe del OVE mostrada como ejemplo, sin datos publicados."
  },
  "/datos": {
    title: "Banco de datos | OVE",
    description: "Datos abiertos, catálogos y herramientas para análisis económico."
  },
  "/datos/banco-mundial": {
    title: "Banco Mundial Venezuela | OVE",
    description: "Series del Banco Mundial organizadas para el análisis económico de Venezuela."
  },
  "/datos/bcv": {
    title: "Banco Central de Venezuela | OVE",
    description: "Datos oficiales del Banco Central de Venezuela integrados al Observatorio."
  },
  "/datos/tipo-cambio": {
    title: "Tipo de cambio BCV | OVE",
    description: "Cuadro de mando del tipo de cambio oficial BCV con descargas diarias en CSV, JSON y Excel OVE."
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
    title: "PIB real",
    subtitle: "Variación anual",
    value: "8,94%",
    period: "2025",
    trend: "BCV oficial",
    direction: "up",
    icon: "trend"
  },
  {
    title: "PIB corriente",
    subtitle: "Dólares corrientes",
    value: "US$ 99,7 mil millones",
    period: "2025",
    trend: "Banco Mundial - WDI",
    direction: "down",
    color: "yellow",
    icon: "bank"
  },
  {
    title: "Tipo de cambio BCV",
    subtitle: "Bs/USD",
    value: "685,9427",
    period: "8 jul 2026",
    trend: "BCV oficial",
    direction: "down",
    color: "red",
    icon: "dollar"
  },
  {
    title: "INPC mensual",
    subtitle: "Variación mensual",
    value: "6,3%",
    period: "mayo 2026",
    trend: "BCV oficial",
    direction: "up",
    icon: "coin"
  },
  {
    title: "Desempleo total",
    subtitle: "Porcentaje de la fuerza laboral",
    value: "5,31%",
    period: "2025",
    trend: "Banco Mundial - WDI",
    direction: "down",
    icon: "users"
  }
];

const keyIndicatorDownloads = {
  csv: "assets/data/indicadores-clave/ove_indicadores_clave_venezuela.csv",
  json: "assets/data/indicadores-clave/ove_indicadores_clave_venezuela.json",
  excel: "assets/data/indicadores-clave/ove_indicadores_clave_venezuela.xlsx"
};

const exchangeDownloads = {
  usdCsv: "assets/data/bcv/csv/ove_bcv_tipo_cambio_usd.csv",
  usdJson: "assets/data/bcv/json/ove_bcv_tipo_cambio_usd.json",
  usdExcel: "assets/data/bcv/excel/ove_bcv_tipo_cambio_usd.xlsx",
  smcCsv: "assets/data/bcv/csv/ove_bcv_tipo_cambio_referencia_smc.csv",
  smcJson: "assets/data/bcv/json/ove_bcv_tipo_cambio_referencia_smc.json",
  smcExcel: "assets/data/bcv/excel/ove_bcv_tipo_cambio_referencia_smc.xlsx",
  source: "https://www.bcv.org.ve/estadisticas/tipo-cambio-de-referencia-smc"
};

const exchangeCurrencies = [
  ["USD", "Dólar estadounidense"],
  ["EUR", "Euro"],
  ["CNY", "Yuan chino"],
  ["TRY", "Lira turca"],
  ["RUB", "Rublo ruso"]
];

const keyIndicatorSeries = [
  {
    id: "pib_real_bcv",
    title: "PIB real",
    area: "Economía",
    source: "BCV",
    latest: "8,94%",
    period: "2025",
    unit: "% anual",
    frequency: "Anual",
    href: "assets/data/bcv/excel/ove_bcv_pib_real_anual.xlsx"
  },
  {
    id: "pib_corriente_wdi",
    title: "PIB corriente",
    area: "Economía",
    source: "Banco Mundial - WDI",
    latest: "99,7",
    period: "2025",
    unit: "US$ mil millones",
    frequency: "Anual",
    href: "assets/data/world-bank/excel/ove_banco_mundial_venezuela_macroeconomia.xlsx"
  },
  {
    id: "pib_per_capita_wdi",
    title: "PIB per cápita",
    area: "Economía",
    source: "Banco Mundial - WDI",
    latest: "3.494,8",
    period: "2025",
    unit: "US$",
    frequency: "Anual",
    href: "assets/data/world-bank/excel/ove_banco_mundial_venezuela_macroeconomia.xlsx"
  },
  {
    id: "inpc_nacional_bcv",
    title: "INPC nacional",
    area: "Nivel y condiciones de vida",
    source: "BCV",
    latest: "6,3",
    period: "05/2026",
    unit: "% mensual",
    frequency: "Mensual",
    href: "assets/data/bcv/excel/ove_bcv_inpc_nacional_mensual.xlsx"
  },
  {
    id: "desempleo_total_wdi",
    title: "Desempleo total",
    area: "Mercado laboral",
    source: "Banco Mundial - WDI",
    latest: "5,31",
    period: "2025",
    unit: "% fuerza laboral",
    frequency: "Anual",
    href: "assets/data/world-bank/excel/ove_banco_mundial_venezuela_mercado_laboral.xlsx"
  },
  {
    id: "tipo_cambio_bcv_usd",
    title: "Tipo de cambio BCV",
    area: "Economía",
    source: "BCV",
    latest: "685,9427",
    period: "08/07/2026",
    unit: "Bs/USD",
    frequency: "Diaria",
    href: "assets/data/bcv/excel/ove_bcv_tipo_cambio_usd.xlsx"
  }
];

const dashboardSeries = {
  pib_real_bcv: {
    title: "PIB real",
    unit: "% anual",
    source: "Banco Central de Venezuela",
    points: [[2018, -21.3959], [2019, -28.9915], [2020, -33.2038], [2021, 1.111], [2022, 14.9177], [2023, 5.1436], [2024, 9.0255], [2025, 8.9445]]
  },
  pib_corriente_wdi: {
    title: "PIB corriente",
    unit: "US$ mil millones",
    source: "Banco Mundial - WDI",
    scale: 1000000000,
    points: [[2018, 101987075928.918], [2019, 73014157107.594], [2020, 42837965906.8675], [2021, 56615026262.6535], [2022, 89013251020.9831], [2023, 102377501185.925], [2024, 120566112397.063], [2025, 99661244155.6306]]
  },
  pib_per_capita_wdi: {
    title: "PIB per cápita",
    unit: "US$",
    source: "Banco Mundial - WDI",
    points: [[2018, 3421.5134], [2019, 2523.1153], [2020, 1506.0417], [2021, 2004.9357], [2022, 3155.0419], [2023, 3617.4704], [2024, 4244.4572], [2025, 3494.8139]]
  },
  inpc_nacional_bcv: {
    title: "INPC nacional",
    unit: "% mensual",
    source: "Banco Central de Venezuela",
    points: [["2025-10", 25.9313], ["2025-11", 21.6], ["2025-12", 13.6], ["2026-01", 32.6], ["2026-02", 14.6], ["2026-03", 13.1], ["2026-04", 10.6], ["2026-05", 6.3]]
  },
  desempleo_total_wdi: {
    title: "Desempleo total",
    unit: "% fuerza laboral",
    source: "Banco Mundial - WDI",
    points: [[2018, 5.468], [2019, 5.89], [2020, 7.53], [2021, 7.027], [2022, 5.646], [2023, 5.407], [2024, 5.321], [2025, 5.307]]
  },
  tipo_cambio_bcv_usd: {
    title: "Tipo de cambio BCV",
    unit: "Bs/USD",
    source: "Banco Central de Venezuela",
    points: [["2026-06-25", 621.5299], ["2026-06-26", 622.2135], ["2026-06-30", 623.0223], ["2026-07-01", 633.3644], ["2026-07-02", 639.7029], ["2026-07-03", 652.9726], ["2026-07-06", 667.05], ["2026-07-08", 685.9427]]
  }
};

const reports = [
  ["Ejemplo", "Plantilla de informe macroeconómico", "Sin publicar", "Ejemplo visual de cómo se verá un informe cuando el OVE emita su primera publicación.", "dark"],
  ["Ejemplo", "Plantilla de nota metodológica", "Sin publicar", "Estructura demostrativa para futuras notas técnicas. No contiene datos reales.", "light"],
  ["Ejemplo", "Plantilla de análisis sectorial", "Sin publicar", "Modelo de tarjeta para ordenar análisis sectoriales cuando existan fuentes validadas.", "dark"]
];

const publicationCovers = [
  "assets/publication-cover-1.png",
  "assets/publication-cover-2.png",
  "assets/publication-cover-3.png",
  "assets/publication-cover-4.png"
];

const datasets = [
  ["Cuentas nacionales", "Banco Mundial / BCV", "PIB, demanda agregada, estructura productiva y catálogos oficiales BCV.", "trend"],
  ["Precios e inflación", "Banco Mundial / BCV", "Inflación WDI, tipo de cambio oficial y catálogos INPC BCV.", "tag"],
  ["Comercio exterior", "Banco Mundial", "Exportaciones, importaciones, cuenta corriente, deuda e inversión extranjera.", "globe"],
  ["Finanzas públicas", "Banco Mundial", "Series fiscales WDI disponibles para Venezuela, con rezagos documentados.", "bank"],
  ["Mercado laboral", "Banco Mundial", "Desempleo, fuerza laboral, participación y empleo sectorial.", "users"],
  ["Sector real", "Banco Mundial", "PIB, inversión, consumo y valor agregado sectorial cuando existe dato publicado.", "factory"]
];

const worldBankCatalog = [
  ["Demografía", "demografia", 529, 8, 1960, 2026],
  ["Educación", "educacion", 330, 5, 1960, 2025],
  ["Energía y ambiente", "energia_y_ambiente", 330, 5, 1960, 2025],
  ["Género", "genero", 330, 5, 1960, 2025],
  ["Infraestructura y digitalización", "infraestructura_y_digitalizacion", 264, 4, 1960, 2025],
  ["Macroeconomía", "macroeconomia", 660, 10, 1960, 2025],
  ["Mercado laboral", "mercado_laboral", 660, 10, 1960, 2025],
  ["Pobreza y desigualdad", "pobreza_y_desigualdad", 330, 5, 1960, 2025],
  ["Precios e inflación", "precios_e_inflacion", 462, 7, 1960, 2025],
  ["Salud", "salud", 463, 7, 1960, 2026],
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
    keyIndicators: ["pib_real_bcv", "pib_corriente_wdi", "pib_per_capita_wdi", "tipo_cambio_bcv_usd", "inpc_nacional_bcv"],
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
              ["Credito, liquidez y tasas de interes (en elaboración)", "Mensual"],
              ["Tipo de cambio BCV diario y referencia SMC multimoneda", "Diaria"]
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
    keyIndicators: ["desempleo_total_wdi"],
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
    keyIndicators: ["inpc_nacional_bcv"],
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

function exampleTag(text = "Ejemplo") {
  return `<span class="example-tag">${text}</span>`;
}

function exampleNotice(text = "Contenido de ejemplo. El OVE aún no ha publicado datos propios para esta sección.") {
  return `<p class="example-note">${text}</p>`;
}

function metricCards(extraClass = "") {
  return `<div class="metrics-grid ${extraClass}">
    ${metricData.map(metric => {
      const exchangeAttrs = metric.title === "Tipo de cambio BCV" ? ' data-bcv-usd-latest data-bcv-compact="true"' : "";
      const valueAttrs = metric.title === "Tipo de cambio BCV" ? " data-bcv-usd-value" : "";
      const periodAttrs = metric.title === "Tipo de cambio BCV" ? " data-bcv-usd-date" : "";
      return `
      <article class="metric-card"${exchangeAttrs}>
        <div class="metric-head">
          <span class="metric-icon ${metric.color || ""}">${icon(metric.icon)}</span>
          <div>
            <div class="metric-title">${metric.title}</div>
            <div class="metric-subtitle">${metric.subtitle}</div>
          </div>
        </div>
        <div class="metric-value"${valueAttrs}>${metric.value}</div>
        <div class="tiny"${periodAttrs}>${metric.period}</div>
        <div class="trend neutral">${metric.trend}</div>
      </article>
    `;
    }).join("")}
  </div>`;
}

function lineChart(kind = "blue") {
  const configs = {
    blue: {
      line: "chart-line-blue",
      tag: "tag-value",
      color: "#0052B4",
      label: "WDI",
      points: "16,70 56,112 88,87 120,72 158,25 196,48 236,60 282,52",
      circles: [[16, 70], [56, 112], [88, 87], [120, 72], [158, 25], [196, 48], [236, 60], [282, 52]]
    },
    yellow: {
      line: "chart-line-yellow",
      tag: "tag-yellow",
      color: "#FFC20E",
      label: "BCV",
      points: "18,112 58,105 96,92 128,72 160,38 188,18 220,45 266,48",
      area: "18,112 58,105 96,92 128,72 160,38 188,18 220,45 266,48 266,124 18,124",
      circles: [[18, 112], [58, 105], [96, 92], [128, 72], [160, 38], [188, 18], [220, 45], [266, 48]]
    },
    red: {
      line: "chart-line-red",
      tag: "tag-red",
      color: "#D62828",
      label: "WDI",
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
      <text x="15" y="143" class="chart-label">2021</text>
      <text x="82" y="143" class="chart-label">2022</text>
      <text x="149" y="143" class="chart-label">2023</text>
      <text x="216" y="143" class="chart-label">2024</text>
      <text x="257" y="143" class="chart-label">2025</text>
    </svg>
  `;
}

function formatDashboardValue(value, scale = 1) {
  const scaled = value / scale;
  return new Intl.NumberFormat("es-VE", {
    maximumFractionDigits: Math.abs(scaled) >= 100 ? 1 : 2
  }).format(scaled);
}

function sparklineSvg(series) {
  if (!series?.points?.length) return "";
  const values = series.points.map(([, value]) => value / (series.scale || 1));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 620;
  const height = 260;
  const padX = 38;
  const padY = 34;
  const step = (width - padX * 2) / Math.max(series.points.length - 1, 1);
  const coords = values.map((value, index) => {
    const x = padX + index * step;
    const y = height - padY - ((value - min) / range) * (height - padY * 2);
    return [x, y];
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} ${coords[coords.length - 1][0].toFixed(1)},${height - padY} ${coords[0][0].toFixed(1)},${height - padY}`;
  const firstLabel = series.points[0][0];
  const lastLabel = series.points[series.points.length - 1][0];
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${series.title}">
    <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" class="chart-grid"></line>
    <line x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}" class="chart-grid"></line>
    <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" class="chart-axis"></line>
    <polygon points="${area}" class="key-chart-area"></polygon>
    <polyline points="${line}" class="chart-line-blue"></polyline>
    ${coords.map(([x, y], index) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${index === coords.length - 1 ? 5 : 4}" class="key-chart-dot"></circle>`).join("")}
    <text x="${padX}" y="${height - 8}" class="chart-label">${firstLabel}</text>
    <text x="${width - padX}" y="${height - 8}" class="chart-label" text-anchor="end">${lastLabel}</text>
    <text x="${width - padX}" y="${padY - 10}" class="chart-label" text-anchor="end">${formatDashboardValue(max, 1)} ${series.unit}</text>
    <text x="${width - padX}" y="${height - padY - 8}" class="chart-label" text-anchor="end">${formatDashboardValue(min, 1)} ${series.unit}</text>
  </svg>`;
}

function chartCard(title, small, kind) {
  return `<article class="chart-card">
    <div class="chart-title"><span>${title}</span><small>${small}</small></div>
    <div class="chart">${lineChart(kind)}</div>
  </article>`;
}

function barChart() {
  const rows = [
    ["Consumo final / PIB", 89],
    ["Formación bruta capital / PIB", 6],
    ["Exportaciones / PIB", 15],
    ["Importaciones / PIB", 10],
    ["Desempleo total", 5],
    ["Mujeres en parlamento", 32],
    ["Usuarios de internet", 77]
  ];
  return `<div style="display:grid;gap:9px">
    ${rows.map(([label, value]) => `
      <div style="display:grid;grid-template-columns:160px 1fr 42px;align-items:center;gap:10px;font-size:.78rem">
        <span>${label}</span>
        <span style="height:12px;background:#e9eff7;border-radius:999px;overflow:hidden"><span style="display:block;height:100%;width:${value}%;background:var(--blue-700)"></span></span>
        <strong>${value}%</strong>
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
      <rect x="160" y="35" width="10" height="10" fill="#0052B4"></rect><text x="178" y="44">Actividad</text>
      <rect x="160" y="60" width="10" height="10" fill="#0B1D3D"></rect><text x="178" y="69">Precios</text>
      <rect x="160" y="85" width="10" height="10" fill="#FFC20E"></rect><text x="178" y="94">Laboral</text>
      <rect x="160" y="110" width="10" height="10" fill="#D62828"></rect><text x="178" y="119">Externo</text>
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
      <text x="260" y="58">Nacional</text>
      <text x="260" y="84">Caracas</text>
      <text x="260" y="110">Occidente</text>
      <text x="260" y="136">Oriente</text>
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
        <a href="${href}">Ver ejemplo ${arrow()}</a>
        <a href="#/publicaciones">${icon("file")} Sin PDF real</a>
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
    ["BCV - Tipo de cambio", "Serie diaria oficial, multimoneda SMC y Excel OVE actualizados por cron.", "Abrir cuadro", "database", "#/datos/tipo-cambio"],
    ["Banco Mundial - Venezuela", "79 indicadores WDI regenerados para Venezuela.", "Explorar fuente", "globe", "#/datos/banco-mundial"],
    ["API OVE", "Maqueta técnica en preparación para integrar datos propios cuando sean publicados.", "Ver ejemplo", "chartbar", "#/datos"],
    ["Mapas economicos", "Ejemplo de visualización futura para datos regionales validados.", "Ver ejemplo", "map", "#/datos"]
  ];
  return `<section class="dark-band">
    <div class="container">
      <h2>Datos y herramientas</h2>
      <span class="accent-line"></span>
      <p class="source-note">Fuentes reales disponibles: Banco Mundial - Venezuela y BCV. Las herramientas API/mapas se mantienen como estructura futura.</p>
      <div class="tools-grid">
        ${tools.map(([title, text, link, ico, href]) => `
          <article class="tool-card">
            <span class="line-icon">${icon(ico)}</span>
            <div>
              <h3>${title}</h3>
              <p>${text}</p>
              <a class="text-link" href="${href}">${link} ${arrow()}</a>
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
        ${exampleNotice("Temas y operaciones propios en elaboración. No equivalen a datos publicados; sirven como mapa de construcción del Observatorio.")}
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

function bcvSourceSection() {
  return `<section class="section-tight">
    <div class="container">
      <article class="world-source-panel">
        <div>
          <span class="eyebrow">Fuente oficial nacional</span>
          <h2>Banco Central de Venezuela</h2>
          <p>Primera ingesta automatizada del BCV: tipo de cambio de referencia SMC, con salida en JSON, CSV y Excel OVE.</p>
          <div class="source-stats">
            <span><strong>Diaria</strong> frecuencia</span>
            <span><strong>5</strong> monedas</span>
            <span><strong>JSON</strong> serie histórica</span>
            <span><strong>XLSX</strong> formato OVE</span>
          </div>
        </div>
        <div class="world-source-actions">
          <a class="button button-primary" href="#/datos/tipo-cambio">Cuadro tipo de cambio ${arrow()}</a>
          <a class="button" href="${exchangeDownloads.smcExcel}" download>Excel OVE ${icon("download")}</a>
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
      actions: `<a class="button button-primary" href="#/datos/tipo-cambio">Ver tipo de cambio BCV ${arrow()}</a>
        <a class="button" href="#/datos/banco-mundial">Ver datos Banco Mundial ${icon("database")}</a>
        <a class="button" href="#/indicadores">Ver indicadores actualizados ${icon("file")}</a>`
    })}
    ${bcvUsdHomePanel()}
    <section class="section-tight">
      <div class="container">
        <p class="source-note">Indicadores actualizados con fuentes reales: Banco Mundial - Venezuela y Banco Central de Venezuela. Última actualización de datos: 8 de julio de 2026.</p>
        ${metricCards()}
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h2>Indicadores actualizados</h2>
          <a class="text-link" href="#/indicadores">Ver tablero ${arrow()}</a>
        </div>
        <div class="home-indicators">
          ${chartCard("PIB real", "Banco Mundial, variación anual", "blue")}
          ${chartCard("USD/BCV", "BCV, serie diaria", "yellow")}
          ${chartCard("Desempleo total", "Banco Mundial, % fuerza laboral", "red")}
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
          <h2>Informes en preparación</h2>
          <a class="text-link" href="#/publicaciones">Ver plantillas de ejemplo ${arrow()}</a>
        </div>
        ${exampleNotice("El OVE aún no ha emitido informes. Estas tarjetas son ejemplos de presentación.")}
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

function bcvUsdHomePanel() {
  return `<section class="section-tight bcv-live-section">
    <div class="container">
      <article class="bcv-live-card" data-bcv-usd-latest>
        <div>
          <span class="eyebrow">Dato real oficial</span>
          <h2>Tipo de cambio BCV Bs/USD</h2>
          <p>Serie histórica diaria construida desde el Excel oficial del BCV y actualizada con la publicación diaria del Banco Central de Venezuela.</p>
          <div class="bcv-live-actions">
            <a class="button button-primary" href="#/datos/tipo-cambio">Ver cuadro ${arrow()}</a>
            <a class="button" href="${exchangeDownloads.usdExcel}" download>Excel OVE ${icon("download")}</a>
          </div>
        </div>
        <div class="bcv-live-value">
          <span class="source-tag">BCV oficial</span>
          <strong data-bcv-usd-value>Cargando</strong>
          <span data-bcv-usd-date>Actualizando desde JSON</span>
          <small data-bcv-usd-records>Serie histórica diaria</small>
        </div>
      </article>
    </div>
  </section>`;
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
      title: "Indicadores de Venezuela",
      lead: "Esta sección integra los últimos datos disponibles de Banco Mundial - Venezuela y Banco Central de Venezuela, manteniendo trazabilidad por fuente y año.",
      breadcrumb: ["Inicio", "Indicadores"]
    })}
    <section class="section">
      <div class="container layout-sidebar">
        <aside class="side-menu">
          <h3>Categorias</h3>
          ${categories.map((item, index) => `<a class="${index === 0 ? "is-selected" : ""}" href="#/indicadores">${icon(item[1])}<span>${item[0]}</span><span>›</span></a>`).join("")}
          <div class="filter-panel">
            <h3>Fuente real disponible</h3>
            <p class="tiny">Catálogo actualizado al 8 de julio de 2026.</p>
            <a class="button button-small" href="#/datos/banco-mundial">Ir a Banco Mundial</a>
          </div>
        </aside>
        <div>
          <div class="filter-row">
            ${[
              ["Periodo", "Último dato", "calendar"],
              ["Tema", "Venezuela", "clipboard"],
              ["Region", "Nacional", "pin"],
              ["Fuente", "BCV / Banco Mundial", "database"]
            ].map(([label, value, ico]) => `<div class="filter-box">${icon(ico)}<div><label>${label}</label><strong>${value}</strong></div></div>`).join("")}
            <a class="text-link" href="#/indicadores">Limpiar filtros</a>
          </div>
          ${metricCards("inline-metrics")}
          <p class="source-note">Fuentes: Banco Mundial - World Development Indicators y Banco Central de Venezuela. Algunas series multilaterales tienen rezagos propios de publicación; se muestra el último año con dato no nulo.</p>
          ${keyIndicatorDashboard()}
          <div class="dashboard-grid">
            <article class="panel span-7">
              <div class="panel-title"><h3>PIB real <span class="tiny">Banco Mundial</span></h3><span class="pill">2025</span></div>
              <div class="chart">${lineChart("blue")}</div>
            </article>
            <article class="panel span-5">
              <div class="panel-title"><h3>Venezuela <span class="tiny">cobertura nacional</span></h3></div>
              ${mapWidget()}
              <a class="text-link" href="#/datos/banco-mundial">Ver catálogo Banco Mundial ${arrow()}</a>
            </article>
            <article class="panel span-4"><h3>Indicadores seleccionados</h3>${barChart()}</article>
            <article class="panel span-4">${chartCard("USD/BCV", "BCV oficial", "yellow")}</article>
            <article class="panel span-4"><h3>Composición referencial</h3>${donutChart()}</article>
            <article class="panel span-8">
              <h3>Últimos valores disponibles</h3>
              <div class="table-wrap">${indicatorTable()}</div>
            </article>
            <aside class="span-4" style="display:grid;gap:14px">
              ${infoPanel("Metodología", "Cada valor mantiene fuente, año y serie original. El catálogo descargable conserva datos nulos para identificar rezagos estadísticos.", "clipboard", "Ver datos")}
              ${infoPanel("Descargas", "Las series actualizadas están disponibles en CSV, JSON y Excel para Banco Mundial y BCV.", "download", "Ver Banco Mundial")}
              ${infoPanel("Notas", "Los datos BCV son oficiales diarios; los datos Banco Mundial dependen del calendario WDI y pueden tener rezagos por indicador.", "file", "Ver nota")}
            </aside>
          </div>
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        <div class="cards-4">
          ${[
            ["BCV actualizado", "Tipo de cambio oficial con fecha valor 8 de julio de 2026.", "calendar"],
            ["Banco Mundial actualizado", "79 indicadores y 5.216 registros regenerados desde WDI.", "pin"],
            ["Fuente real activa", "Banco Mundial - Venezuela y BCV quedan disponibles como bases verificables.", "shield"],
            ["Datos abiertos", "Descargas en CSV, JSON y Excel con metadatos claros.", "lock"]
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
    ["PIB real", "2025", "8,94", "% anual", "Último BCV", "BCV"],
    ["PIB corriente", "2025", "99,7", "US$ mil millones", "Último WDI", "Banco Mundial"],
    ["PIB per cápita", "2025", "3.494,8", "US$", "Último WDI", "Banco Mundial"],
    ["INPC nacional", "05/2026", "6,3", "% mensual", "Último BCV", "BCV"],
    ["Desempleo total", "2025", "5,31", "% fuerza laboral", "Último WDI", "Banco Mundial"],
    ["Tipo de cambio BCV", '<span data-bcv-table-date>08/07/2026</span>', '<span data-bcv-table-value>685,9427</span>', "Bs/USD", "Último BCV", "BCV"]
  ];
  return `<table>
    <thead><tr><th>Indicador</th><th>Periodo</th><th>Valor</th><th>Unidad</th><th>Variacion</th><th>Fuente</th></tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function keyIndicatorDashboard() {
  return `<section class="key-dashboard panel" data-key-dashboard>
    <div class="key-dashboard-head">
      <div>
        <span class="eyebrow">Dashboard interactivo</span>
        <h2>Indicadores clave verificables</h2>
        <p>Selecciona un indicador para ver su evolución reciente y descarga la base completa con las seis series históricas.</p>
      </div>
      <div class="download-row key-downloads">
        <a href="${keyIndicatorDownloads.csv}" download>CSV</a>
        <a href="${keyIndicatorDownloads.json}" download>JSON</a>
        <a href="${keyIndicatorDownloads.excel}" download>Excel</a>
      </div>
    </div>
    <div class="key-dashboard-layout">
      <div class="key-selector" role="tablist" aria-label="Indicadores clave">
        ${keyIndicatorSeries.map((series, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-series-id="${series.id}">
          <span>${series.title}</span>
          <strong>${series.latest}</strong>
          <small>${series.period} · ${series.unit}</small>
        </button>`).join("")}
      </div>
      <div class="key-chart-panel">
        <div class="panel-title">
          <h3 data-key-title>${keyIndicatorSeries[0].title}</h3>
          <span class="pill" data-key-source>${keyIndicatorSeries[0].source}</span>
        </div>
        <div class="key-chart" data-key-chart>${sparklineSvg(dashboardSeries[keyIndicatorSeries[0].id])}</div>
        <div class="key-dashboard-foot">
          <span data-key-unit>${keyIndicatorSeries[0].unit}</span>
          <a class="text-link" href="${keyIndicatorDownloads.excel}" download>Descargar serie completa ${icon("download")}</a>
        </div>
      </div>
    </div>
  </section>`;
}

function exchangeRatePage() {
  const currencyButtons = exchangeCurrencies.map(([code, label], index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-exchange-currency="${code}">
    <span>${code}</span>
    <strong data-exchange-button-value="${code}">Cargando</strong>
    <small>${label}</small>
  </button>`).join("");

  return `<div class="page">
    ${pageHero({
      title: "Tipo de cambio BCV",
      lead: "Cuadro de mando único para verificar el tipo de cambio oficial publicado por el Banco Central de Venezuela, con serie diaria USD y referencia SMC multimoneda descargable.",
      image: "assets/topics/topic-economy.png",
      breadcrumb: ["Inicio", "Datos", "Tipo de cambio"],
      actions: `<a class="button button-primary" href="${exchangeDownloads.usdExcel}" download>Excel OVE USD ${icon("download")}</a>
        <a class="button" href="${exchangeDownloads.smcExcel}" download>Excel OVE multimoneda ${icon("download")}</a>`
    })}
    <section class="section">
      <div class="container">
        <article class="key-dashboard panel exchange-dashboard" data-exchange-dashboard>
          <div class="key-dashboard-head">
            <div>
              <span class="eyebrow">Dashboard interactivo</span>
              <h2>Verificador diario de tipo de cambio</h2>
              <p>Selecciona una moneda para consultar el último valor BCV y la evolución disponible. USD usa la serie histórica diaria completa; EUR, CNY, TRY y RUB usan la referencia SMC multimoneda publicada por el BCV.</p>
            </div>
            <div class="download-row key-downloads">
              <a href="${exchangeDownloads.usdCsv}" download>USD CSV</a>
              <a href="${exchangeDownloads.usdJson}" download>USD JSON</a>
              <a href="${exchangeDownloads.usdExcel}" download>USD Excel</a>
            </div>
          </div>
          <div class="key-dashboard-layout">
            <div class="key-selector" role="tablist" aria-label="Monedas disponibles">
              ${currencyButtons}
            </div>
            <div class="key-chart-panel">
              <div class="panel-title">
                <h3 data-exchange-title>USD/BCV</h3>
                <span class="pill" data-exchange-source>BCV oficial</span>
              </div>
              <div class="exchange-latest-grid" aria-label="Último dato del tipo de cambio">
                <div><span>Último valor</span><strong data-exchange-latest>Cargando</strong></div>
                <div><span>Fecha valor</span><strong data-exchange-date>Cargando</strong></div>
                <div><span>Observaciones</span><strong data-exchange-records>Cargando</strong></div>
              </div>
              <div class="key-chart" data-exchange-chart></div>
              <div class="key-dashboard-foot">
                <span data-exchange-unit>VES por USD</span>
                <a class="text-link" href="${exchangeDownloads.source}" target="_blank" rel="noopener">Ver fuente BCV ${arrow()}</a>
              </div>
            </div>
          </div>
        </article>

        <div class="exchange-download-grid">
          ${[
            ["Serie diaria USD", "Histórico diario Bs/USD normalizado desde el Excel oficial BCV y la publicación diaria SMC.", exchangeDownloads.usdCsv, exchangeDownloads.usdJson, exchangeDownloads.usdExcel],
            ["Referencia SMC multimoneda", "Base diaria con las monedas publicadas por BCV: USD, EUR, CNY, TRY y RUB.", exchangeDownloads.smcCsv, exchangeDownloads.smcJson, exchangeDownloads.smcExcel],
            ["Fuente oficial BCV", "Página de tipo de cambio de referencia SMC usada por el cron diario del Observatorio.", exchangeDownloads.source, exchangeDownloads.source, exchangeDownloads.source]
          ].map(([title, text, csv, json, excel]) => `<article class="world-bank-card">
            <div>
              <span class="source-tag">BCV oficial</span>
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
            <dl class="source-meta">
              <div><dt>Frecuencia</dt><dd>Diaria</dd></div>
              <div><dt>Estado</dt><dd>Automático</dd></div>
            </dl>
            <div class="download-row">
              <a href="${csv}" ${csv.startsWith("http") ? 'target="_blank" rel="noopener"' : "download"}>${csv.startsWith("http") ? "Fuente" : "CSV"}</a>
              <a href="${json}" ${json.startsWith("http") ? 'target="_blank" rel="noopener"' : "download"}>${json.startsWith("http") ? "BCV" : "JSON"}</a>
              <a href="${excel}" ${excel.startsWith("http") ? 'target="_blank" rel="noopener"' : "download"}>${excel.startsWith("http") ? "Sitio" : "Excel OVE"}</a>
            </div>
          </article>`).join("")}
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container dashboard-grid">
        <article class="panel span-6">
          <h2>Actualización automática</h2>
          <p>El cron de GitHub Actions ejecuta la ingesta diaria de BCV, actualiza las bases CSV/JSON/Excel en assets/data/bcv y vuelve a generar indicadores-clave para que la portada, Indicadores y Datos usen el último valor disponible.</p>
        </article>
        <article class="panel span-6">
          <h2>Monedas disponibles</h2>
          <p>El cuadro muestra todas las monedas disponibles en la referencia SMC del BCV dentro del Observatorio: USD, EUR, CNY, TRY y RUB.</p>
        </article>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function publicationsPage() {
  return `<div class="page">
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <div class="breadcrumb"><span>Inicio</span><span>Publicaciones</span><span>Informes y publicaciones</span></div>
          <h1>Informes y publicaciones en construcción</h1>
          <span class="accent-line"></span>
          <p class="lead">El OVE aún no ha emitido informes. Esta página conserva ejemplos claramente marcados para construir el repositorio antes de publicar documentos reales.</p>
          <form class="search-line js-form">
            <input class="field" type="search" placeholder="Buscar publicaciones por título, tema o palabra clave..." aria-label="Buscar publicaciones">
            <button class="icon-button" type="submit">${icon("search")}</button>
          </form>
          <div class="stat-row">
            <div class="stat-item">${icon("file")}<div><strong>0</strong><span class="tiny">Informes OVE publicados</span></div></div>
            <div class="stat-item">${icon("download")}<div><strong>0</strong><span class="tiny">Descargas de informes reales</span></div></div>
          </div>
        </div>
        <div class="featured-panel">
          <img src="assets/publication-cover-1.png" alt="Portada Panorama Económico de Venezuela">
          <div class="featured-content">
            <span class="pill">Ejemplo visual</span>
            <h2>Plantilla de informe OVE</h2>
            <p>Sin publicar</p>
            <p>Ejemplo de portada y estructura. No corresponde a un informe emitido por el Observatorio.</p>
            <a class="button button-ghost" href="#/informe-trimestral">Ver plantilla ${arrow()}</a>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="tabs">
          ${["Todos", "Informes", "Análisis", "Coyuntura", "Indicadores", "Notas metodológicas"].map((tab, i) => `<a class="${i === 0 ? "is-selected" : ""}" href="#/publicaciones">${tab}</a>`).join("")}
        </div>
        ${exampleNotice("No hay publicaciones reales del OVE todavía. Las tarjetas siguientes son ejemplos para dejar lista la arquitectura del repositorio.")}
        <div class="filter-row pub-controls">
          <p class="tiny">Mostrando ejemplos de plantilla. Publicaciones reales: 0</p>
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
              <a href="#/publicaciones">Sin informes publicados (0)</a>
              <a href="#/publicaciones">Ejemplos de plantilla (3)</a>
              <hr>
              <strong>Tema</strong>
              <a href="#/publicaciones">Macroeconomía (ejemplo)</a>
              <a href="#/publicaciones">Metodología (ejemplo)</a>
              <a href="#/publicaciones">Sectorial (ejemplo)</a>
              <hr>
              <strong>Formato</strong>
              <a href="#/publicaciones">PDF (0 reales)</a>
              <a href="#/publicaciones">Excel (0 reales)</a>
              <a href="#/publicaciones">Presentación (0 reales)</a>
            </div>
            <div class="filter-panel">
              <h3>Datos reales disponibles</h3>
              <p>El primer insumo real del Observatorio es el catálogo Banco Mundial - Venezuela.</p>
              <a class="text-link" href="#/datos/banco-mundial">Ir a Banco Mundial ${arrow()}</a>
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
        <div class="breadcrumb"><span>Inicio</span><span>Publicaciones</span><span>Ejemplo de informe</span></div>
        <div class="detail-grid">
          <div>
            <div class="cover-img"><img src="assets/publication-cover-1.png" alt="Portada del informe economico trimestral"></div>
            <div class="button-row" style="margin-top:24px">
              <a class="button button-primary" href="#/publicaciones">Volver a publicaciones ${arrow()}</a>
            </div>
          </div>
          <article>
            <span class="eyebrow">Ejemplo visual</span>
            <h1>Plantilla de informe económico</h1>
            <p class="lead">Estructura de ejemplo para futuros informes del OVE</p>
            <div class="detail-meta">
              <span>${icon("calendar")} Sin publicar</span>
              <span>${icon("users")} Observatorio Venezolano de Economia</span>
              <span>${icon("file")} Maqueta</span>
            </div>
            <h3 style="margin-top:28px">Resumen ejecutivo</h3>
            <p>Este contenido es una plantilla. El Observatorio aún no ha emitido informes, por lo que no se muestran conclusiones, cifras ni hallazgos reales.</p>
            <div class="button-row" style="margin-top:24px">
              <a class="button" href="#/datos/banco-mundial">Ver datos reales Banco Mundial ${icon("download")}</a>
              <a class="button button-ghost" href="#/informe-trimestral">Ver plantilla</a>
            </div>
          </article>
          <aside class="key-data">
            <h3>Datos clave</h3>
            ${metricData.slice(0, 4).map(metric => `<div class="key-item"><span class="tiny">${metric.title} ${metric.subtitle}</span><strong>${metric.value}</strong><span class="trend neutral">No publicado</span></div>`).join("")}
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
        ${exampleNotice("Bloque de ejemplo. Los hallazgos reales aparecerán aquí cuando exista un informe emitido por el OVE.")}
        <div class="findings-grid">
          ${[
            ["Hallazgo ejemplo A", "Texto reservado para un hallazgo futuro con fuente validada.", "trend"],
            ["Hallazgo ejemplo B", "Texto reservado para análisis de precios cuando se publiquen datos.", "coin"],
            ["Hallazgo ejemplo C", "Texto reservado para sector externo o monetario.", "dollar"],
            ["Hallazgo ejemplo D", "Texto reservado para indicadores financieros o fiscales.", "bank"]
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
            ${chartCard("Serie ejemplo A", "(sin datos reales)", "blue")}
            ${chartCard("Serie ejemplo B", "(sin datos reales)", "yellow")}
            ${chartCard("Serie ejemplo C", "(sin datos reales)", "red")}
          </div>
          <article class="panel" style="margin-top:18px">
            <h3>Sobre este informe</h3>
            <div class="cards-4 mini-grid-3">
              ${[
                ["Autores", "Equipo de investigacion del OVE", "file"],
                ["Fuente de datos", "Pendiente de validación para informes propios.", "database"],
                ["Fecha de publicacion", "Sin publicar", "calendar"]
              ].map(([title, text, ico]) => `<div class="support-item">${icon(ico)}<div><h3>${title}</h3><p class="tiny">${text}</p></div></div>`).join("")}
            </div>
          </article>
        </div>
        <aside>
          <h2>Publicaciones relacionadas</h2>
          <div class="related-list">
            ${["Plantilla macroeconómica", "Plantilla metodológica", "Plantilla sectorial"].map((title, index) => `<a class="related-item" href="#/publicaciones"><img src="${publicationCovers[(index + 1) % publicationCovers.length]}" alt="Portada relacionada"><div><h3>${title}</h3><p class="tiny">Ejemplo</p></div></a>`).join("")}
          </div>
          <a class="text-link" style="margin-top:16px" href="#/publicaciones">Ver todas las publicaciones ${arrow()}</a>
        </aside>
      </div>
    </section>
    <section class="section-tight">
      <div class="container dashboard-grid">
        <article class="panel span-5">${infoPanel("Metodologia", "Espacio reservado para explicar enfoques, definiciones y fuentes cuando exista un informe real.", "clipboard", "Ver estructura")}</article>
        <article class="panel span-7">
          <h3>Como citar este informe</h3>
          <p>Esta plantilla no debe citarse como informe. Aún no hay una publicación oficial del OVE asociada a esta página.</p>
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
      title: "Datos de Venezuela",
      lead: "Repositorio de datos actualizados del Observatorio: Banco Mundial - Venezuela y Banco Central de Venezuela, con archivos descargables en CSV, JSON y Excel.",
      breadcrumb: ["Inicio", "Datos", "Datos abiertos y API"],
      actions: `<a class="button button-primary" href="#/datos/tipo-cambio">Tipo de cambio BCV ${arrow()}</a><a class="button" href="#/datos/bcv">Ver BCV ${icon("database")}</a>`
    })}
    ${topicsSection()}
    ${bcvSourceSection()}
    ${worldBankSourceSection()}
    ${keyIndicatorDownloadSection()}
    <section id="datasets" class="section">
      <div class="container">
        <div class="section-title"><h2>Categorías temáticas</h2><a class="text-link" href="#/datos/banco-mundial">Ver datos reales ${arrow()}</a></div>
        <p class="source-note">Estas categorías ordenan fuentes reales ya integradas y futuras ampliaciones del Observatorio.</p>
        <div class="dataset-grid">${datasets.map(datasetCard).join("")}</div>
      </div>
    </section>
    <section id="api" class="section-tight">
      <div class="container">
        <div class="section-title"><h2>API futura</h2><a class="text-link" href="#/datos/banco-mundial">Ver fuente real ${arrow()}</a></div>
        <article class="panel api-panel">
          <div>
            <h3>${icon("code")} Acceso programatico</h3>
            <p>Documentación preliminar. La API OVE se activará sobre los datasets reales ya publicados cuando se habilite el servicio.</p>
            <p class="trend neutral">Ejemplo: Autenticacion con API Key</p>
            <p class="trend neutral">Ejemplo: Respuestas en JSON</p>
            <p class="trend neutral">Ejemplo: Paginacion y filtros avanzados</p>
            <a class="button" href="#/datos/banco-mundial">Explorar Banco Mundial</a>
          </div>
          <div>
            <h3>Endpoint de ejemplo</h3>
            <p><span class="method">GET</span> /api/v1/ejemplo/indicadores</p>
            <pre class="code-box">{
  "data": {
    "estado": "ejemplo",
    "mensaje": "sin datos OVE publicados",
    "valor": null
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
          <h2>Datasets OVE recientes</h2>
          <div class="table-wrap">${recentDatasetTable()}</div>
        </article>
        <div class="span-7">
          <div class="section-title"><h2>Categorías temáticas disponibles</h2><a class="text-link" href="#/datos/banco-mundial">Ver Banco Mundial ${arrow()}</a></div>
          <div class="category-grid">${datasets.concat([["Dinero y banca", "BCV", "Tipo de cambio y catálogos de trabajo PIB/INPC.", "database"], ["Social y demografia", "Banco Mundial", "Demografía, salud, género y condiciones de vida.", "users"]]).map(datasetCard).join("")}</div>
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        <div class="section-title"><h2>Herramientas para explorar datos</h2></div>
        <div class="format-grid">
          ${[
            ["Calculadoras interactivas", "Ejemplo de herramienta futura. Aún no calcula con datos oficiales del OVE.", "calculator"],
            ["Mapas economicos", "Ejemplo de visualización futura para fuentes regionales validadas.", "map"],
            ["API Playground", "Maqueta para probar endpoints cuando existan datos propios.", "code"]
          ].map(([title, text, ico]) => `<article class="value-card"><span class="line-icon">${icon(ico)}</span><h3>${title}</h3><p>${text}</p><a class="text-link" href="#/datos">Explorar ${arrow()}</a></article>`).join("")}
        </div>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function bcvPage() {
  return `<div class="page">
    ${pageHero({
      title: "Banco Central de Venezuela",
      lead: "Datos oficiales del BCV integrados al Observatorio. El tipo de cambio diario queda automatizado para descarga diaria, verificación multimoneda y exportación en JSON, CSV y Excel OVE.",
      image: "assets/topics/topic-economy.png",
      breadcrumb: ["Inicio", "Datos", "Banco Central de Venezuela"],
      actions: `<a class="button button-primary" href="#/datos/tipo-cambio">Cuadro tipo de cambio ${arrow()}</a>
        <a class="button" href="${exchangeDownloads.usdExcel}" download>Descargar Excel OVE ${icon("download")}</a>`
    })}
    <section class="section">
      <div class="container">
        <div class="world-bank-summary">
          <div>
            <span class="eyebrow">Ingesta automatizada</span>
            <h2>Tipo de cambio diario Bs/USD</h2>
            <p>El script scripts/bcv_ingest.py descarga el Excel histórico oficial 2_1_1_tdc.xlsx, normaliza compra y venta diaria del dólar, consulta la página diaria del BCV y actualiza la serie histórica dentro de assets/data/bcv/.</p>
          </div>
          <div class="source-stats">
            <span><strong>Diaria</strong> frecuencia</span>
            <span><strong>BCV</strong> fuente</span>
            <span><strong>JSON</strong> web</span>
            <span><strong>XLSX</strong> OVE</span>
          </div>
        </div>
        <article class="bcv-live-card bcv-live-card-compact" data-bcv-usd-latest>
          <div>
            <span class="eyebrow">Último dato</span>
            <h2>USD/BCV</h2>
            <p>Este bloque lee directamente el JSON normalizado publicado en el repositorio.</p>
          </div>
          <div class="bcv-live-value">
            <span class="source-tag">BCV oficial</span>
            <strong data-bcv-usd-value>Cargando</strong>
            <span data-bcv-usd-date>Actualizando desde JSON</span>
            <small data-bcv-usd-records>Serie histórica diaria</small>
          </div>
        </article>
        <div class="world-bank-catalog-grid">
          ${[
            ["Serie histórica USD JSON", "Serie diaria normalizada para consumo web y automatizaciones.", exchangeDownloads.usdJson, "JSON", "#/datos/tipo-cambio"],
            ["Excel formato OVE", "Archivo tabular con compra, venta, fecha, unidad y fuente con cabecera corporativa.", exchangeDownloads.usdExcel, "Excel", "#/datos/tipo-cambio"],
            ["PIB real anual", "Crecimiento anual del PIB real total normalizado desde workbook oficial BCV.", "assets/data/bcv/json/ove_bcv_pib_real_anual.json", "JSON"],
            ["INPC nacional mensual", "Índice nacional de precios al consumidor y variación mensual desde workbook oficial BCV.", "assets/data/bcv/json/ove_bcv_inpc_nacional_mensual.json", "JSON"],
            ["Referencia SMC multimoneda", "Dato diario publicado por el BCV para USD, EUR, CNY, TRY y RUB.", exchangeDownloads.smcJson, "JSON", "#/datos/tipo-cambio"],
            ["Catálogo BCV", "Inventario de datasets BCV activos y fuentes catalogadas para próximas ingestas.", "assets/data/bcv/catalog/bcv-catalog.json", "JSON"]
          ].map(([title, text, href, format, viewHref = "#/datos/bcv"]) => `<article class="world-bank-card">
            <div>
              <span class="source-tag">BCV oficial</span>
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
            <dl class="source-meta">
              <div><dt>Formato</dt><dd>${format}</dd></div>
              <div><dt>Estado</dt><dd>Activo</dd></div>
            </dl>
            <div class="download-row">
              <a href="${href}" download>Descargar</a>
              <a href="${viewHref}">Ver</a>
              <a href="${exchangeDownloads.source}" target="_blank" rel="noopener">Fuente</a>
            </div>
          </article>`).join("")}
        </div>
      </div>
    </section>
    <section class="section-tight">
      <div class="container dashboard-grid">
        <article class="panel span-6">
          <h2>Automatización</h2>
          <p>El workflow Update OVE data queda programado en GitHub Actions: diario para tipo de cambio, mensual para BCV PIB/INPC, semanal para Banco Mundial y regeneración automática del paquete de indicadores clave.</p>
        </article>
        <article class="panel span-6">
          <h2>Series BCV activas</h2>
          <p>Tipo de cambio, PIB real anual e INPC nacional mensual quedan normalizados desde fuentes oficiales BCV, con catálogos para ampliar nuevas hojas sin mezclar estructuras.</p>
        </article>
      </div>
    </section>
    ${footer()}
  </div>`;
}

function keyIndicatorDownloadSection() {
  return `<section class="section-tight">
    <div class="container">
      <div class="section-title">
        <h2>Series históricas destacadas</h2>
        <a class="text-link" href="#/indicadores">Abrir dashboard ${arrow()}</a>
      </div>
      <p class="source-note">Paquete curado con los indicadores usados en la portada y en el dashboard. Mantiene fuente, periodo, unidad, área temática y URL oficial para verificación.</p>
      <div class="world-bank-summary key-download-summary">
        <div>
          <span class="eyebrow">Datos verificables</span>
          <h3>Indicadores clave de Venezuela</h3>
          <p>Incluye PIB real BCV, PIB corriente WDI, PIB per cápita WDI, INPC nacional BCV, desempleo WDI y tipo de cambio BCV.</p>
        </div>
        <div class="download-row key-downloads">
          <a href="${keyIndicatorDownloads.csv}" download>CSV</a>
          <a href="${keyIndicatorDownloads.json}" download>JSON</a>
          <a href="${keyIndicatorDownloads.excel}" download>Excel</a>
        </div>
      </div>
      <div class="world-bank-catalog-grid">
        ${keyIndicatorSeries.map(series => `<article class="world-bank-card">
          <div>
            <span class="source-tag">${series.source}</span>
            <h3>${series.title}</h3>
            <p>${series.area}. Último dato: ${series.period}, ${series.latest} ${series.unit}.</p>
          </div>
          <dl class="source-meta">
            <div><dt>Frecuencia</dt><dd>${series.frequency}</dd></div>
            <div><dt>Área</dt><dd>${series.area}</dd></div>
          </dl>
          <div class="download-row">
            <a href="${keyIndicatorDownloads.csv}" download>CSV</a>
            <a href="${keyIndicatorDownloads.json}" download>JSON</a>
            <a href="${series.href}" download>Fuente OVE</a>
          </div>
        </article>`).join("")}
      </div>
    </div>
  </section>`;
}

function topicDetailPage(topicKey) {
  const topic = topicDetails[topicKey] || topicDetails.agriculture;
  const downloads = keyIndicatorSeries.filter(series => (topic.keyIndicators || []).includes(series.id));

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
        ${downloads.length ? topicDownloads(topic, downloads) : ""}
      </div>
    </section>
    ${footer()}
  </div>`;
}

function topicDownloads(topic, downloads) {
  return `<div class="topic-downloads">
    <div class="section-title">
      <h2>Series descargables en esta área</h2>
      <a class="text-link" href="${keyIndicatorDownloads.excel}" download>Descargar paquete completo ${icon("download")}</a>
    </div>
    <div class="world-bank-catalog-grid">
      ${downloads.map(series => {
        const isExchange = series.id === "tipo_cambio_bcv_usd";
        return `<article class="world-bank-card">
        <span class="source-tag">${series.source}</span>
        <h3>${series.title}</h3>
        <p>${topic.title}. Último dato: ${series.period}, ${series.latest} ${series.unit}.</p>
        <div class="download-row">
          <a href="${isExchange ? exchangeDownloads.usdCsv : keyIndicatorDownloads.csv}" download>CSV</a>
          <a href="${isExchange ? exchangeDownloads.usdJson : keyIndicatorDownloads.json}" download>JSON</a>
          <a href="${series.href}" download>Serie</a>
          ${isExchange ? `<a href="#/datos/tipo-cambio">Cuadro</a>` : ""}
        </div>
      </article>`;
      }).join("")}
    </div>
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
    ${exampleTag(count.includes("Banco") || count.includes("BCV") ? "Fuente real" : "Ejemplo")}
    <h3>${title}</h3>
    <p class="tiny">${count}</p>
    ${text ? `<p>${text}</p>` : ""}
    <div class="format-tags"><span>CSV</span><span>XLSX</span><span>JSON</span></div>
  </article>`;
}

function recentDatasetTable() {
  const rows = [
    ["BCV tipo de cambio USD", "CSV/JSON/XLSX", "Actualizado 08/07/2026", "Fuente oficial"],
    ["Indicadores clave de Venezuela", "CSV/JSON/XLSX", "Series históricas verificables", "Dashboard"],
    ["BCV referencia SMC", "CSV/JSON/XLSX", "Actualizado 08/07/2026", "Fuente oficial"],
    ["Banco Mundial - Venezuela", "CSV/JSON/XLSX", "Actualizado 08/07/2026", "Fuente real"],
    ["BCV PIB real e INPC", "CSV/JSON/XLSX", "Actualizado 08/07/2026", "Fuente oficial"]
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
          <p>Estamos definiendo principios metodológicos para que cada dato real se publique con fuente, cobertura y limitaciones claras.</p>
          <div class="cards-4 mini-grid-5">
            ${[
              ["Rigor técnico", "Criterios estadísticos y económicos antes de publicar series.", "trend"],
              ["Fuentes verificadas", "Banco Mundial - Venezuela es la fuente real integrada actualmente.", "shield"],
              ["Transparencia", "Cada dataset deberá documentar procesos, supuestos y limitaciones.", "eye"],
              ["Reproducibilidad", "Los cálculos propios se publicarán con trazabilidad cuando existan.", "code"],
              ["Actualización", "La periodicidad se definirá por fuente y capacidad de verificación.", "plus"]
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
          <p>El Observatorio se construirá gradualmente con fuentes reales y verificables. Por ahora, la fuente real integrada es Banco Mundial - Venezuela.</p>
          <div class="cards-4 mini-grid-3">
            ${[
              ["Fuente real activa", "Banco Mundial - Venezuela, disponible en CSV, JSON y Excel.", "bank"],
              ["Fuentes por evaluar", "Instituciones nacionales, organismos internacionales y literatura técnica.", "globe"],
              ["Datos propios", "Pendientes de diseño, validación y publicación por parte del OVE.", "users"]
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
        <p>La trayectoria pública del Observatorio está en construcción. Esta línea resume hitos de desarrollo, no publicaciones emitidas.</p>
        <div class="timeline">
          ${[
            ["Etapa 1", "Definición de identidad institucional y estructura del sitio."],
            ["Etapa 2", "Archivo de logos oficiales y criterios de manual corporativo."],
            ["Etapa 3", "Integración inicial de Banco Mundial - Venezuela como fuente real."],
            ["Etapa 4", "Construcción futura de indicadores, metodología e informes propios."]
          ].map(([year, text]) => `<div class="timeline-item"><h3>${year}</h3><p class="tiny">${text}</p></div>`).join("")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container dashboard-grid">
        <article class="panel span-4">
          <h2>Aliados estratégicos</h2>
          <span class="accent-line"></span>
          <p>Espacio reservado para alianzas futuras. No se muestran aliados reales hasta confirmarlos.</p>
          <div class="logos-row"><span>Ejemplo</span><span>Ejemplo</span><span>Ejemplo</span></div>
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
    hydrateBcvWidgets();
    hydrateKeyDashboard();
    hydrateExchangeDashboard();
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
      const text = "Plantilla de ejemplo OVE. No corresponde a un informe publicado.";
      try {
        await navigator.clipboard.writeText(text);
        copy.textContent = "Cita copiada";
      } catch {
        copy.textContent = "Cita lista";
      }
    });
  }
}

function formatBcvNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "No disponible";
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value);
}

function formatBcvDate(value) {
  if (!value) return "Fecha no disponible";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

async function hydrateBcvWidgets() {
  const widgets = document.querySelectorAll("[data-bcv-usd-latest]");
  if (!widgets.length) return;
  try {
    const response = await fetch("assets/data/bcv/json/ove_bcv_tipo_cambio_usd.json", { cache: "no-store" });
    if (!response.ok) throw new Error("BCV JSON unavailable");
    const data = await response.json();
    const observations = data.observations || [];
    const latest = data.metadata?.latest || observations[observations.length - 1];
    widgets.forEach(widget => {
      const compact = widget.hasAttribute("data-bcv-compact");
      const valueNode = widget.querySelector("[data-bcv-usd-value]");
      const dateNode = widget.querySelector("[data-bcv-usd-date]");
      const recordsNode = widget.querySelector("[data-bcv-usd-records]");
      if (valueNode) valueNode.textContent = compact ? formatBcvNumber(latest?.value) : `${formatBcvNumber(latest?.value)} Bs/USD`;
      if (dateNode) dateNode.textContent = compact ? formatBcvDate(latest?.date) : `Fecha valor: ${formatBcvDate(latest?.date)}`;
      if (recordsNode) recordsNode.textContent = `${data.metadata?.records || 0} observaciones desde ${data.metadata?.first_date || "2016"}`;
    });
    document.querySelectorAll("[data-bcv-table-value]").forEach(node => {
      node.textContent = formatBcvNumber(latest?.value);
    });
    document.querySelectorAll("[data-bcv-table-date]").forEach(node => {
      node.textContent = latest?.date ? latest.date.split("-").reverse().join("/") : "Fecha no disponible";
    });
    if (latest) {
      const exchangeMeta = keyIndicatorSeries.find(series => series.id === "tipo_cambio_bcv_usd");
      if (exchangeMeta) {
        exchangeMeta.latest = formatBcvNumber(latest.value);
        exchangeMeta.period = latest.date ? latest.date.split("-").reverse().join("/") : exchangeMeta.period;
      }
      dashboardSeries.tipo_cambio_bcv_usd.points = observations
        .filter(row => typeof row.value === "number")
        .slice(-45)
        .map(row => [row.date, row.value]);
      document.querySelectorAll('[data-series-id="tipo_cambio_bcv_usd"]').forEach(button => {
        button.querySelector("strong").textContent = exchangeMeta?.latest || formatBcvNumber(latest.value);
        button.querySelector("small").textContent = `${exchangeMeta?.period || latest.date} · Bs/USD`;
      });
      const activeExchangeChart = document.querySelector('[data-key-dashboard] [data-series-id="tipo_cambio_bcv_usd"].is-active');
      if (activeExchangeChart) {
        document.querySelector("[data-key-chart]").innerHTML = sparklineSvg(dashboardSeries.tipo_cambio_bcv_usd);
      }
    }
  } catch {
    widgets.forEach(widget => {
      const valueNode = widget.querySelector("[data-bcv-usd-value]");
      const dateNode = widget.querySelector("[data-bcv-usd-date]");
      const recordsNode = widget.querySelector("[data-bcv-usd-records]");
      if (valueNode) valueNode.textContent = "No disponible";
      if (dateNode) dateNode.textContent = "No se pudo leer el JSON BCV";
      if (recordsNode) recordsNode.textContent = "Revisar actualización automática";
    });
  }
}

function hydrateKeyDashboard() {
  const dashboard = document.querySelector("[data-key-dashboard]");
  if (!dashboard) return;
  const title = dashboard.querySelector("[data-key-title]");
  const source = dashboard.querySelector("[data-key-source]");
  const unit = dashboard.querySelector("[data-key-unit]");
  const chart = dashboard.querySelector("[data-key-chart]");
  const buttons = dashboard.querySelectorAll("[data-series-id]");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-series-id");
      const meta = keyIndicatorSeries.find(item => item.id === id);
      const series = dashboardSeries[id];
      if (!meta || !series) return;
      buttons.forEach(item => item.classList.toggle("is-active", item === button));
      title.textContent = meta.title;
      source.textContent = meta.source;
      unit.textContent = `${meta.frequency} · ${meta.unit}`;
      chart.innerHTML = sparklineSvg(series);
    });
  });
}

async function hydrateExchangeDashboard() {
  const dashboard = document.querySelector("[data-exchange-dashboard]");
  if (!dashboard) return;

  const title = dashboard.querySelector("[data-exchange-title]");
  const source = dashboard.querySelector("[data-exchange-source]");
  const latestValue = dashboard.querySelector("[data-exchange-latest]");
  const latestDate = dashboard.querySelector("[data-exchange-date]");
  const records = dashboard.querySelector("[data-exchange-records]");
  const unit = dashboard.querySelector("[data-exchange-unit]");
  const chart = dashboard.querySelector("[data-exchange-chart]");
  const buttons = dashboard.querySelectorAll("[data-exchange-currency]");

  try {
    const [usdResponse, smcResponse] = await Promise.all([
      fetch(exchangeDownloads.usdJson, { cache: "no-store" }),
      fetch(exchangeDownloads.smcJson, { cache: "no-store" })
    ]);
    if (!usdResponse.ok || !smcResponse.ok) throw new Error("Exchange JSON unavailable");
    const [usdData, smcData] = await Promise.all([usdResponse.json(), smcResponse.json()]);
    const usdRows = (usdData.observations || []).filter(row => typeof row.value === "number");
    const smcRows = (smcData.observations || []).filter(row => typeof row.value === "number");
    const rowsByCurrency = new Map();

    exchangeCurrencies.forEach(([code]) => rowsByCurrency.set(code, []));
    rowsByCurrency.set("USD", usdRows);
    smcRows.forEach(row => {
      const code = row.currency;
      if (!rowsByCurrency.has(code)) rowsByCurrency.set(code, []);
      if (code !== "USD") rowsByCurrency.get(code).push(row);
    });

    rowsByCurrency.forEach((rows, code) => {
      rows.sort((left, right) => String(left.date).localeCompare(String(right.date)));
      const latest = rows[rows.length - 1];
      const buttonValue = dashboard.querySelector(`[data-exchange-button-value="${code}"]`);
      if (buttonValue) {
        buttonValue.textContent = latest ? formatBcvNumber(latest.value) : "Sin dato";
      }
    });

    const renderCurrency = code => {
      const rows = rowsByCurrency.get(code) || [];
      const meta = exchangeCurrencies.find(([currency]) => currency === code);
      const latest = rows[rows.length - 1];
      const points = rows.slice(-45).map(row => [row.date, row.value]);
      buttons.forEach(button => button.classList.toggle("is-active", button.getAttribute("data-exchange-currency") === code));
      title.textContent = `${code}/BCV`;
      source.textContent = meta?.[1] || "BCV oficial";
      latestValue.textContent = latest ? `${formatBcvNumber(latest.value)} Bs/${code}` : "No disponible";
      latestDate.textContent = latest ? formatBcvDate(latest.date) : "Sin fecha";
      records.textContent = rows.length ? formatInteger(rows.length) : "0";
      unit.textContent = code === "USD" ? "Serie histórica diaria Bs/USD" : "Referencia SMC diaria: VES por unidad de moneda";
      chart.innerHTML = sparklineSvg({
        title: `Tipo de cambio ${code}/BCV`,
        unit: `Bs/${code}`,
        points
      });
    };

    buttons.forEach(button => {
      button.addEventListener("click", () => renderCurrency(button.getAttribute("data-exchange-currency")));
    });

    renderCurrency("USD");
  } catch {
    latestValue.textContent = "No disponible";
    latestDate.textContent = "No se pudo leer el JSON BCV";
    records.textContent = "Revisar cron";
    unit.textContent = "Actualización automática pendiente";
    chart.innerHTML = `<p class="source-note">No fue posible cargar las bases de tipo de cambio en este momento.</p>`;
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
    ".bcv-live-card",
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
