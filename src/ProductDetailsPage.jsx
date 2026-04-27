import React, { useEffect, useMemo, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { Pagination, Navigation } from 'swiper/modules'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import productImage from './assets/product-card-test-image.png'
import ProductCard from './components/ui/ProductCard'
import IconEntrega from './assets/image4.png'
import IconDevolucao from './assets/image5.png'
import { getJson, resolveAssetUrl } from './lib/api'
import { addCartItem } from './lib/cart'

const LOW_STOCK_THRESHOLD = 5

/** Common PT/EN color tokens → hex for dynamic swatches when backend sends text only */
const COLOR_LABEL_HEX_HINTS = {
  preto: '#111111',
  pret: '#111111',
  black: '#111111',
  azul: '#1f4f8f',
  blue: '#1f4f8f',
  navy: '#1a3a5c',
  castanho: '#9a5b2a',
  brown: '#9a5b2a',
  marrom: '#6b4423',
  verde: '#5f6b4f',
  green: '#2e6b3f',
  cinzento: '#c4c4c4',
  cinza: '#b0b0b0',
  grey: '#9e9e9e',
  gray: '#9e9e9e',
  laranja: '#d8892b',
  orange: '#e65100',
  rosa: '#f0c7bd',
  pink: '#e8b4b4',
  vermelho: '#c62828',
  red: '#c62828',
  bege: '#b8a892',
  beige: '#c4b59d',
  branco: '#f5f5f5',
  white: '#f5f5f5',
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatPrice(value) {
  const amount = toNumber(value, 0)
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`
}

function createStockLabel(stock) {
  const qty = Number(stock)
  if (!Number.isFinite(qty)) return null
  const safeQty = Math.max(0, Math.floor(qty))
  if (safeQty === 0) return 'Out of stock'
  if (safeQty <= LOW_STOCK_THRESHOLD) return `${safeQty} left`
  return null
}

function parseAttributes(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  if (typeof raw !== 'string') return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function hashStringToHex(input) {
  let h = 0
  const str = String(input || '')
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  const c = (Math.abs(h) % 0xffffff).toString(16).padStart(6, '0')
  return `#${c}`
}

function colorHexFromLabel(label) {
  const n = normalizeText(label)
  if (!n) return '#6b7280'
  for (const [key, hex] of Object.entries(COLOR_LABEL_HEX_HINTS)) {
    if (n.includes(key)) return hex
  }
  return hashStringToHex(n)
}

function luminanceApprox(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '')
  if (!m) return 0.5
  const r = parseInt(m[1], 16) / 255
  const g = parseInt(m[2], 16) / 255
  const b = parseInt(m[3], 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function isLightHex(hex) {
  return luminanceApprox(hex) > 0.62
}

function sortSizeLabels(sizes) {
  return [...new Set(sizes.map((s) => String(s).trim()).filter(Boolean))].sort((a, b) => {
    const na = Number(String(a).replace(',', '.'))
    const nb = Number(String(b).replace(',', '.'))
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
    return String(a).localeCompare(String(b), 'pt', { numeric: true })
  })
}

/** Match gallery/alt text to selected color (from admin images + variant color label). */
function pickImageByColor(imageOptions, selectedColorId, colorLabel) {
  if (!Array.isArray(imageOptions) || imageOptions.length === 0) return ''
  const idn = normalizeText(selectedColorId)
  const lab = normalizeText(colorLabel)
  const match = imageOptions.find((item) => {
    const h = normalizeText(item.searchText)
    if (idn && h.includes(idn)) return true
    if (lab) {
      if (h.includes(lab)) return true
      const parts = lab.split(/\s+/).filter((w) => w.length > 2)
      return parts.some((p) => h.includes(p))
    }
    return false
  })
  return match?.url || ''
}

function buildDynamicColorSwatches(variantOptions, imageOptions) {
  const labels = [...new Set(variantOptions.map((v) => v.colorLabel).filter(Boolean))]
  return labels.map((label) => {
    const id = normalizeText(label) || `c-${label}`
    const hex = colorHexFromLabel(label)
    const thumbUrl =
      (imageOptions || []).find((item) => {
        const h = normalizeText(item.searchText)
        const lb = normalizeText(label)
        if (!lb) return false
        if (h.includes(lb)) return true
        return lb
          .split(/\s+/)
          .filter((w) => w.length > 2)
          .some((w) => h.includes(w))
      })?.url || ''
    return {
      id,
      label,
      color: hex,
      light: isLightHex(hex),
      available: true,
      thumbUrl,
    }
  })
}

function readAttrValue(raw) {
  if (raw == null) return ''
  if (Array.isArray(raw)) return String(raw[0] ?? '').trim()
  if (typeof raw === 'object') return String(Object.values(raw)[0] ?? '').trim()
  return String(raw).trim()
}

function extractColorFromAttributes(attributes) {
  const entries = Object.entries(attributes || {})
  const found = entries.find(([key]) => {
    const normalizedKey = normalizeText(key)
    return normalizedKey.includes('cor') || normalizedKey.includes('color')
  })
  return readAttrValue(found?.[1])
}

function extractSizeFromAttributes(attributes) {
  const entries = Object.entries(attributes || {})
  const found = entries.find(([key]) => {
    const normalizedKey = normalizeText(key)
    return normalizedKey.includes('size') || normalizedKey.includes('tamanho')
  })
  return readAttrValue(found?.[1])
}

function mapProductForDetails(product, index = 0) {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const imageOptions = Array.isArray(product?.images)
    ? product.images
        .map((item) => ({
          url: resolveAssetUrl(item?.image_url || ''),
          searchText: `${item?.alt_text || ''} ${item?.image_url || ''}`.trim(),
        }))
        .filter((item) => Boolean(item.url))
    : []
  const images = imageOptions.map((item) => item.url)
  const primaryVariant = variants.find((variant) => variant?.is_active !== false) || variants[0] || null
  const price = toNumber(primaryVariant?.price ?? product?.base_price, 0)
  const compareAt = toNumber(primaryVariant?.compare_at_price, 0)
  const variantOptions = variants.map((variant) => {
    const attrs = parseAttributes(variant?.attribute_values)
    const colorLabel = extractColorFromAttributes(attrs)
    const sizeLabel = extractSizeFromAttributes(attrs)
    const colorId = normalizeText(colorLabel) || ''
    return {
      id: variant?.id != null ? String(variant.id) : null,
      sku: variant?.sku || product?.sku || null,
      isActive: variant?.is_active !== false,
      price: toNumber(variant?.price ?? product?.base_price, 0),
      compareAt: toNumber(variant?.compare_at_price, 0),
      colorLabel,
      colorId,
      sizeLabel,
      attributes: attrs,
    }
  })

  const dynamicColors = buildDynamicColorSwatches(variantOptions, imageOptions)
  const colorFromActiveVariant =
    variantOptions.find((variant) => variant.isActive && variant.colorId)?.colorId ||
    variantOptions.find((variant) => variant.colorId)?.colorId ||
    ''
  const defaultColorId = colorFromActiveVariant || dynamicColors[0]?.id || ''
  const visibleSizes = sortSizeLabels(
    variantOptions.map((variant) => String(variant.sizeLabel || '').trim()).filter(Boolean)
  )
  const galleryImages = (images.length > 0 ? images : [productImage]).slice(0, 4)
  const primaryThumb =
    pickImageByColor(imageOptions, defaultColorId, dynamicColors.find((c) => c.id === defaultColorId)?.label) ||
    images[0] ||
    productImage

  return {
    id: String(product?.id || `fallback-${index}`),
    categoryId: product?.category_id != null ? String(product.category_id) : null,
    primaryVariantId: primaryVariant?.id != null ? String(primaryVariant.id) : null,
    sku: primaryVariant?.sku || product?.sku || null,
    title: product?.name_pt || product?.name_es || product?.sku || `Produto ${index + 1}`,
    category: product?.category_name_pt || product?.category_name_es || 'Sapatilhas',
    description:
      product?.description_pt ||
      product?.description_es ||
      'Produto sem descricao detalhada no momento.',
    price,
    compareAt,
    images,
    galleryImages,
    imageOptions,
    variantOptions,
    defaultColorId,
    defaultSize: visibleSizes[0] || '',
    colors: dynamicColors,
    sizes: visibleSizes,
    cardColor: dynamicColors.find((c) => c.id === defaultColorId)?.label || 'Cor disponivel',
    image: primaryThumb,
  }
}

function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState(null)
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadProduct = async () => {
      try {
        setLoading(true)
        setError('')
        const routeId = String(id || '').trim()
        const [productsResponse, singleResponse, stockSummaryResponse] = await Promise.allSettled([
          getJson('/api/products'),
          routeId
            ? getJson(`/api/products/${encodeURIComponent(routeId)}`)
            : Promise.resolve(null),
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

        const listRaw =
          productsResponse.status === 'fulfilled' && Array.isArray(productsResponse.value)
            ? productsResponse.value
            : []
        const mapped = listRaw.map((entry, index) => {
          const item = mapProductForDetails(entry, index)
          const dbStock = lowStockMap.get(String(item.id || '').trim())
          return dbStock == null ? item : { ...item, stockLabel: createStockLabel(dbStock) }
        })

        const fromSingle =
          singleResponse.status === 'fulfilled' &&
          singleResponse.value &&
          typeof singleResponse.value === 'object' &&
          !Array.isArray(singleResponse.value) &&
          singleResponse.value.id != null
            ? (() => {
                const item = mapProductForDetails(singleResponse.value, 0)
                const dbStock = lowStockMap.get(String(item.id || '').trim())
                return dbStock == null ? item : { ...item, stockLabel: createStockLabel(dbStock) }
              })()
            : null

        let current =
          fromSingle ||
          mapped.find((item) => String(item.id) === routeId) ||
          mapped.find((item) => encodeURIComponent(String(item.id)) === routeId) ||
          mapped[0] ||
          null

        if (!current) {
          setProduct(null)
          setRecommended([])
          setError('No products available.')
          return
        }

        setProduct(current)
        setRecommended(mapped.filter((item) => item.id !== current.id).slice(0, 10))
      } catch (err) {
        if (!active) return
        setProduct(null)
        setRecommended([])
        setError(err instanceof Error ? err.message : 'Failed to load product details')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProduct()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!product) return
    setSelectedColor(
      product.colors.find((entry) => entry.id === product.defaultColorId)?.id ||
        product.colors[0]?.id ||
        ''
    )
    setSelectedSize(product.defaultSize || '')
    setQuantity(1)
  }, [product])

  const availableSizes = useMemo(() => {
    if (!product) return []
    const matchingColorVariants = product.variantOptions.filter((entry) => {
      if (!selectedColor) return true
      return !entry.colorId || entry.colorId === selectedColor
    })
    const raw = Array.from(
      new Set(
        matchingColorVariants
          .map((entry) => String(entry.sizeLabel || '').trim())
          .filter(Boolean)
      )
    )
    const merged = raw.length > 0 ? raw : product.sizes || []
    return sortSizeLabels(merged)
  }, [product, selectedColor])

  useEffect(() => {
    if (!availableSizes.length) {
      setSelectedSize('')
      return
    }
    if (!selectedSize || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0])
    }
  }, [availableSizes, selectedSize])

  const selectedVariant = useMemo(() => {
    if (!product) return null
    return (
      product.variantOptions.find((entry) => {
        const matchesColor = !selectedColor || !entry.colorId || entry.colorId === selectedColor
        const matchesSize = !selectedSize || !entry.sizeLabel || entry.sizeLabel === selectedSize
        return matchesColor && matchesSize
      }) ||
      product.variantOptions.find((entry) => !selectedColor || !entry.colorId || entry.colorId === selectedColor) ||
      null
    )
  }, [product, selectedColor, selectedSize])

  const selectedColorEntry = useMemo(
    () => (product?.colors || []).find((entry) => entry.id === selectedColor) || null,
    [product, selectedColor]
  )

  const activePrice = selectedVariant?.price ?? product?.price ?? 0
  const activeCompareAt = selectedVariant?.compareAt ?? product?.compareAt ?? 0
  const hasDiscount = Boolean(product && activeCompareAt > activePrice)
  const discountPct =
    hasDiscount && activeCompareAt > 0
      ? Math.round(((activeCompareAt - activePrice) / activeCompareAt) * 100)
      : 0

  const selectedImage = useMemo(() => {
    if (!product) return productImage
    const label = selectedColorEntry?.label
    return (
      pickImageByColor(product.imageOptions || [], selectedColor, label) ||
      product.galleryImages?.[0] ||
      product.images?.[0] ||
      productImage
    )
  }, [product, selectedColor, selectedColorEntry])

  const handleAddToCart = () => {
    if (!product) return
    addCartItem({
      id: `${product.id}:${selectedVariant?.id || selectedColor || 'default'}:${selectedSize || 'default'}`,
      productId: product.id,
      variantId: selectedVariant?.id || product.primaryVariantId,
      categoryId: product.categoryId,
      sku: selectedVariant?.sku || product.sku,
      name: product.title,
      color: selectedColorEntry?.label || 'Cor disponivel',
      size: selectedSize || null,
      selectedOptions: {
        ...(selectedVariant?.attributes || {}),
        color: selectedColorEntry?.label || 'Cor disponivel',
        size: selectedSize || null,
      },
      qty: quantity,
      unitPrice: Number(activePrice || 0),
      image: selectedImage || product.images?.[0] || productImage,
    })
    navigate('/cart')
  }

  return (
    <>
      <Navbar />
      <div className='flex flex-col' data-theme-layout-root='product-details'>
      <section
        className='mb-[8vh] mt-[2vh] min-w-0 px-3 pb-6 sm:mt-[3vh] sm:px-4 md:px-6 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom,0))]'
        data-theme-layout-section='details'
      >
        <div className='mx-auto grid w-full min-w-0 max-w-[1240px] grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10 xl:gap-12'>
          <div className='min-w-0'>
            <div className='grid grid-cols-2 gap-1 sm:gap-1.5 md:gap-2'>
              {[0, 1, 2, 3].map((i) => {
                const gallery = !product
                  ? [productImage]
                  : product.galleryImages?.length
                    ? product.galleryImages
                    : [productImage]
                const url = gallery[i] || null
                return (
                  <div
                    key={i}
                    className='relative aspect-square min-h-0 min-w-0 overflow-hidden bg-[#f5f5f5]'
                  >
                    {i === 0 && hasDiscount && discountPct > 0 ? (
                      <span className='absolute left-2 top-2 z-10 text-[11px] font-semibold text-red-600 sm:left-2.5 sm:top-2.5 sm:text-[12px]'>
                        {discountPct}% off
                      </span>
                    ) : null}
                    {url ? (
                      <img
                        src={url}
                        alt=''
                        className='h-full w-full object-contain sm:object-cover'
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className='min-w-0 lg:pl-0'>
            <p className='text-[11px] uppercase tracking-[0.18em] text-black/50 sm:text-[12px] sm:tracking-[0.2em]'>
              {product?.categoryId ? (
                <Link
                  to={`/products?categoryId=${encodeURIComponent(String(product.categoryId))}&categoryName=${encodeURIComponent(String(product?.category || ''))}`}
                  className='transition hover:text-black'
                >
                  {product?.category || 'Categoria'}
                </Link>
              ) : (
                <span>{product?.category || 'Categoria'}</span>
              )}
            </p>
            <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <h1 className='text-balance text-[1.35rem] font-semibold leading-tight sm:max-w-[75%] sm:text-2xl md:text-[1.75rem]'>
                {product?.title || 'Produto'}
              </h1>
              <div className='flex flex-wrap items-baseline gap-2 text-left sm:justify-end sm:text-right md:flex-col md:items-end'>
                {hasDiscount ? (
                  <p className='text-[1.1rem] leading-none text-black/40 line-through sm:text-[1.15rem]'>
                    {formatPrice(activeCompareAt)}
                  </p>
                ) : null}
                <p className='text-[1.35rem] font-semibold leading-none sm:text-2xl'>{formatPrice(activePrice)}</p>
              </div>
            </div>

            {loading ? <p className='mt-3 text-[12px] text-black/60'>A carregar…</p> : null}
            {error ? <p className='mt-3 text-[12px] text-red-600'>{error}</p> : null}

            <div className='mt-6'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-[12px] font-bold text-black'>Tamanho</span>
                <button type='button' className='shrink-0 text-[11px] text-black/55 underline [touch-action:manipulation]'>
                  Guia de Tamanhos
                </button>
              </div>
              <div className='mt-3 grid grid-cols-4 gap-1.5 text-center text-[12px] sm:grid-cols-6 sm:gap-2 sm:text-[13px]'>
                {availableSizes.length > 0 ? (
                  availableSizes.map((size) => (
                    <button
                      key={size}
                      type='button'
                      onClick={() => setSelectedSize(size)}
                      className={`min-h-10 min-w-0 border py-2 [touch-action:manipulation] sm:min-h-0 ${
                        selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-black/20 bg-white text-black hover:border-black/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  <p className='col-span-full text-left text-[12px] text-black/50'>
                    Sem tamanhos — configure variantes no admin.
                  </p>
                )}
              </div>
            </div>

            {(product?.colors || []).length > 0 ? (
              <div className='mt-6'>
                <span className='text-[12px] font-bold text-black'>Cor</span>
                <div className='mt-3 flex flex-wrap gap-2.5 sm:gap-3'>
                  {(product?.colors || []).map((c) => (
                    <button
                      key={c.id}
                      type='button'
                      onClick={() => setSelectedColor(c.id)}
                      className='group flex flex-col items-center gap-1.5 outline-none [touch-action:manipulation]'
                      aria-label={`Cor ${c.label}`}
                    >
                      {c.thumbUrl ? (
                        <span
                          className={`h-12 w-12 overflow-hidden rounded-sm border bg-white sm:h-14 sm:w-14 ${
                            selectedColor === c.id ? 'ring-2 ring-black ring-offset-2' : 'border-black/20'
                          }`}
                        >
                          <img src={c.thumbUrl} alt='' className='h-full w-full object-cover' />
                        </span>
                      ) : (
                        <span
                          className={`h-8 w-8 rounded-sm border transition ${
                            selectedColor === c.id
                              ? 'ring-2 ring-black ring-offset-2'
                              : c.light
                                ? 'border-black/25'
                                : 'border-black/20'
                          }`}
                          style={{ backgroundColor: c.color }}
                        />
                      )}
                      <span
                        className={`max-w-[4.5rem] truncate text-center text-[10px] sm:max-w-[5rem] sm:text-[11px] ${
                          selectedColor === c.id ? 'font-semibold text-black' : 'text-black/70'
                        }`}
                      >
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className='mt-6 flex max-w-[200px] items-stretch justify-between rounded border border-black/20 sm:max-w-[220px]'>
              <button
                type='button'
                className='min-h-11 min-w-11 text-[1.1rem] [touch-action:manipulation] sm:min-h-0 sm:px-4 sm:py-2'
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <span className='flex min-w-8 items-center justify-center text-[13px] font-medium'>{quantity}</span>
              <button
                type='button'
                className='min-h-11 min-w-11 text-[1.1rem] [touch-action:manipulation] sm:min-h-0 sm:px-4 sm:py-2'
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>

            <button
              className='mt-5 w-full bg-black py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/90 sm:tracking-[0.2em]'
              onClick={handleAddToCart}
              type='button'
            >
              Comprar
            </button>

            <div className='mt-6 space-y-4 text-[12px]'>
              <div className='flex items-start gap-3'>
                <img className='h-8 w-8' src={IconEntrega} alt='Entregas gratis' />
                <div>
                  <p className='font-semibold text-[14px]'>Entregas gratis</p>
                  <p className='text-black/60'>Em encomendas acima de 100 EUR</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <img className='h-8 w-8' src={IconDevolucao} alt='Devolucoes' />
                <div>
                  <p className='font-semibold text-[14px]'>Devolucoes</p>
                  <p className='text-black/60'>Devolucoes simples e rapidas</p>
                </div>
              </div>
            </div>

            <div className='mt-8'>
              <h3 className='text-[13px] font-semibold'>Descricao de Produto</h3>
              <p className='text-[12px] text-black/70 mt-3'>{product?.description || 'Sem descricao.'}</p>
            </div>
          </div>
        </div>

        <div className='mx-auto mt-12 w-full max-w-[1240px] sm:w-[90vw]'>
          <details className='border-t border-black/10 py-4'>
            <summary className='cursor-pointer text-[16px] font-semibold flex items-center justify-between'>
              Descricao
              <span className='text-[14px]'>⌄</span>
            </summary>
          </details>
          <details className='border-t border-black/10 py-4'>
            <summary className='cursor-pointer text-[16px] font-semibold flex items-center justify-between'>
              Detalhes
              <span className='text-[14px]'>⌄</span>
            </summary>
          </details>
          <details className='border-t border-b border-black/10 py-4'>
            <summary className='cursor-pointer text-[16px] font-semibold flex items-center justify-between'>
              Tecnologia
              <span className='text-[14px]'>⌄</span>
            </summary>
          </details>
        </div>
      </section>

      <section className='mx-auto mt-14 w-full max-w-[1240px] px-4 sm:w-[90vw] sm:px-0' data-theme-layout-section='recommended'>
        <h3 className='text-[16px] font-semibold mb-6'>Produtos Recomendados</h3>
        <div>
          <Swiper
            slidesPerView={1}
            spaceBetween={12}
            preventClicks={false}
            preventClicksPropagation={false}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 12 },
              768: { slidesPerView: 3, spaceBetween: 12 },
              1024: { slidesPerView: 5, spaceBetween: 0 },
            }}
            pagination={{ clickable: true }}
            navigation={true}
            modules={[Pagination, Navigation]}
            className='mySwiper'
          >
            {(recommended.length > 0 ? recommended : [mapProductForDetails({}, 0)]).map((item, idx) => (
              <SwiperSlide key={`${item.id}-${idx}`}>
                <ProductCard
                  title={item.title}
                  color={item.cardColor}
                  price={formatPrice(item.price)}
                  oldPrice={item.compareAt > item.price ? formatPrice(item.compareAt) : null}
                  image={item.image}
                  stockLabel={item.stockLabel}
                  to={`/productDetails/${encodeURIComponent(String(item.id || idx))}`}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
      </div>
      <Footer />
    </>
  )
}

export default ProductDetailsPage
