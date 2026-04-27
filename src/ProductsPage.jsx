import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProductCard from './components/ui/ProductCard'
import productImage from './assets/product-card-test-image.png'
import { getJson, resolveAssetUrl } from './lib/api'
import {
  mapProductToCard,
  normalizeText,
  createStockLabel,
  LOW_STOCK_THRESHOLD,
} from './lib/mapProductToCard'

const fallbackProducts = [
  {
    id: 'fallback-1',
    categoryId: 'fallback-category',
    categoryName: 'Produtos',
    title: 'Adidas Adizero Boston 13 W',
    color: 'Branco e Rosa',
    price: '132.00 EUR',
    oldPrice: '188.00 EUR',
    discountLabel: '30% off',
    image: productImage,
    stockLabel: null,
    facetGenders: [],
    facetSizes: [],
  },
  {
    id: 'fallback-2',
    categoryId: 'fallback-category',
    categoryName: 'Produtos',
    title: 'Adidas Adizero Takumi SEN 10 W',
    color: 'Azul',
    price: '135.00 EUR',
    image: productImage,
    stockLabel: null,
    facetGenders: [],
    facetSizes: [],
  },
  {
    id: 'fallback-3',
    categoryId: 'fallback-category',
    categoryName: 'Produtos',
    title: 'Adizero Adios Pro 4 W',
    color: 'Branco e Laranja',
    price: '97.00 EUR',
    image: productImage,
    stockLabel: null,
    facetGenders: [],
    facetSizes: [],
  },
]

const colorSwatches = [
  { name: 'Preto', color: '#111111' },
  { name: 'Azul', color: '#1f4f8f' },
  { name: 'Castanho', color: '#9a5b2a' },
  { name: 'Verde', color: '#5f6b4f' },
  { name: 'Cinzento', color: '#d9d9d9', light: true },
  { name: 'Laranja', color: '#d8892b' },
  { name: 'Rosa', color: '#f0c7bd' },
  { name: 'Vermelho', color: '#c62828' },
  { name: 'Bege', color: '#b8a892' },
]

const colorAliasMap = {
  preto: ['preto', 'preta', 'black', 'noir'],
  azul: ['azul', 'blue', 'navy'],
  castanho: ['castanho', 'marrom', 'brown'],
  verde: ['verde', 'green'],
  cinzento: ['cinzento', 'cinza', 'gris', 'grey', 'gray'],
  laranja: ['laranja', 'orange'],
  rosa: ['rosa', 'pink'],
  vermelho: ['vermelho', 'red', 'rojo'],
  bege: ['bege', 'beige'],
}

function getColorTokens(colorName) {
  const key = normalizeText(colorName)
  return colorAliasMap[key] || [key]
}

function colorMatches(value, selectedColor) {
  const haystack = normalizeText(value)
  if (!haystack) return false
  return getColorTokens(selectedColor).some((token) => haystack.includes(token))
}

function pickImageByColor(imageOptions, selectedColor) {
  if (!Array.isArray(imageOptions) || imageOptions.length === 0) return ''
  const match = imageOptions.find((item) => colorMatches(item.searchText, selectedColor))
  return match?.url || ''
}

function buildCategoryLink(category, index) {
  const categoryId = category?.id != null ? String(category.id) : `category-${index}`
  const categoryName = category?.name_pt || category?.name_es || category?.slug || `Categoria ${index + 1}`
  return {
    id: categoryId,
    name: categoryName,
    to: `/products?categoryId=${encodeURIComponent(categoryId)}&categoryName=${encodeURIComponent(categoryName)}`,
  }
}

/** URL params are strings; API ids may be numbers — normalize so multi-select works. */
function parseCategoryIdsFromSearchParams(searchParams) {
  const multi = String(searchParams.get('categories') || '').trim()
  if (multi) {
    return multi
      .split(',')
      .map((s) => String(s).trim())
      .filter(Boolean)
  }
  const one = String(searchParams.get('categoryId') || '').trim()
  return one ? [one] : []
}

function parseAttrForFacets(raw) {
  if (!raw) return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

function extractFacetsFromApiProduct(product) {
  const genders = new Set()
  const sizes = new Set()
  for (const v of product?.variants || []) {
    const a = parseAttrForFacets(v?.attribute_values)
    for (const [key, val] of Object.entries(a)) {
      const k = normalizeText(String(key))
      const values = Array.isArray(val) ? val : [val]
      for (const item of values) {
        const str = String(item ?? '').trim()
        if (!str) continue
        if (k === 'gender' || k.includes('genero') || k.includes('género')) genders.add(str)
        if (k === 'size' || k.includes('tamanho')) sizes.add(str)
      }
    }
  }
  return { facetGenders: [...genders], facetSizes: [...sizes] }
}

const GENDER_OPTIONS = [
  { id: 'mulher', label: 'Mulher' },
  { id: 'homem', label: 'Homem' },
  { id: 'unisexo', label: 'Unisexo' },
]

function genderOptionMatches(optionId, rawValue) {
  const n = normalizeText(String(rawValue))
  if (optionId === 'mulher') {
    return (
      n.includes('mulher') ||
      n.includes('women') ||
      n.includes('feminino') ||
      n.includes('woman') ||
      n === 'w' ||
      /\bfemale\b/.test(n)
    )
  }
  if (optionId === 'homem') {
    return (
      n.includes('homem') ||
      n.includes('men') ||
      (n.includes('masculino') && !n.includes('feminino')) ||
      n.includes('male') ||
      (n === 'm' && !n.includes('mul'))
    )
  }
  if (optionId === 'unisexo') {
    return n.includes('unissex') || n.includes('unisex')
  }
  return false
}

function productMatchesGenderFacets(facetGenders, selectedGenderIds) {
  if (!selectedGenderIds.length) return true
  if (!facetGenders.length) return true
  return selectedGenderIds.some((gid) =>
    facetGenders.some((fg) => genderOptionMatches(gid, fg))
  )
}

function productMatchesSizeFacets(facetSizes, selectedSizes) {
  if (!selectedSizes.length) return true
  if (!facetSizes.length) return true
  const norm = (x) => String(x).trim()
  return selectedSizes.some((sel) => facetSizes.some((fs) => norm(fs) === norm(sel)))
}

function compareSizeLabels(a, b) {
  const na = Number(String(a).replace(',', '.'))
  const nb = Number(String(b).replace(',', '.'))
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  return String(a).localeCompare(String(b), 'pt', { numeric: true })
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)

  const selectedCategoryIds = useMemo(
    () => parseCategoryIdsFromSearchParams(searchParams),
    [searchParams]
  )

  const selectedCategoryName = String(searchParams.get('categoryName') || '').trim()

  const selectedGenderIds = useMemo(() => {
    const g = String(searchParams.get('genders') || '').trim()
    return g ? g.split(',').map((s) => s.trim()).filter(Boolean) : []
  }, [searchParams])

  const selectedSizeLabels = useMemo(() => {
    const s = String(searchParams.get('sizes') || '').trim()
    return s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []
  }, [searchParams])

  const setCategoriesParam = useCallback(
    (ids) => {
      const normalized = [...new Set(ids.map((x) => String(x ?? '').trim()).filter(Boolean))]
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('categoryId')
          next.delete('categoryName')
          if (!normalized.length) next.delete('categories')
          else next.set('categories', normalized.join(','))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const toggleCategoryId = useCallback(
    (id) => {
      const sid = String(id ?? '').trim()
      if (!sid) return
      const set = new Set(selectedCategoryIds.map((x) => String(x)))
      if (set.has(sid)) set.delete(sid)
      else set.add(sid)
      setCategoriesParam([...set])
    },
    [selectedCategoryIds, setCategoriesParam]
  )

  const clearCategoryFilters = useCallback(() => {
    setCategoriesParam([])
  }, [setCategoriesParam])

  const toggleGenderId = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const cur = new Set(
            String(prev.get('genders') || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          )
          if (cur.has(id)) cur.delete(id)
          else cur.add(id)
          if (cur.size === 0) next.delete('genders')
          else next.set('genders', [...cur].join(','))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const toggleSizeLabel = useCallback(
    (label) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const cur = new Set(
            String(prev.get('sizes') || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          )
          if (cur.has(label)) cur.delete(label)
          else cur.add(label)
          if (cur.size === 0) next.delete('sizes')
          else next.set('sizes', [...cur].join(','))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  useEffect(() => {
    let active = true

    const loadProducts = async () => {
      try {
        const [productsResponse, categoriesResponse, stockSummaryResponse] = await Promise.allSettled([
          getJson('/api/products'),
          getJson('/api/catalog/categories'),
          getJson(`/api/orders/dashboard/summary?threshold=${LOW_STOCK_THRESHOLD}&limit=2000`),
        ])

        if (!active) return

        const lowStockMap = new Map()
        if (
          stockSummaryResponse.status === 'fulfilled' &&
          Array.isArray(stockSummaryResponse.value?.low_stock_products)
        ) {
          for (const row of stockSummaryResponse.value.low_stock_products) {
            const key = String(row?.product_id || '').trim()
            if (!key) continue
            const qty = Number(row?.stock_left)
            if (!Number.isFinite(qty)) continue
            lowStockMap.set(key, Math.max(0, Math.floor(qty)))
          }
        }

        const mappedProducts =
          productsResponse.status === 'fulfilled' && Array.isArray(productsResponse.value)
            ? productsResponse.value.map((product, index) => {
                const card = mapProductToCard(product, index)
                const { facetGenders, facetSizes } = extractFacetsFromApiProduct(product)
                const dbStock = lowStockMap.get(String(card.id || '').trim())
                const withFacets = { ...card, facetGenders, facetSizes }
                return dbStock == null ? withFacets : { ...withFacets, stockLabel: createStockLabel(dbStock) }
              })
            : []

        const mappedCategories =
          categoriesResponse.status === 'fulfilled' && Array.isArray(categoriesResponse.value)
            ? categoriesResponse.value
                .filter((category) => category?.is_active !== false)
                .map(buildCategoryLink)
            : []

        setProducts(mappedProducts)
        setCategories(mappedCategories)
        setError('')
      } catch (err) {
        if (!active) return
        setProducts([])
        setCategories([])
        setError(err instanceof Error ? err.message : 'Failed to load products')
      }
    }

    void loadProducts()

    return () => {
      active = false
    }
  }, [])

  const baseProducts = products.length > 0 ? products : fallbackProducts

  const filteredProducts = useMemo(() => {
    const filteredByCategory =
      selectedCategoryIds.length === 0
        ? baseProducts
        : baseProducts.filter((product) => {
            const pid = String(product?.categoryId ?? '').trim()
            return selectedCategoryIds.some((cid) => String(cid) === pid)
          })

    const filteredByFacets = filteredByCategory.filter((product) => {
      const g = product?.facetGenders ?? []
      const z = product?.facetSizes ?? []
      if (!productMatchesGenderFacets(g, selectedGenderIds)) return false
      if (!productMatchesSizeFacets(z, selectedSizeLabels)) return false
      return true
    })

    if (!selectedColor) return filteredByFacets

    return filteredByFacets
      .map((product) => {
        const matchedVariant = Array.isArray(product?.variantOptions)
          ? product.variantOptions.find((variant) => colorMatches(variant.color, selectedColor))
          : null
        const matchedImage = pickImageByColor(product?.imageOptions, selectedColor)

        if (matchedVariant) {
          return {
            ...product,
            color: matchedVariant.color === 'Cor disponivel' ? selectedColor : matchedVariant.color,
            price: matchedVariant.price,
            oldPrice: matchedVariant.oldPrice,
            discountLabel: matchedVariant.discountLabel,
            image: matchedImage || product.image,
          }
        }

        if (colorMatches(product?.color, selectedColor) || matchedImage) {
          return {
            ...product,
            color: colorMatches(product?.color, selectedColor) ? product.color : selectedColor,
            image: matchedImage || product.image,
          }
        }

        return null
      })
      .filter(Boolean)
  }, [
    baseProducts,
    selectedCategoryIds,
    selectedGenderIds,
    selectedSizeLabels,
    selectedColor,
  ])

  const resolvedCategoryName = useMemo(() => {
    if (selectedCategoryIds.length === 0) return 'Todos os produtos'
    if (selectedCategoryIds.length === 1) {
      const only = String(selectedCategoryIds[0])
      const match = categories.find((c) => String(c.id) === only)
      if (match?.name) return match.name
      if (selectedCategoryName) return selectedCategoryName
      return 'Produtos'
    }
    const names = selectedCategoryIds
      .map((id) => categories.find((c) => String(c.id) === String(id))?.name)
      .filter(Boolean)
    if (names.length) return names.join(', ')
    return 'Produtos filtrados'
  }, [categories, selectedCategoryIds, selectedCategoryName])

  const groupedProducts = useMemo(() => {
    if (selectedCategoryIds.length === 1) {
      return [
        {
          id: selectedCategoryIds[0],
          name: resolvedCategoryName,
          products: filteredProducts,
        },
      ]
    }
    if (selectedCategoryIds.length > 1) {
      return [
        {
          id: 'filtered-categories',
          name: resolvedCategoryName,
          products: filteredProducts,
        },
      ]
    }

    const groups = new Map()

    for (const product of filteredProducts) {
      const key = String(product?.categoryId || 'uncategorized').trim() || 'uncategorized'
      const name = product?.categoryName || 'Sem categoria'
      if (!groups.has(key)) {
        groups.set(key, { id: key, name, products: [] })
      }
      groups.get(key).products.push(product)
    }

    const orderedGroups = categories.map((category) => {
      return groups.get(category.id) || { id: category.id, name: category.name, products: [] }
    })

    for (const [key, group] of groups.entries()) {
      if (!categories.some((category) => category.id === key)) {
        orderedGroups.push(group)
      }
    }

    return orderedGroups
  }, [categories, filteredProducts, resolvedCategoryName, selectedCategoryIds])

  const visibleCount = filteredProducts.length

  const uniqueSizesFromCatalog = useMemo(() => {
    const set = new Set()
    for (const p of baseProducts) {
      for (const s of p.facetSizes ?? []) {
        const t = String(s ?? '').trim()
        if (t) set.add(t)
      }
    }
    return [...set].sort(compareSizeLabels)
  }, [baseProducts])

  const hasFacetFilters =
    selectedCategoryIds.length > 0 ||
    selectedGenderIds.length > 0 ||
    selectedSizeLabels.length > 0 ||
    selectedColor != null

  const clearAllFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('categories')
        next.delete('categoryId')
        next.delete('categoryName')
        next.delete('genders')
        next.delete('sizes')
        return next
      },
      { replace: true }
    )
    setSelectedColor(null)
  }, [setSearchParams])

  const toggleColor = (name) => {
    setSelectedColor((prev) => (prev === name ? null : name))
  }

  const filterCheckboxClass =
    'mt-0.5 h-[15px] w-[15px] shrink-0 cursor-pointer rounded-[2px] border border-black bg-white text-black accent-black focus:ring-1 focus:ring-black/30 focus:ring-offset-0'

  return (
    <>
      <Navbar />
      <section className='min-w-0 bg-[#fcfcfc] py-4 pb-8 sm:py-5 sm:pb-10 md:py-8 [padding-bottom:max(2rem,env(safe-area-inset-bottom,0))]'>
        <div
          className='mx-auto flex w-full min-w-0 max-w-[1380px] flex-col gap-5 px-3 sm:gap-6 sm:px-4 md:gap-8 md:px-6 lg:grid lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-10 lg:px-5 xl:px-6'
          data-theme-layout-root='products'
        >
          <aside
            className='min-w-0 max-w-full rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6 lg:h-fit lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:p-6 lg:shadow-none'
            data-theme-layout-section='filters'
          >
            <div className='flex items-start justify-between gap-3 border-b border-black/10 pb-3 sm:pb-4'>
              <div>
                <p className='text-[11px] font-medium uppercase tracking-[0.22em] text-black/50'>Catálogo</p>
                <p className='mt-1 text-[22px] font-semibold leading-none text-black'>{visibleCount}</p>
                <p className='mt-1 text-[12px] text-black/55'>produtos visíveis</p>
              </div>
              {hasFacetFilters ? (
                <button
                  type='button'
                  onClick={clearAllFilters}
                  className='shrink-0 text-[11px] font-medium text-black/60 underline underline-offset-4 hover:text-black'
                >
                  Limpar
                </button>
              ) : null}
            </div>

            <details open className='group border-b border-black/10 py-3 sm:py-4'>
              <summary className='flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-bold text-black [touch-action:manipulation] [&::-webkit-details-marker]:hidden sm:min-h-0'>
                Categoria
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className='shrink-0 text-black transition group-open:rotate-180'
                  aria-hidden
                />
              </summary>
              <div className='mt-4 flex flex-col gap-3.5'>
                {selectedCategoryIds.length > 0 ? (
                  <button
                    type='button'
                    onClick={() => clearCategoryFilters()}
                    className='w-fit text-left text-[12px] font-medium text-black/70 underline underline-offset-4 transition hover:text-black'
                  >
                    Mostrar todos os produtos
                  </button>
                ) : (
                  <p className='m-0 text-[12px] leading-snug text-black/45'>
                    Selecione uma ou mais categorias para filtrar o catálogo.
                  </p>
                )}
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className='flex cursor-pointer items-start gap-3 rounded-md py-1.5 text-[13px] leading-snug text-[#333] [touch-action:manipulation] active:bg-black/[0.03] sm:py-0 sm:active:bg-transparent'
                  >
                    <input
                      type='checkbox'
                      className={filterCheckboxClass}
                      checked={selectedCategoryIds.some((cid) => String(cid) === String(category.id))}
                      onChange={() => toggleCategoryId(category.id)}
                    />
                    <span className='pt-0.5'>{category.name}</span>
                  </label>
                ))}
              </div>
            </details>

            <details open className='group border-b border-black/10 py-3 sm:py-4'>
              <summary className='flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-bold text-black [touch-action:manipulation] [&::-webkit-details-marker]:hidden sm:min-h-0'>
                Género
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className='shrink-0 text-black transition group-open:rotate-180'
                  aria-hidden
                />
              </summary>
              <div className='mt-4 flex flex-col gap-3.5'>
                {GENDER_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className='flex cursor-pointer items-start gap-3 rounded-md py-1.5 text-[13px] leading-snug text-[#333] [touch-action:manipulation] active:bg-black/[0.03] sm:py-0 sm:active:bg-transparent'
                  >
                    <input
                      type='checkbox'
                      className={filterCheckboxClass}
                      checked={selectedGenderIds.includes(opt.id)}
                      onChange={() => toggleGenderId(opt.id)}
                    />
                    <span className='pt-0.5'>{opt.label}</span>
                  </label>
                ))}
              </div>
            </details>

            <details open className='group border-b border-black/10 py-3 sm:py-4'>
              <summary className='flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-bold text-black [touch-action:manipulation] [&::-webkit-details-marker]:hidden sm:min-h-0'>
                Tamanho
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className='shrink-0 text-black transition group-open:rotate-180'
                  aria-hidden
                />
              </summary>
              {uniqueSizesFromCatalog.length === 0 ? (
                <p className='mt-4 text-[12px] leading-relaxed text-black/45'>
                  Os tamanhos aparecem quando os produtos têm variantes com tamanho definido no admin.
                </p>
              ) : (
                <div className='mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2'>
                  {uniqueSizesFromCatalog.map((sizeLabel) => {
                    const isOn = selectedSizeLabels.includes(sizeLabel)
                    return (
                      <button
                        key={sizeLabel}
                        type='button'
                        aria-pressed={isOn}
                        onClick={() => toggleSizeLabel(sizeLabel)}
                        className={`flex h-10 min-h-[44px] min-w-0 items-center justify-center border text-[12px] font-medium transition [touch-action:manipulation] sm:h-9 sm:min-h-0 sm:text-[13px] ${
                          isOn
                            ? 'border-black bg-black/[0.06] text-black'
                            : 'border-black/20 bg-[#f2f2f2] text-black hover:border-black/40'
                        }`}
                      >
                        {sizeLabel}
                      </button>
                    )
                  })}
                </div>
              )}
            </details>

            <details open className='group py-3 sm:py-4'>
              <summary className='flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-bold text-black [touch-action:manipulation] [&::-webkit-details-marker]:hidden sm:min-h-0'>
                Cor
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className='shrink-0 text-black transition group-open:rotate-180'
                  aria-hidden
                />
              </summary>
              <div className='mt-4 grid grid-cols-2 gap-x-2 gap-y-4 text-[10px] text-[#333] min-[420px]:grid-cols-3 sm:text-[11px]'>
                {colorSwatches.map((swatch) => {
                  const isSelected = selectedColor === swatch.name
                  return (
                    <button
                      key={swatch.name}
                      type='button'
                      aria-pressed={isSelected}
                      onClick={() => toggleColor(swatch.name)}
                      className='group/sw flex min-w-0 flex-col items-center gap-1.5 py-1 outline-none [touch-action:manipulation] sm:gap-2'
                    >
                      <span
                        className={`h-8 w-8 rounded-full transition-shadow sm:h-7 sm:w-7 ${
                          isSelected
                            ? 'ring-2 ring-black ring-offset-2 ring-offset-white'
                            : swatch.light
                              ? 'ring-1 ring-black/20'
                              : ''
                        } group-focus-visible/sw:ring-2 group-focus-visible/sw:ring-black group-focus-visible/sw:ring-offset-2 group-focus-visible/sw:ring-offset-white`}
                        style={{ backgroundColor: swatch.color }}
                      />
                      <span
                        className={`max-w-full truncate text-center leading-tight ${
                          isSelected ? 'font-semibold text-black' : 'font-normal'
                        }`}
                      >
                        {swatch.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </details>
          </aside>

          <div className='min-w-0' data-theme-layout-section='content'>
            <div className='min-w-0 rounded-2xl bg-white px-4 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:rounded-3xl sm:px-6 sm:py-8 md:px-8'>
              <p className='text-[10px] uppercase leading-relaxed tracking-[0.2em] text-black/45 sm:text-[11px] sm:tracking-[0.24em]'>
                <span className='break-words'>Home / {resolvedCategoryName}</span>
              </p>
              <div className='mt-3 flex flex-col gap-4 sm:gap-3 md:flex-row md:items-end md:justify-between'>
                <div className='min-w-0'>
                  <h1 className='text-balance text-2xl font-semibold leading-[1.15] text-black sm:text-[32px] sm:leading-tight md:text-[40px]'>
                    {resolvedCategoryName}
                  </h1>
                  <p className='mt-2 max-w-[680px] text-[13px] leading-relaxed text-black/60 sm:text-[14px]'>
                    Explore produtos organizados pelas categorias que estao definidas no catalogo.
                  </p>
                </div>
                <div className='shrink-0 self-start rounded-full bg-black/[0.05] px-3 py-2 text-[12px] text-black/70 sm:self-auto sm:px-4 sm:text-[13px] md:self-end'>
                  {visibleCount} artigos
                </div>
              </div>
              {error ? <p className='mt-3 text-[12px] text-red-600'>Live products unavailable. Showing fallback items.</p> : null}
            </div>

            <div className='mt-6 space-y-8 sm:mt-8 sm:space-y-10'>
              {groupedProducts.length === 0 ? (
                <section className='min-w-0 rounded-2xl bg-white px-4 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:rounded-3xl sm:px-6 sm:py-8 md:px-8'>
                  <div className='rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-10 text-center text-[13px] leading-relaxed text-black/60 sm:rounded-2xl sm:px-6 sm:py-12 sm:text-[14px]'>
                    No products in this category.
                  </div>
                </section>
              ) : (
                groupedProducts.map((group) => (
                  <section
                    key={group.id}
                    className='min-w-0 rounded-2xl bg-white px-4 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:rounded-3xl sm:px-6 sm:py-8 md:px-8'
                  >
                    {selectedCategoryIds.length === 0 ? (
                      <div className='mb-5 flex flex-col gap-4 border-b border-black/10 pb-5 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between sm:mb-6'>
                        <div className='min-w-0'>
                          <p className='text-[10px] uppercase tracking-[0.2em] text-black/40 sm:text-[11px] sm:tracking-[0.22em]'>
                            Categoria
                          </p>
                          <h2 className='mt-2 text-balance text-xl font-semibold leading-tight sm:text-2xl md:text-[26px]'>
                            {group.name}
                          </h2>
                        </div>
                        <Link
                          to={`/products?categoryId=${encodeURIComponent(group.id)}&categoryName=${encodeURIComponent(group.name)}`}
                          className='shrink-0 text-[13px] font-medium text-black underline underline-offset-4 [touch-action:manipulation]'
                        >
                          Ver categoria
                        </Link>
                      </div>
                    ) : null}

                    {group.products.length === 0 ? (
                      <div className='rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-10 text-center text-[13px] leading-relaxed text-black/60 sm:rounded-2xl sm:px-6 sm:py-12 sm:text-[14px]'>
                        No products in this category.
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 gap-x-4 gap-y-8 min-[480px]:grid-cols-2 min-[480px]:gap-x-6 min-[480px]:gap-y-10 xl:grid-cols-3 xl:gap-x-8'>
                        {group.products.map((product, index) => (
                          <div key={`${group.id}-${product.id || product.title}-${index}`} className='min-w-0'>
                            <ProductCard
                              image={product.image}
                              title={product.title}
                              color={product.color}
                              price={product.price}
                              oldPrice={product.oldPrice}
                              discountLabel={product.discountLabel}
                              stockLabel={product.stockLabel}
                              to={`/productDetails/${encodeURIComponent(String(product.id || index))}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}

export default ProductsPage
