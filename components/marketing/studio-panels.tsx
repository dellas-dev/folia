'use client'

import Image from 'next/image'
import { Box, Eraser, Sparkles, Users } from 'lucide-react'

export function StudioPanels() {
  return (
    <section className="grid gap-5 lg:grid-cols-12">
      <article className="lg:col-span-7 rounded-[2.4rem] p-8 lg:p-10" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}>
            <Sparkles className="size-5" />
          </span>
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: '#1d3a3f', color: 'rgba(255,255,255,0.85)' }}>
            Element Generator
          </span>
        </div>

        <h3 className="mt-7 text-4xl font-semibold leading-tight" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
          Generate high-fidelity isolated botanical assets using AI.
        </h3>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm leading-8" style={{ color: '#70787a' }}>
              Choose from multiple style directions including Watercolor, Line Art, and Boho. Perfect for invitation suites and sticker sheets.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Watercolor', 'Line Art', 'Boho'].map((style) => (
                <span key={style} className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: '#f4f3f3', color: '#70787a' }}>
                  {style}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] p-4" style={{ backgroundColor: '#f4f3f3' }}>
            <div className="relative h-52 overflow-hidden rounded-[1rem]">
              <Image
                src="/samples/watercolor.jpg"
                alt="Watercolor clipart"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            </div>
          </div>
        </div>
      </article>

      <article className="lg:col-span-5 rounded-[2.4rem] p-8 lg:p-10" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}>
            <Box className="size-5" />
          </span>
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: '#1d3a3f', color: 'rgba(255,255,255,0.85)' }}>
            Mockup Generator
          </span>
        </div>

        <h3 className="mt-7 text-3xl font-semibold leading-tight" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
          Place your assets into real-world scenes.
        </h3>
        <p className="mt-5 text-sm leading-8" style={{ color: '#70787a' }}>
          Instantly create professional product photography for your digital items.
        </p>

        <div className="relative mt-8 h-56 overflow-hidden rounded-[1.4rem]">
          <Image
            src="/samples/boho.jpg"
            alt="Mockup scene"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 360px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-[0.16em] text-white/90">
            Boho Wedding Scene
          </span>
        </div>
      </article>

      <article className="lg:col-span-5 rounded-[2.4rem] p-8 lg:p-10" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}>
            <Eraser className="size-5" />
          </span>
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: '#1d3a3f', color: 'rgba(255,255,255,0.85)' }}>
            Remove BG
          </span>
        </div>

        <h3 className="mt-7 text-3xl font-semibold leading-tight" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
          One-click background removal.
        </h3>
        <p className="mt-5 text-sm leading-8" style={{ color: '#70787a' }}>
          Clean up your assets instantly. Perfect for creating transparent PNGs for your shop.
        </p>

        <div className="mt-8 flex h-36 items-center justify-center rounded-[1.6rem]" style={{ backgroundColor: '#f4f3f3' }}>
          <Eraser className="size-9" style={{ color: '#c0c8c9' }} />
        </div>
      </article>

      <article className="lg:col-span-7 rounded-[2.4rem] p-8 lg:p-10" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }}>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}>
            <Users className="size-5" />
          </span>
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: '#1d3a3f', color: 'rgba(255,255,255,0.85)' }}>
            Community Gallery
          </span>
        </div>

        <h3 className="mt-7 text-4xl font-semibold leading-tight" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
          Remix and share with the creator community.
        </h3>

        <div className="mt-8 flex -space-x-4">
          {[21, 22, 23, 24, 25].map((id) => (
            <img
              key={id}
              src={`https://i.pravatar.cc/100?img=${id}`}
              className="size-12 rounded-full border-4 border-white object-cover shadow-sm"
              alt="Community member"
              referrerPolicy="no-referrer"
            />
          ))}
          <div className="flex size-12 items-center justify-center rounded-full border-4 border-white text-xs font-bold shadow-sm" style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}>
            +500
          </div>
        </div>

        <p className="mt-8 max-w-md text-sm leading-8" style={{ color: '#70787a' }}>
          Join thousands of creators sharing their assets. Remix existing prompts to find your unique style.
        </p>
      </article>
    </section>
  )
}
