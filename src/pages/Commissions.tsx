import Meta from '@/components/Meta'
import VendingMachine from '@/components/VendingMachine'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, useState } from 'react'

// ----- Services list -----
const SERVICES = [
    {
        id: 'full-production',
        icon: '🎧',
        title: 'Full Production',
        description: 'Bring a melody, a lyric, or even just a vibe. Leave with a finished song — recorded, mixed, and ready to share.'
    },
    {
        id: 'mixing',
        icon: '🎚️',
        title: 'Mixing',
        description: 'Your recording, balanced and clear. Every instrument in its place, with space and energy that feels alive.'
    },
    {
        id: 'mastering',
        icon: '🔊',
        title: 'Mastering',
        description: 'The final polish. Loudness, clarity, and translation across every speaker from earbuds to car systems.'
    },
    {
        id: 'composition',
        icon: '🎼',
        title: 'Composition',
        description: 'Original melodies and chord progressions, written from scratch to fit your mood, genre, or concept.'
    },
    {
        id: 'arrangement',
        icon: '🎹',
        title: 'Arrangement',
        description: 'Turn a voice memo, acapella, or rough demo into a full track with drums, bass, keys, and strings.'
    },
    {
        id: 'instrumental',
        icon: '🎵',
        title: 'Instrumental / Karaoke Versions',
        description: 'A clean backing track for your vocals — either stripped from a full song or built from scratch.'
    },
    {
        id: 'lyrics',
        icon: '✍️',
        title: 'Lyric Co-writing',
        description: "Stuck on a verse or chorus? Let's find the right words together, in Japanese or English."
    },
    {
        id: 'bgm',
        icon: '🎮',
        title: 'BGM & Sound Design',
        description: 'Music for games, videos, streams, podcasts, or apps.'
    },
    {
        id: 'cover',
        icon: '🎶',
        title: 'Cover / Remix',
        description: 'A fresh take on a song you love — reimagined in a new genre, with new instrumentation, or a new mood.'
    },
    {
        id: 'feedback',
        icon: '💬',
        title: 'Demo Feedback & Consulting',
        description: 'Honest ears and honest words. Detailed feedback plus a plan for what to try next.'
    },
]

// ----- FAQ -----
const FAQ = [
    {
        id: 'faq-1',
        q: 'How do I commission you?',
        a: 'You need to win a Commission Ticket from the gacha machine. Earn coins by completing small tasks, feed the machine 10 coins per spin, and try your luck.',
    },
    {
        id: 'faq-2',
        q: 'What happens if I win the Commission Ticket?',
        a: 'Your project is on me — valid for one week. Download the ticket, then send me the ticket image or just the code along with a short description of your project via email, X (Twitter) DM, or Discord DM. One ticket = one project.',
    },
    {
        id: 'faq-3',
        q: 'What happens if I don\'t win the ticket?',
        a: 'You get a little surprise and another chance tomorrow. The machine and the daily missions both refill at midnight (JST).',
    },
    {
        id: 'faq-4',
        q: 'What services can I commission?',
        a: 'Everything in the services list above works with a Commission Ticket. Full production, mixing, mastering, composition, arrangement, vocal editing, BGM, jingles, cover arrangements, and more.',
    },
    {
        id: 'faq-5',
        q: 'Can I trade or give my ticket to someone else?',
        a: 'One ticket per person, please. If you win one, it\'s yours to use.',
    },
]

const Commissions = () => {
    const servicesRef = useRef<HTMLDivElement>(null)
    const faqRef = useRef<HTMLDivElement>(null)
    const [openFaq, setOpenFaq] = useState<string | null>(null)

    useGSAP(() => {
        // Intro text
        gsap.from('.intro-txt', {
            autoAlpha: 0,
            y: 12,
            duration: 0.9,
            stagger: 1,
            ease: 'power3.out',
            delay: 1,
        })


        // ScrollTrigger.batch for services, reverses on scroll back up
        ScrollTrigger.batch('.service-card', {
            onEnter: batch => gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.6,
                ease: 'power2.out',
                overwrite: true,
            }),
            onLeaveBack: batch => gsap.to(batch, {
                autoAlpha: 0,
                y: 50,
                stagger: 0.1,
                duration: 0.4,
                ease: 'power2.in',
                overwrite: true,
            }),
            start: 'top 90%',
            end: 'bottom 10%',
        })

        // ScrollTrigger.batch for FAQ, reverses on scroll back up
        ScrollTrigger.batch('.faq-item', {
            onEnter: batch => gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                stagger: 0.15,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true,
            }),
            onLeaveBack: batch => gsap.to(batch, {
                autoAlpha: 0,
                y: 30,
                stagger: 0.15,
                duration: 0.4,
                ease: 'power2.in',
                overwrite: true,
            }),
            start: 'top 90%',
            end: 'bottom 10%',
        })

        // Initial state for batch items
        gsap.set('.service-card', { autoAlpha: 0, y: 50 })
        gsap.set('.faq-item', { autoAlpha: 0, y: 30 })

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
    }, [])

    const toggleFaq = (id: string) => {
        setOpenFaq(openFaq === id ? null : id)
    }

    return (
        <>
            <Meta />

            <div className="min-h-screen">
                {/* ---------- HERO SECTION (Full Viewport) ---------- */}
                <section className="min-h-[calc(100dvh-60px)] flex flex-col items-center justify-center px-6 relative">
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 translate-y md:left-2/33 md:top-1/6 md:translate-x-0 md:-translate-y-4/5 text-center w-md max-w-full py-4 pointer-events-none">
                        <p className="intro-txt text-base md:text-lg text-foreground">
                            Want your cover song mixed?
                        </p>
                        <p className="intro-txt text-base md:text-lg text-foreground">
                            Or maybe want to create an original song?
                        </p>
                        <p className="intro-txt text-base md:text-lg text-pink-500">
                            Maybe I can help...
                        </p>
                    </div>

                    {/* Vending Machine */}
                    <div className="flex justify-center w-full">
                        <VendingMachine />
                    </div>
                </section>

                {/* ---------- SERVICES ---------- */}
                <section ref={servicesRef} className="px-6 py-20 max-w-4xl mx-auto">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black">
                                What you can commission
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {SERVICES.map(s => (
                                <div
                                    key={s.id}
                                    className="service-card bg-background rounded-xl border border-border p-6 hover:border-foreground/20 transition-colors"
                                >
                                    <div className="text-3xl mb-3">{s.icon}</div>
                                    <h3 className="font-black mb-2">{s.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {s.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------- FAQ ---------- */}
                <section ref={faqRef} className="px-6 py-20 max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black">FAQ</h2>
                    </div>
                    <div className="space-y-3">
                        {FAQ.map(item => (
                            <div
                                key={item.id}
                                className="faq-item border border-border rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFaq(item.id)}
                                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted transition-colors"
                                >
                                    <span className="font-semibold">{item.q}</span>
                                    <span className="shrink-0 text-muted-foreground text-xl leading-none select-none">
                                        {openFaq === item.id ? '−' : '+'}
                                    </span>
                                </button>
                                {openFaq === item.id && (
                                    <div className="px-5 pb-5 text-muted-foreground leading-relaxed text-sm">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div >
        </>
    )
}

export default Commissions
