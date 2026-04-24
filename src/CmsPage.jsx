import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import { getJson, resolveAssetUrl } from './lib/api'

function formatHeading(value) {
  return String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeSlug(value) {
  return String(value || '').trim().toLowerCase()
}

function CmsPage() {
  const { slug } = useParams()
  const safeSlug = normalizeSlug(slug)
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        setNotFound(false)

        const result = await getJson(`/api/system/pages/${encodeURIComponent(safeSlug)}`, {
          signal: controller.signal,
        })

        if (!active) return
        setPage(result && typeof result === 'object' ? result : null)
      } catch (loadError) {
        if (!active || loadError?.name === 'AbortError') return

        const message = loadError instanceof Error ? loadError.message : 'Failed to load page.'
        if (message.includes('Page not found')) {
          setPage(null)
          setNotFound(true)
          setError('')
        } else {
          setPage(null)
          setNotFound(false)
          setError(message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    if (!safeSlug) {
      setPage(null)
      setNotFound(true)
      setLoading(false)
      return () => {
        active = false
        controller.abort()
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [safeSlug])

  const sections = useMemo(() => {
    if (!page || typeof page !== 'object') return []

    const items = []
    const sectionTitle = String(page.section_title || '').trim()
    const sectionBody = String(page.section_body || '').trim()
    const formTitle = String(page.form_title || '').trim()
    const formBody = String(page.form_body || '').trim()
    const storesTitle = String(page.stores_title || '').trim()
    const storesBody = String(page.stores_body || '').trim()

    if (sectionTitle || sectionBody) {
      items.push({
        key: 'section',
        title: sectionTitle || 'Detalhes',
        body: sectionBody,
      })
    }

    if (formTitle || formBody) {
      items.push({
        key: 'form',
        title: formTitle || 'Informacao',
        body: formBody,
      })
    }

    if (storesTitle || storesBody) {
      items.push({
        key: 'stores',
        title: storesTitle || 'Lojas',
        body: storesBody,
      })
    }

    return items
  }, [page])

  const socialLinks = useMemo(
    () => (Array.isArray(page?.social_links) ? page.social_links.map((item) => String(item || '').trim()).filter(Boolean) : []),
    [page]
  )

  const contactItems = useMemo(
    () => (Array.isArray(page?.contact_items) ? page.contact_items.map((item) => String(item || '').trim()).filter(Boolean) : []),
    [page]
  )

  const title = String(page?.title || '').trim() || formatHeading(safeSlug)
  const subtitle = String(page?.subtitle || '').trim()
  const heroImageUrl = resolveAssetUrl(page?.hero_image_url || '')

  return (
    <>
      <Navbar />
      <main className='min-h-[70vh] bg-[#f6f1eb] py-12' data-theme-layout-root='cms-page'>
        <div className='mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12'>
          {loading ? <p className='text-sm text-black/60'>A carregar pagina...</p> : null}
          {!loading && error ? <p className='text-sm text-[#b42318]'>{error}</p> : null}

          {!loading && notFound ? (
            <section className='rounded-[32px] bg-white px-8 py-12 text-center shadow-sm'>
              <h1 className='mt-4 text-4xl text-[#2a1b14]'>{formatHeading(safeSlug)}</h1>
              <p className='mx-auto mt-4 max-w-[560px] text-[15px] leading-7 text-black/70'>
                Esta pagina ainda nao existe no CMS ou foi removida.
              </p>
              <Link
                to='/'
                className='mt-8 inline-flex rounded-full bg-[#2a1b14] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#412920]'
              >
                Voltar ao inicio
              </Link>
            </section>
          ) : null}

          {!loading && !error && !notFound && page ? (
            <div className='space-y-10'>
              {heroImageUrl ? (
                <section className='overflow-hidden rounded-[32px] bg-white shadow-sm' data-theme-layout-section='hero-image'>
                  <img src={heroImageUrl} alt={title} className='h-[260px] w-full object-cover sm:h-[360px] lg:h-[460px]' />
                </section>
              ) : null}

              <section
                className='grid gap-8 rounded-[32px] bg-white px-8 py-10 shadow-sm sm:px-12 sm:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]'
                data-theme-layout-section='intro'
              >
                <div>
                  <h1 className='text-4xl text-[#2a1b14] sm:text-5xl lg:text-6xl'>{title}</h1>
                  {subtitle ? <p className='mt-5 max-w-[760px] text-[16px] leading-8 text-black/72'>{subtitle}</p> : null}
                </div>

                {(socialLinks.length > 0 || contactItems.length > 0) ? (
                  <aside className='grid gap-5 self-start rounded-[28px] bg-[#fcf6ef] p-6'>
                    {socialLinks.length > 0 ? (
                      <div>
                        <h2 className='text-sm uppercase tracking-[0.24em] text-black/45'>Redes Sociais</h2>
                        <div className='mt-4 flex flex-wrap gap-3'>
                          {socialLinks.map((item) => (
                            <span key={item} className='rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/72'>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {contactItems.length > 0 ? (
                      <div>
                        <h2 className='text-sm uppercase tracking-[0.24em] text-black/45'>Contactos</h2>
                        <div className='mt-4 grid gap-3'>
                          {contactItems.map((item) => (
                            <p key={item} className='rounded-2xl border border-black/10 bg-white px-4 py-4 text-[15px] text-black/72'>
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </aside>
                ) : null}
              </section>

              {sections.length > 0 ? (
                <section className='grid gap-6 lg:grid-cols-3' data-theme-layout-section='content'>
                  {sections.map((section, index) => (
                    <article
                      key={section.key}
                      className={`${index === 0 ? 'lg:col-span-2' : ''} rounded-[32px] bg-[#fffaf5] px-8 py-10 shadow-sm`}
                    >
                      <h2 className='text-2xl text-[#2a1b14]'>{section.title}</h2>
                      {section.body ? (
                        <p className='mt-4 whitespace-pre-line text-[15px] leading-7 text-black/72'>{section.body}</p>
                      ) : (
                        <p className='mt-4 text-[15px] leading-7 text-black/50'>Sem conteudo adicional nesta secao.</p>
                      )}
                    </article>
                  ))}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default CmsPage
