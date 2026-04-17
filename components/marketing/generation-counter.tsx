import { createServerClient } from '@/lib/supabase/server'

export async function GenerationCounter() {
  const supabase = createServerClient()
  const { data } = await supabase.from('generation_counter').select('total_count').eq('id', 1).maybeSingle()

  const totalCount = data?.total_count ?? 0

  return (
    <section className="rounded-[2rem] p-8 text-center" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
      <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>Community momentum</p>
      <h2 className="brand-display mt-3 text-5xl font-semibold sm:text-6xl" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{new Intl.NumberFormat('en-US').format(totalCount)}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7" style={{ color: '#70787a' }}>elements and mockups generated through Folia so far.</p>
    </section>
  )
}
