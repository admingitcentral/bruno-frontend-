import productImage from '../assets/product-card-test-image.png'
import { resolveAssetUrl } from './api'

export const LOW_STOCK_THRESHOLD = 5

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function formatPrice(value) {
  const amount = toNumber(value, 0)
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`
}

export function createStockLabel(stock) {
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

function extractColor(attributes) {
  const source = parseAttributes(attributes)
  const entries = Object.entries(source)
  if (entries.length === 0) return 'Cor disponivel'
  const hit = entries.find(([key]) => ['cor', 'color', 'colour'].includes(String(key).toLowerCase()))
  if (hit) return String(hit[1] || 'Cor disponivel')
  return 'Cor disponivel'
}

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Map API product to ProductCard fields + optional sku for search. */
export function mapProductToCard(product, index) {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const variantOptions = variants.map((variant) => {
    const variantPrice = toNumber(variant?.price ?? product?.base_price, 0)
    const variantCompareAt = toNumber(variant?.compare_at_price, 0)
    const hasDiscount = variantCompareAt > variantPrice && variantCompareAt > 0
    const discountPct = hasDiscount ? Math.round(((variantCompareAt - variantPrice) / variantCompareAt) * 100) : 0
    return {
      variantId: variant?.id ?? null,
      color: extractColor(variant?.attribute_values),
      price: formatPrice(variantPrice),
      oldPrice: hasDiscount ? formatPrice(variantCompareAt) : null,
      discountLabel: hasDiscount ? `${discountPct}% off` : null,
      isActive: variant?.is_active !== false,
    }
  })

  const primaryVariant = variantOptions.find((variant) => variant.isActive) || variantOptions[0] || null

  const imageOptions = Array.isArray(product?.images)
    ? product.images
        .map((image) => ({
          url: resolveAssetUrl(image?.image_url || ''),
          searchText: `${image?.alt_text || ''} ${image?.image_url || ''}`,
        }))
        .filter((item) => Boolean(item.url))
    : []

  const image = imageOptions[0]?.url || productImage
  const sku = String(product?.sku || '').trim()

  return {
    id: product?.id || `api-product-${index}`,
    categoryId: product?.category_id != null ? String(product.category_id) : '',
    categoryName: product?.category_name_pt || product?.category_name_es || 'Sem categoria',
    title: product?.name_pt || product?.name_es || product?.sku || `Produto ${index + 1}`,
    color: primaryVariant?.color || 'Cor disponivel',
    price: primaryVariant?.price || formatPrice(product?.base_price),
    oldPrice: primaryVariant?.oldPrice || null,
    discountLabel: primaryVariant?.discountLabel || null,
    image,
    stockLabel: null,
    variantOptions,
    imageOptions,
    sku,
  }
}

export function productMatchesSearchQuery(card, queryRaw) {
  const q = normalizeText(queryRaw)
  if (!q) return true
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const blob = normalizeText(
    [card.title, card.color, card.categoryName, card.sku, String(card.id || '')].join(' ')
  )
  return words.every((w) => blob.includes(w))
}
