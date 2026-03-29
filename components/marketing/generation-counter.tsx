import { createServerClient } from '@/lib/supabase/server'

export async function GenerationCounter() {
  const supabase = createServerClient()
  const { data } = await supabase.from('generation_counter').select('total_count').eq('id', 1).maybeSingle()

  const totalCount = data?.total_count ?? 0

  return (
    <section className="rounded-[1.8rem] border border-border/70 bg-card/90 p-8 text-center shadow-sm shadow-black/5">
      <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Community momentum</p>
      <h2 className="mt-3 text-5xl font-semibold text-foreground">{new Intl.NumberFormat('en-US').format(totalCount)}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">elements and mockups generated through Folia so far.</p>
    </section>
  )
}
