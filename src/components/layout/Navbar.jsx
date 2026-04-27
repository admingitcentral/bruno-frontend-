import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/Logo.png'
import { Search, User, ShoppingCart, Menu, X, ChevronRight, ChevronDown } from 'lucide-react'
import { cartEvents, getCartCount } from '../../lib/cart'
import { getJson, resolveAssetUrl } from '../../lib/api'
import { THEME_UPDATED_EVENT } from '../../lib/theme'
import { MEGA_MENU_ITEMS, MEGA_TOP_BAR, getSubMenuFor } from '../../data/megaMenuData.js'

const headingMega =
  'text-[10px] font-semibold uppercase leading-normal tracking-[0.2em] text-[#6b6b6b]'

function linkClassNameMega(emphasis, uppercase) {
  if (uppercase) {
    return 'text-[12px] font-semibold leading-snug tracking-[0.08em] text-black uppercase transition hover:opacity-80 sm:text-[13px]'
  }
  if (emphasis) {
    return 'text-[16px] font-semibold leading-snug text-black transition hover:underline'
  }
  return 'text-[15px] leading-relaxed text-black transition hover:underline'
}

function BrandLogoRow({ brandLogos, onLinkNavigate }) {
  if (!Array.isArray(brandLogos) || brandLogos.length === 0) return null
  return (
    <div className="border-t border-black/5 bg-white px-2 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[4.5rem] max-w-[1380px] min-w-0 flex-nowrap items-center justify-center gap-x-6 overflow-x-auto overscroll-x-contain scroll-smooth py-1 sm:gap-x-8 sm:min-h-[5rem] md:min-h-0 md:justify-between md:overflow-visible md:px-0 lg:gap-x-8 [scrollbar-width:thin]">
        {brandLogos.map((b) => (
          <Link
            key={b.alt + b.to}
            to={b.to}
            onClick={onLinkNavigate}
            className="flex h-10 min-w-0 max-w-[5.5rem] shrink-0 items-center justify-center sm:h-12 sm:max-w-[6.5rem] md:max-w-[7rem] lg:max-w-[7.5rem]"
          >
            <img
              src={b.image}
              alt={b.alt}
              className="max-h-8 w-auto max-w-full object-contain opacity-90 transition hover:opacity-100 sm:max-h-9 md:max-h-10"
              loading="lazy"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}

function MegaMenuPanel({ item, onLinkNavigate }) {
  if (!item) return null
  const sm = getSubMenuFor(item)
  if (sm.panelType === 'brandLogos' && item.brandLogos?.length) {
    return <BrandLogoRow brandLogos={item.brandLogos} onLinkNavigate={onLinkNavigate} />
  }
  if (!item.columns?.length) return null
  const isOverlay = sm.promoStyle === 'overlay'
  const overlayBottomLeft = sm.promoOverlayAlign === 'bottom-left'
  const singleOverlayPromo = isOverlay && item.promos?.length === 1
  /** No desktop, 3 colunas + 1 imagem: metade / metade (Figma) em vez de 7+5. */
  const useWideTextPromoSplit = sm.textGrid === 3 && singleOverlayPromo
  const textLgSpan = useWideTextPromoSplit ? 'lg:col-span-6' : 'lg:col-span-7'
  const promoLgSpan = useWideTextPromoSplit ? 'lg:col-span-6' : 'lg:col-span-5'

  const textColClass =
    sm.textGrid === 3
      ? `grid min-w-0 grid-cols-1 gap-6 gap-y-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 ${textLgSpan}`
      : sm.textGrid === 1
        ? `grid min-w-0 grid-cols-1 gap-8 ${textLgSpan}`
        : `grid min-w-0 grid-cols-1 gap-8 sm:grid-cols-2 ${textLgSpan}`

  const listGapClass =
    sm.listDensity === 'compact'
      ? 'mt-3 flex flex-col gap-1.5 pl-0 sm:gap-2'
      : 'mt-3 flex flex-col gap-2.5 pl-0'

  const panelBgClass = sm.panelBg === 'muted' ? 'bg-[#fafafa]' : 'bg-white'

  return (
    <div
      className={`grid gap-6 border-t border-black/5 py-6 pb-8 sm:py-8 sm:pb-9 lg:grid-cols-12 lg:items-start lg:gap-7 xl:gap-8 ${panelBgClass}`}
    >
      <div className={textColClass}>
        {item.columns.map((col) => (
          <div key={col.heading} className="min-w-0 text-left">
            <h3 className={headingMega}>{col.heading}</h3>
            <ul className={listGapClass}>
              {col.links.map((l) => {
                const useUpper = col.linkStyle === 'uppercase' || l.uppercase
                return (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      onClick={onLinkNavigate}
                      className={linkClassNameMega(l.emphasis, useUpper)}
                    >
                      {l.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      {item.promos && item.promos.length > 0 ? (
        <div
          className={
            singleOverlayPromo
              ? `min-w-0 self-start lg:row-span-1 ${promoLgSpan}`
              : `min-w-0 ${promoLgSpan}`
          }
        >
          <div
            className={
              isOverlay
                ? singleOverlayPromo
                  ? 'grid min-w-0 grid-cols-1'
                  : 'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'
                : 'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3'
            }
          >
            {item.promos.map((promo) =>
              isOverlay ? (
                <Link
                  key={promo.title + promo.to}
                  to={promo.to}
                  onClick={onLinkNavigate}
                  className="group relative block w-full min-w-0 overflow-hidden rounded-md border border-black/[0.08] shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className={
                      singleOverlayPromo
                        ? 'relative aspect-[16/10] w-full min-h-[200px] max-h-[min(100%,26rem)] sm:aspect-[16/9] sm:min-h-[220px] lg:min-h-[260px] lg:max-h-[min(420px,55vh)]'
                        : 'relative aspect-[3/4] w-full min-h-[180px] max-h-[min(100%,22rem)] sm:min-h-[220px]'
                    }
                  >
                    <img
                      src={promo.image}
                      alt={promo.imageAlt || ''}
                      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                      aria-hidden
                    />
                    {overlayBottomLeft ? (
                      <div className="absolute bottom-0 left-0 flex items-center gap-1.5 p-3.5 sm:p-4 sm:pl-4">
                        <span className="text-[15px] font-medium leading-tight text-white drop-shadow">
                          {promo.title}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-white"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-4">
                        <span className="text-[15px] font-medium leading-tight text-white drop-shadow-sm">
                          {promo.title}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-white"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>
                </Link>
              ) : (
                <Link
                  key={promo.title + promo.to}
                  to={promo.to}
                  onClick={onLinkNavigate}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-sm border border-black/[0.08] bg-white text-left shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full min-h-[100px] overflow-hidden sm:min-h-[120px]">
                    <img
                      src={promo.image}
                      alt={promo.imageAlt || ''}
                      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-black/10 bg-white px-3.5 py-2.5 text-[13px] font-medium text-black sm:px-4 sm:py-3 sm:text-sm">
                    <span className="min-w-0 leading-tight">{promo.title}</span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-black/70"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [logoSrc, setLogoSrc] = useState(logo)
  const [megaOpenId, setMegaOpenId] = useState(null)
  const leaveTimer = useRef(null)
  const navDesktopRef = useRef(null)

  const clearCloseTimer = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    leaveTimer.current = setTimeout(() => {
      setMegaOpenId(null)
    }, 160)
  }, [clearCloseTimer])

  useEffect(() => {
    const syncCartCount = () => setCartCount(getCartCount())
    syncCartCount()
    window.addEventListener('storage', syncCartCount)
    window.addEventListener(cartEvents.updated, syncCartCount)
    return () => {
      window.removeEventListener('storage', syncCartCount)
      window.removeEventListener(cartEvents.updated, syncCartCount)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMegaOpenId(null)
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const applyLogo = (settings) => {
      const resolved = resolveAssetUrl(settings?.public_logo_url || '')
      setLogoSrc(resolved || logo)
    }

    const loadTheme = async () => {
      try {
        const settings = await getJson('/api/system/theme', { signal: controller.signal })
        if (!active) return
        applyLogo(settings)
      } catch (error) {
        if (!active || error?.name === 'AbortError') return
      }
    }

    const onThemeUpdated = (event) => {
      const payload = event?.detail?.settings ?? event?.detail ?? null
      if (!payload) return
      applyLogo(payload)
    }

    void loadTheme()
    window.addEventListener(THEME_UPDATED_EVENT, onThemeUpdated)
    return () => {
      active = false
      controller.abort()
      window.removeEventListener(THEME_UPDATED_EVENT, onThemeUpdated)
    }
  }, [])

  const closeMobile = () => setOpen(false)
  const closeMega = () => setMegaOpenId(null)
  const openItem = (id) => {
    clearCloseTimer()
    setMegaOpenId(id)
  }

  const openMega = MEGA_MENU_ITEMS.find((e) => e.id === megaOpenId) || null

  return (
    <header className="relative z-50 w-full min-w-0 max-w-[100%]">
      <nav className="w-full min-w-0" ref={navDesktopRef}>
        <Link
          to={MEGA_TOP_BAR.linkTo}
          className="block w-full min-w-0 border-b border-black/10 bg-black py-2 text-center text-[11px] font-medium leading-snug tracking-wide text-white sm:text-xs"
        >
          {MEGA_TOP_BAR.line}
        </Link>

        <div className="mx-auto flex w-full min-w-0 max-w-[1380px] items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:px-8 lg:px-12">
          <div className="hidden min-w-0 flex-1 items-center gap-6 text-[14px] text-black/90 md:flex">
            <Link to="/about-us" className="whitespace-nowrap transition hover:opacity-70">
              Sobre nós
            </Link>
            <Link to="/blog" className="whitespace-nowrap transition hover:opacity-70">
              Blog
            </Link>
            <Link to="/contact" className="whitespace-nowrap transition hover:opacity-70">
              Contactos
            </Link>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center md:flex-none">
            <Link to="/" aria-label="Página inicial" className="flex items-center justify-center">
              <img
                src={logoSrc}
                alt="ANADIAS.run"
                className="h-8 w-auto max-w-full object-contain md:h-10"
                data-theme-image="public_logo_url"
                data-theme-image-label="Logo"
                onError={() => setLogoSrc(logo)}
              />
            </Link>
          </div>
          <div className="hidden flex-1 items-center justify-end gap-1 sm:gap-3 md:flex">
            <Link to="/search" className="p-1.5 text-current sm:p-2" aria-label="Pesquisa">
              <Search className="h-5 w-5" />
            </Link>
            <Link to="/contact" className="p-1.5 text-current sm:p-2" aria-label="Conta">
              <User className="h-5 w-5" />
            </Link>
            <Link to="/cart" className="relative p-1.5 sm:p-2" aria-label="Carrinho de compras">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 md:hidden">
            <Link to="/cart" className="relative p-1.5" aria-label="Carrinho de compras">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 sm:p-2"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Desktop mega menu */}
        <div
          className="relative hidden w-full min-w-0 border-t border-black/10 bg-white md:block"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <ul className="mx-auto flex w-full min-w-0 max-w-[1380px] list-none flex-nowrap items-center justify-center gap-x-0.5 overflow-x-auto overscroll-x-contain scroll-smooth px-2 py-0 sm:gap-x-1.5 sm:px-4 md:gap-x-2 md:px-6 md:pb-0 md:pt-0 lg:gap-x-2.5 lg:px-8 xl:px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MEGA_MENU_ITEMS.map((item) => {
              const isActive = megaOpenId === item.id
              return (
                <li
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => openItem(item.id)}
                >
                  <Link
                    to={item.to}
                    className={`block whitespace-nowrap px-1.5 py-4 text-[14px] leading-tight sm:px-2 md:text-[15px] ${
                      item.isSale ? 'text-[#b42318] hover:opacity-80' : 'text-black hover:opacity-70'
                    } ${
                      isActive
                        ? item.isSale
                          ? 'text-[#b42318] underline decoration-[#b42318]/35 underline-offset-4'
                          : 'font-medium text-black underline decoration-black/25 underline-offset-[6px]'
                        : ''
                    } `}
                    aria-expanded={isActive}
                    aria-controls={isActive ? `mega-panel-${item.id}` : undefined}
                    id={`mega-nav-${item.id}`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {openMega && (
            <div
              id={`mega-panel-${openMega.id}`}
              key={openMega.id}
              className="absolute left-0 right-0 top-full z-40 min-w-0 border-t border-black/5 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
              role="region"
              aria-labelledby={`mega-nav-${openMega.id}`}
              aria-label={`Submenu: ${openMega.label}`}
            >
              <div className="mx-auto w-full min-w-0 max-w-[1380px] px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
                <MegaMenuPanel
                  key={openMega.id}
                  item={openMega}
                  onLinkNavigate={() => {
                    closeMega()
                    clearCloseTimer()
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile full menu */}
        {open && (
          <div className="max-h-[min(80vh,32rem)] overflow-y-auto border-t border-black/10 bg-white shadow-inner md:hidden">
            <div className="space-y-1 px-3 py-3">
              <div className="flex items-center justify-end gap-2 border-b border-black/5 pb-3">
                <Link to="/search" onClick={closeMobile} className="p-2" aria-label="Pesquisa">
                  <Search className="h-5 w-5" />
                </Link>
                <Link to="/contact" className="p-2" aria-label="Conta" onClick={closeMobile}>
                  <User className="h-5 w-5" />
                </Link>
              </div>
              <div className="flex flex-col gap-2 border-b border-black/5 py-2 text-[15px]">
                <Link to="/about-us" onClick={closeMobile} className="py-1">
                  Sobre nós
                </Link>
                <Link to="/blog" onClick={closeMobile} className="py-1">
                  Blog
                </Link>
                <Link to="/contact" onClick={closeMobile} className="py-1">
                  Contactos
                </Link>
              </div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b]">
                Loja
              </div>
              {MEGA_MENU_ITEMS.map((item) => (
                <details key={item.id} className="group border-b border-black/5 last:border-0">
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between py-2.5 pl-0 pr-0 text-left text-[15px] font-medium text-current marker:hidden [&::-webkit-details-marker]:hidden"
                    style={{ listStyle: 'none' }}
                  >
                    {item.isSale ? (
                      <span className="text-[#b42318]">{item.label}</span>
                    ) : (
                      <span className="text-black">{item.label}</span>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 text-black/35 transition group-open:rotate-180" />
                  </summary>
                  <div className="space-y-4 pb-4 pl-0 pr-0 pt-0">
                    {getSubMenuFor(item).panelType === 'brandLogos' && item.brandLogos ? (
                      <div className="flex flex-wrap items-center justify-center gap-4 py-1">
                        {item.brandLogos.map((b) => (
                          <Link
                            key={b.alt + b.to}
                            to={b.to}
                            onClick={closeMobile}
                            className="inline-flex h-9 max-w-[4.5rem] items-center justify-center"
                          >
                            <img
                              src={b.image}
                              alt={b.alt}
                              className="max-h-7 w-auto max-w-full object-contain"
                              loading="lazy"
                            />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      (item.columns || []).map((col) => (
                        <div key={col.heading} className="pl-0">
                          <h4 className={headingMega + ' pl-0'}>{col.heading}</h4>
                          <ul className="mt-2 flex flex-col gap-1.5">
                            {col.links.map((l) => {
                              const useUpper = col.linkStyle === 'uppercase' || l.uppercase
                              return (
                                <li key={l.to + l.label}>
                                  <Link
                                    to={l.to}
                                    onClick={closeMobile}
                                    className={
                                      useUpper
                                        ? 'text-[12px] font-semibold uppercase tracking-wide text-black/90 hover:opacity-80'
                                        : l.emphasis
                                          ? 'text-[15px] font-semibold text-black hover:underline'
                                          : 'text-[14px] text-black/90 hover:underline'
                                    }
                                  >
                                    {l.label}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))
                    )}
                    {item.promos && item.promos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {item.promos.map((p) =>
                          getSubMenuFor(item).promoStyle === 'overlay' ? (
                            <Link
                              key={p.to + p.title}
                              to={p.to}
                              onClick={closeMobile}
                              className="relative h-32 w-full overflow-hidden rounded border border-black/5"
                            >
                              <img
                                src={p.image}
                                alt={p.imageAlt || ''}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              <div
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
                                aria-hidden
                              />
                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2.5 pr-2 text-[13px] font-medium text-white">
                                <span className="line-clamp-1">{p.title}</span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white" />
                              </div>
                            </Link>
                          ) : (
                            <Link
                              key={p.to + p.title}
                              to={p.to}
                              onClick={closeMobile}
                              className="flex overflow-hidden rounded border border-black/5"
                            >
                              <img
                                src={p.image}
                                alt={p.imageAlt || ''}
                                className="h-20 w-24 shrink-0 object-cover"
                                loading="lazy"
                              />
                              <div className="flex min-w-0 flex-1 items-center justify-between gap-1 border-l border-black/5 bg-white px-3 text-[12px] text-black">
                                <span className="line-clamp-2">{p.title}</span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-black/60" />
                              </div>
                            </Link>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
