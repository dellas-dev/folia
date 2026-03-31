'use client'

const faqItems = [
  {
    question: 'Who is Folia built for?',
    answer: 'Folia is designed for Etsy sellers, invitation designers, printable creators, and digital product studios that need fresh visual assets quickly.',
  },
  {
    question: 'Do I get transparent PNG outputs?',
    answer: 'Element generations are designed for transparent PNG-style workflows so they can fit into invitations, stickers, and product listings.',
  },
  {
    question: 'Can I generate mockups too?',
    answer: 'Yes. Pro and Business plans include invitation mockup tools so you can turn flat designs into styled listing images.',
  },
  {
    question: 'Is there a free tier?',
    answer: 'No. Folia starts with a paid entry tier to reduce abuse and keep credits focused on serious sellers.',
  },
] as const

export function Faq() {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
      <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">FAQ</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {faqItems.map((item) => (
          <article key={item.question} className="rounded-[1.4rem] border border-border/70 bg-background p-5">
            <h2 className="text-lg font-semibold text-foreground">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
