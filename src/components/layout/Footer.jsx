import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const formBtnTeal = 'bg-[#6B8E8E]'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-8 w-full min-w-0 max-w-[100%] overflow-x-clip bg-black text-white sm:mt-[10vh]">
      <div
        className="mx-auto box-border flex w-full min-w-0 max-w-[1400px] flex-col justify-between gap-6 px-3 pb-8 pt-10 sm:px-5 sm:pb-10 md:px-8 md:pt-10 lg:min-h-0 lg:px-[72px] xl:px-[72px] lg:pb-6 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom,0))] min-[1100px]:min-h-[348px]"
      >
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-8 md:gap-6 lg:grid-cols-4 lg:gap-8">
          <div>
            <h4 className="mb-3 text-[15px] font-semibold">Menu</h4>
            <ul className="space-y-2 text-[14px] leading-relaxed text-white/90">
              <li>
                <Link to="/products" className="hover:underline">
                  Loja
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="hover:underline">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:underline">
                  Contactos
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:underline">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[15px] font-semibold">Precisa de ajuda?</h4>
            <ul className="space-y-2 text-[14px] leading-relaxed text-white/90">
              <li>
                <Link to="/contact" className="hover:underline">
                  Apoio ao Cliente
                </Link>
              </li>
              <li>
                <span className="cursor-default">Trocas e devoluções</span>
              </li>
              <li>
                <span className="cursor-default">FAQs</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[15px] font-semibold">Contactos</h4>
            <ul className="space-y-1.5 text-[14px] leading-relaxed text-white/90">
              <li>R. Baptista Lopes 16,</li>
              <li>8000-225 Faro</li>
              <li>Rua Ilha dos Amores 30 C</li>
              <li>1990-118 Lisboa</li>
              <li>Rua D. João I 767, 4450-166</li>
              <li>Matosinhos</li>
              <li>(+351) 916 171 577</li>
              <li>
                <a href="mailto:geral@anadias.run" className="hover:underline">
                  geral@anadias.run
                </a>
              </li>
            </ul>
          </div>

          {/* Figma: title, subline + form are left-aligned in one column; input + teal button are one flush bar */}
          <div className="flex min-w-0 flex-col items-stretch text-left">
            <h4 className="mb-2 text-[15px] font-semibold leading-snug tracking-normal text-white">
              Subscreva a nossa newsletter!
            </h4>
            <p className="mb-4 text-[13px] font-normal leading-relaxed text-white/95">
              Receba todas as novidades anadias.run!
            </p>
            <form className="w-full" onSubmit={(e) => e.preventDefault()} noValidate>
              <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-none border-0 shadow-none min-[400px]:flex-row min-[400px]:items-stretch">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="h-12 min-h-12 min-w-0 w-full border-0 bg-white px-3 text-left text-sm text-neutral-900 placeholder:text-[#9CA3AF] outline-none ring-0 focus:ring-0 min-[400px]:flex-1 min-[400px]:px-4 min-[400px]:text-[14px]"
                  autoComplete="email"
                  aria-label="Email para newsletter"
                />
                <button
                  type="submit"
                  className={`${formBtnTeal} flex h-12 w-full shrink-0 items-center justify-center text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-[400px]:w-12 min-[400px]:min-w-[3rem]`}
                  aria-label="Subscrever newsletter"
                >
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-auto grid w-full min-w-0 grid-cols-[1fr_auto] items-start gap-x-2 gap-y-1 pt-5 pb-2 text-[8px] leading-tight text-white/70 sm:items-center sm:gap-x-4 sm:pb-0 sm:pt-4 sm:text-[11px] sm:leading-normal">
          <p className="m-0 min-w-0 [overflow-wrap:anywhere] pr-1 text-left sm:pr-2">
            Ana Dias © {year} · Desenvolvido por adn Tech
          </p>
          <div className="flex min-w-0 flex-row flex-nowrap items-start justify-end gap-x-2 text-right sm:items-center sm:gap-4">
            <a href="#privacidade" className="whitespace-nowrap hover:text-white">
              Política de Privacidade
            </a>
            <a href="#termos" className="whitespace-nowrap hover:text-white">
              Termos e Condições
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
