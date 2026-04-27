import promoSapatilhas from '../assets/sneakers.jpg'
import promoPresentes from '../assets/sneakers-1.jpg'
import promoRelogio from '../assets/hero-bg.jpg'
import promoNutricao from '../assets/product-card-test-image.png'
import promoRoupaTop from '../assets/ana-dias-1.jpg'
import promoRoupaPresentes from '../assets/ana-dias-2.jpg'
import brandAdidas from '../assets/adidas.png'
import brandAsics from '../assets/asics.png'
import brandNike from '../assets/nike.png'
import brandHoka from '../assets/hoka.png'
import brandPuma from '../assets/puma.png'
import brandNewBalance from '../assets/newBalance.png'
import brandGarmin from '../assets/garmin.png'
import brandBrooks from '../assets/brooks.png'

/**
 * Figma ANADIAS.run: mega menu (PT).
 * Cada linha = um item independente. O objeto `subMenu` define só esse painel
 * (fundo, grelha, densidade, estilo de promos) — ajusta por item conforme o teu Figma/SSs.
 * Não reutilices um `subMenu` duro entre itens: copia o bloco e muda o que for preciso.
 */
export const SUB_MENU_BASE = {
  /** default | brandLogos (só grelha de logótipos, sem colunas) */
  panelType: 'default',
  /** painel: branco / cinza muito claro (só afecta a área aberta) */
  panelBg: 'white',
  /** colunas de texto: 1 | 2 | 3 (no desktop, grelha) */
  textGrid: 2,
  /** espaço entre links: padrão ou mais fechado (listas longas) */
  listDensity: 'default',
  /** promos: barra clara debaixo da imagem vs texto em overlay */
  promoStyle: 'footer',
  /**
   * overlay: texto e seta; `bottom` = barra a toda a largura; `bottom-left` = canto
   * inferior esquerdo (ex.: Figma Relógios GPS, uma imagem).
   */
  promoOverlayAlign: 'bottom',
}

/** Mescla com defaults só para chaves em falta; preferível definir `subMenu` completo em cada item. */
export function getSubMenuFor(item) {
  if (!item || typeof item.subMenu !== 'object' || !item.subMenu) {
    return { ...SUB_MENU_BASE }
  }
  return { ...SUB_MENU_BASE, ...item.subMenu }
}

export const MEGA_TOP_BAR = {
  line: 'Ofertas e informações · Saldos',
  linkTo: '/products?categoryName=Saldos',
}

function q(categoryName) {
  return `/products?categoryName=${encodeURIComponent(categoryName)}`
}

export const MEGA_MENU_ITEMS = [
  {
    id: 'sapatilhas',
    label: 'Sapatilhas',
    to: q('Todas as sapatilhas'),
    subMenu: {
      ...SUB_MENU_BASE,
      panelBg: 'white',
      textGrid: 2,
      listDensity: 'default',
      promoStyle: 'footer',
    },
    columns: [
      {
        heading: 'Todas as sapatilhas',
        links: [
          { label: 'Mostrar tudo', to: q('Todas as sapatilhas') },
        ],
      },
      {
        heading: 'Tipo de sapatilhas',
        links: [
          { label: 'Sapatilhas de running', to: q('Sapatilhas de running') },
          { label: 'Sapatilhas de trail running', to: q('Sapatilhas de trail running') },
          { label: 'Sapatilhas de pista / cross', to: q('Sapatilhas de pista e cross') },
          { label: 'Sapatilhas carbone', to: q('Sapatilhas carbon') },
        ],
      },
    ],
    promos: [
      {
        title: 'Top sapatilhas',
        to: q('Top sapatilhas'),
        image: promoSapatilhas,
        imageAlt: 'Sapatilhas de corrida em destaque',
      },
      {
        title: 'Presentes',
        to: q('Presentes'),
        image: promoPresentes,
        imageAlt: 'Ideias de presente',
      },
    ],
  },
  {
    id: 'roupa',
    label: 'Roupa',
    to: q('Toda a roupa'),
    subMenu: {
      ...SUB_MENU_BASE,
      panelBg: 'muted',
      textGrid: 3,
      listDensity: 'compact',
      promoStyle: 'overlay',
    },
    columns: [
      {
        heading: 'Todas as roupas',
        links: [
          { label: 'Mostrar tudo', to: q('Toda a roupa'), emphasis: true },
        ],
      },
      {
        heading: 'Roupa de inverno',
        links: [
          { label: 'Camadas térmicas e segunda pele', to: q('Roupa térmica inverno') },
          { label: 'Impermeáveis e corta-vento', to: q('Roupa impermeável inverno') },
          { label: 'Gorros, luvas e acessórios', to: q('Acessórios de inverno') },
        ],
      },
      {
        heading: 'Roupa de corrida',
        links: [
          { label: 'Bonés', to: q('Bonés') },
          { label: 'T-shirts', to: q('T-shirts de corrida') },
          { label: 'Camisolas de manga comprida', to: q('Camisolas de manga comprida') },
          { label: 'Calças', to: q('Calças de corrida') },
          { label: 'Calções', to: q('Calções de corrida') },
          { label: 'Casacos', to: q('Casacos de corrida') },
          { label: 'Coletes', to: q('Coletes de corrida') },
          { label: 'Conjuntos', to: q('Conjuntos de corrida') },
          { label: 'Meias', to: q('Meias de corrida') },
          { label: 'Leggins', to: q('Leggins') },
          { label: 'Luvas', to: q('Luvas de corrida') },
          { label: 'Tops desportivos', to: q('Tops desportivos') },
          { label: 'Sweatshirts', to: q('Sweatshirts') },
        ],
      },
    ],
    promos: [
      {
        title: 'Top roupa',
        to: q('Top roupa'),
        image: promoRoupaTop,
        imageAlt: 'Destaques de roupa de corrida',
      },
      {
        title: 'Presentes',
        to: q('Presentes em roupa'),
        image: promoRoupaPresentes,
        imageAlt: 'Ideias de presente em roupa',
      },
    ],
  },
  {
    id: 'relogios',
    label: 'Relógios GPS',
    to: q('Relógios GPS'),
    /** Figma: 2 colunas + 1 imagem larga à direita, “Em destaque” no canto inferior esquerdo. */
    subMenu: {
      ...SUB_MENU_BASE,
      panelBg: 'white',
      textGrid: 2,
      listDensity: 'default',
      promoStyle: 'overlay',
      promoOverlayAlign: 'bottom-left',
    },
    columns: [
      {
        heading: 'Todos os relógios',
        links: [{ label: 'Mostrar tudo', to: q('Todos os relógios GPS') }],
      },
      {
        heading: 'Tipo de relógio',
        linkStyle: 'uppercase',
        links: [
          { label: 'Relógios GPS', to: q('Relógios GPS categoria') },
          { label: 'Monitor cardíaco', to: q('Monitores cardíacos e cintas') },
          { label: 'Adaptadores', to: q('Adaptadores de relógio') },
        ],
      },
    ],
    promos: [
      {
        title: 'Em destaque',
        to: q('Relógios e wearables em destaque'),
        image: promoRelogio,
        imageAlt: 'Relógio desportivo em destaque',
      },
    ],
  },
  {
    id: 'equipamento',
    label: 'Equipamento de corrida',
    to: q('Equipamento de corrida'),
    /** Figma: 2 colunas texto + 1 imagem, “Em destaque” no canto inferior esquerdo. */
    subMenu: {
      ...SUB_MENU_BASE,
      panelBg: 'white',
      textGrid: 2,
      listDensity: 'compact',
      promoStyle: 'overlay',
      promoOverlayAlign: 'bottom-left',
    },
    columns: [
      {
        heading: 'Todo o equipamento',
        links: [{ label: 'Mostrar tudo', to: q('Todo o equipamento de corrida') }],
      },
      {
        heading: 'Tipo de equipamento',
        links: [
          { label: 'Mochilas de corrida', to: q('Mochilas de corrida') },
          { label: 'Cintos', to: q('Cintos de corrida e trail') },
          { label: 'Lanternas frontais', to: q('Lanternas frontais e iluminação') },
          { label: 'Postes', to: q('Postes e bastões de trail') },
          { label: 'Garrafas', to: q('Garrafas e hidratação') },
          { label: 'Óculos de sol', to: q('Óculos de sol desportivos') },
          { label: 'Fitas para a cabeça', to: q('Bandanas e fitas para a cabeça') },
          { label: 'Sacos', to: q('Sacos e sacos de cintura') },
          { label: 'Palmilhas para sapatos', to: q('Palmilhas e plantares') },
        ],
      },
    ],
    promos: [
      {
        title: 'Em destaque',
        to: q('Equipamento de corrida em destaque'),
        image: promoRoupaTop,
        imageAlt: 'Equipamento de corrida em destaque',
      },
    ],
  },
  {
    id: 'nutricao',
    label: 'Nutrição desportiva',
    to: q('Nutrição desportiva'),
    /** Figma: 2 colunas + imagem “Top Nutrição” em overlay. */
    subMenu: {
      ...SUB_MENU_BASE,
      panelBg: 'white',
      textGrid: 2,
      listDensity: 'default',
      promoStyle: 'overlay',
      promoOverlayAlign: 'bottom-left',
    },
    columns: [
      {
        heading: 'Tudo de nutrição',
        links: [{ label: 'Mostrar tudo', to: q('Toda a nutrição desportiva') }],
      },
      {
        heading: 'Tipo de nutrição',
        links: [
          { label: 'Géis de energia', to: q('Géis de energia') },
          { label: 'Bebidas energéticas', to: q('Bebidas energéticas') },
          { label: 'Vitaminas e minerais', to: q('Vitaminas e minerais') },
          { label: 'Proteína em pó', to: q('Proteína em pó') },
        ],
      },
    ],
    promos: [
      {
        title: 'Top Nutrição',
        to: q('Top nutrição desportiva'),
        image: promoNutricao,
        imageAlt: 'Destaques de nutrição desportiva',
      },
    ],
  },
  {
    id: 'hyrox',
    label: 'Hyrox',
    to: q('Hyrox e cross training'),
    subMenu: {
      ...SUB_MENU_BASE,
      panelBg: 'white',
      textGrid: 2,
      listDensity: 'default',
      promoStyle: 'footer',
    },
    columns: [
      {
        heading: 'Hyrox',
        links: [
          { label: 'Equipamento de Hyrox', to: q('Hyrox') },
          { label: 'Luvas e proteção mãos', to: q('Luvas de treino') },
          { label: 'Sapatilhas indoor', to: q('Sapatilhas de ginásio e indoor') },
        ],
      },
      {
        heading: 'Força e funcional',
        links: [
          { label: 'Pneus e sacos de areia', to: q('Equipamento funcional') },
          { label: 'Chinelos de recuperação', to: q('Chinelas de recuperação') },
        ],
      },
    ],
    promos: [
      {
        title: 'Guia de Hyrox',
        to: q('Guia Hyrox'),
        image: promoRelogio,
        imageAlt: 'Treino de Hyrox',
      },
      {
        title: 'Novidades',
        to: q('Novidades Hyrox'),
        image: promoPresentes,
        imageAlt: 'Novidades de treino',
      },
    ],
  },
  {
    id: 'marcas',
    label: 'Marcas',
    to: q('Marcas'),
    /** Figma: fila de logótipos. Sem colunas. (Substitui o último por Coros se adicionares `coros.png`.) */
    subMenu: {
      ...SUB_MENU_BASE,
      panelType: 'brandLogos',
      panelBg: 'white',
    },
    brandLogos: [
      { to: q('Adidas'), image: brandAdidas, alt: 'Adidas' },
      { to: q('Asics'), image: brandAsics, alt: 'Asics' },
      { to: q('Nike'), image: brandNike, alt: 'Nike' },
      { to: q('Hoka'), image: brandHoka, alt: 'Hoka' },
      { to: q('Puma'), image: brandPuma, alt: 'Puma' },
      { to: q('New Balance'), image: brandNewBalance, alt: 'New Balance' },
      { to: q('Garmin'), image: brandGarmin, alt: 'Garmin' },
      { to: q('Brooks'), image: brandBrooks, alt: 'Brooks' },
    ],
  },
  {
    id: 'saldos',
    label: 'Saldos',
    to: q('Saldos'),
    isSale: true,
    /** Figma Nav 7: 3 colunas (Sapatilhas / Roupa / Nutrição) + 1 imagem “Em destaque”. */
    subMenu: {
      ...SUB_MENU_BASE,
      panelType: 'default',
      panelBg: 'white',
      textGrid: 3,
      listDensity: 'compact',
      promoStyle: 'overlay',
      promoOverlayAlign: 'bottom-left',
    },
    columns: [
      {
        heading: 'Sapatilhas',
        links: [
          { label: 'Sapatilhas de corrida', to: q('Saldos sapatilhas de corrida') },
          { label: 'Sapatilhas de trilho', to: q('Saldos sapatilhas de trilho') },
          { label: 'Sapatilhas de atletismo', to: q('Saldos sapatilhas de atletismo') },
        ],
      },
      {
        heading: 'Roupa',
        links: [
          { label: 'Camisolas de manga comprida', to: q('Saldos camisolas de manga comprida') },
          { label: 'T-shirts', to: q('Saldos t-shirts') },
          { label: 'Calções', to: q('Saldos calções') },
          { label: 'Calças', to: q('Saldos calças') },
          { label: 'Casacos', to: q('Saldos casacos') },
          { label: 'Coletes', to: q('Saldos coletes') },
          { label: 'Conjuntos', to: q('Saldos conjuntos') },
          { label: 'Meias', to: q('Saldos meias') },
          { label: 'Leggins', to: q('Saldos leggins') },
          { label: 'Luvas', to: q('Saldos luvas') },
          { label: 'Tops desportivos', to: q('Saldos tops desportivos') },
          { label: 'Sweatshirts', to: q('Saldos sweatshirts') },
        ],
      },
      {
        heading: 'Nutrição',
        links: [
          { label: 'Géis de energia', to: q('Saldos géis de energia') },
          { label: 'Bebidas energéticas', to: q('Saldos bebidas energéticas') },
          { label: 'Vitaminas e minerais', to: q('Saldos vitaminas e minerais') },
          { label: 'Proteína em pó', to: q('Saldos proteína em pó') },
        ],
      },
    ],
    promos: [
      {
        title: 'Em destaque',
        to: q('Saldos em destaque'),
        image: promoRoupaTop,
        imageAlt: 'Destaques em saldos',
      },
    ],
  },
]
