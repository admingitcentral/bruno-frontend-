import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProductCard from './components/ui/ProductCard'
import productImage from './assets/product-card-test-image.png'
import { getJson } from './lib/api'
import {
  mapProductToCard,
  createStockLabel,
  productMatchesSearchQuery,
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
    sku: 'ADV-BOS-13',
    oldPrice: '188.00 EUR',
    discountLabel: '30% off',
    image: productImage,
    stockLabel: null,
  },
  {
    id: 'fallback-2',
    categoryId: 'fallback-category',
    categoryName: 'Produtos',
    title: 'Adidas Adizero Takumi SEN 10 W',
    color: 'Azul',
    price: '135.00 EUR',
    sku: 'ADV-TKM-10',
    image: productImage,
    stockLabel: null,
  },
  {
    id: 'fallback-3',
    categoryId: 'fallback-category',
    categoryName: 'Produtos',
    title: 'Adizero Adios Pro 4 W',
    color: 'Branco e Laranja',
    price: '97.00 EUR',
    sku: 'ADI-PRO-4',
    image: productImage,
    stockLabel: null,
  },
]

const sectionShell = 'mx-auto w-full min-w-0 max-w-[1380px] px-3 sm:px-4 md:px-8 lg:px-12'

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = String(searchParams.get('q') ?? '')
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [productsResponse, stockSummaryResponse] = await Promise.allSettled([
          getJson('/api/products'),
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

        const mapped =
          productsResponse.status === 'fulfilled' && Array.isArray(productsResponse.value)
            ? productsResponse.value.map((product, index) => {
                const card = mapProductToCard(product, index)
                const dbStock = lowStockMap.get(String(card.id || '').trim())
                return dbStock == null ? card : { ...card, stockLabel: createStockLabel(dbStock) }
              })
            : []

        setProducts(mapped)
        setError('')
      } catch (err) {
        if (!active) return
        setProducts([])
        setError(err instanceof Error ? err.message : 'Falha ao carregar produtos')
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const base = products.length > 0 ? products : fallbackProducts

  const filtered = useMemo(() => {
    if (!String(query).trim()) return base
    return base.filter((p) => productMatchesSearchQuery(p, query))
  }, [base, query])

  const count = filtered.length

  const setQuery = (next) => {
    const v = String(next)
    if (!v.trim()) {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ q: v }, { replace: true })
    }
  }

  const clearSearch = () => {
    setSearchParams({}, { replace: true })
    inputRef.current?.focus()
  }

  return (
    <>
      <Navbar />
      <main className='min-h-[50vh] bg-white pb-12 pt-3 md:pt-4'>
        <div className={sectionShell}>
          <div className='flex min-h-[3rem] items-center gap-3 border-b border-black/15 py-2 md:min-h-[3.25rem]'>
            <Search className='h-5 w-5 shrink-0 text-black/55' aria-hidden />
            <input
              ref={inputRef}
              type='search'
              name='q'
              autoComplete='off'
              enterKeyHint='search'
              placeholder='Pesquisar produtos…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='min-h-11 min-w-0 flex-1 border-0 bg-transparent py-2 text-[15px] leading-normal text-black outline-none placeholder:text-black/35 focus:ring-0 md:text-[16px]'
              aria-label='Pesquisar produtos'
            />
            {query ? (
              <button
                type='button'
                onClick={clearSearch}
                className='inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm text-black/60 transition hover:bg-black/[0.04] hover:text-black'
                aria-label='Limpar pesquisa'
              >
                <X className='h-5 w-5' />
              </button>
            ) : null}
          </div>

          <div className='mt-4 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-black/70 md:mt-3 md:text-[14px]'>
            <p className='m-0'>
              <span className='font-medium text-black'>{count}</span>{' '}
              {count === 1 ? 'resultado' : 'resultados'}
            </p>
            <Link
              to='/products'
              className='font-medium text-black underline underline-offset-4 transition hover:opacity-70'
            >
              Ver tudo
            </Link>
          </div>

          {error ? (
            <p className='mt-4 text-[13px] text-amber-800'>Aviso: {error} (a mostrar dados de exemplo.)</p>
          ) : null}

          <div className='mt-8 md:mt-6'>
            {!String(query).trim() ? (
              <p className='mb-6 text-center text-[13px] text-black/50 md:mb-5'>
                Catálogo completo. Use a pesquisa para filtrar por nome, cor, categoria ou SKU.
              </p>
            ) : null}
            {String(query).trim() && count === 0 ? (
              <p className='text-center text-[14px] text-black/55'>
                Nenhum produto corresponde à sua pesquisa. Tente outras palavras-chave.
              </p>
            ) : (
              <div className='grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8'>
                {filtered.map((product, index) => (
                  <ProductCard
                    key={`${product.id}-${index}`}
                    image={product.image}
                    title={product.title}
                    color={product.color}
                    price={product.price}
                    oldPrice={product.oldPrice}
                    discountLabel={product.discountLabel}
                    stockLabel={product.stockLabel}
                    to={`/productDetails/${encodeURIComponent(String(product.id || index))}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default SearchPage
