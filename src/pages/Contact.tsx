import Meta from "@/components/Meta"
import { submitContactForm } from "@/lib/contactApi"
import { cn } from "@/lib/utils"
import { Icon, type IconifyIcon } from "@iconify/react"
import { useEffect, useRef, useState, type SubmitEvent } from "react"
import { useNavigate } from "react-router"

const METHODS = [
    {
        value: "email",
        label: "Email",
        icon: {
            "width": 512,
            "height": 512,
            "body": "<path fill=\"currentColor\" d=\"M424 80H88a56.06 56.06 0 0 0-56 56v240a56.06 56.06 0 0 0 56 56h336a56.06 56.06 0 0 0 56-56V136a56.06 56.06 0 0 0-56-56m-14.18 92.63l-144 112a16 16 0 0 1-19.64 0l-144-112a16 16 0 1 1 19.64-25.26L256 251.73l134.18-104.36a16 16 0 0 1 19.64 25.26\"/>"
        }

    },
    {
        value: "x",
        label: "X (Twitter)",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M5 1a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4zm-.334 3.5a.75.75 0 0 0-.338 1.154l5.614 7.45l-5.915 6.345l-.044.051H6.03l4.83-5.179l3.712 4.928a.75.75 0 0 0 .337.251h4.422a.75.75 0 0 0 .336-1.154l-5.614-7.45L20.017 4.5h-2.05l-4.83 5.18l-3.714-4.928a.75.75 0 0 0-.337-.252zm10.88 13.548L6.431 5.952H8.45l9.114 12.095z\" clip-rule=\"evenodd\"/>"
        }

    },
    {
        value: "discord",
        label: "Discord",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"currentColor\" d=\"M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.6 18.6 0 0 0-5.487 0a12 12 0 0 0-.617-1.23A.08.08 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.1.1 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055a20 20 0 0 0 5.993 2.98a.08.08 0 0 0 .084-.026a14 14 0 0 0 1.226-1.963a.074.074 0 0 0-.041-.104a13 13 0 0 1-1.872-.878a.075.075 0 0 1-.008-.125q.19-.14.372-.287a.08.08 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.08.08 0 0 1 .079.009q.18.148.372.288a.075.075 0 0 1-.006.125q-.895.515-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.08.08 0 0 0 .084.028a20 20 0 0 0 6.002-2.981a.08.08 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028M8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38c0-1.312.956-2.38 2.157-2.38c1.21 0 2.176 1.077 2.157 2.38c0 1.312-.956 2.38-2.157 2.38m7.975 0c-1.183 0-2.157-1.069-2.157-2.38c0-1.312.955-2.38 2.157-2.38c1.21 0 2.176 1.077 2.157 2.38c0 1.312-.946 2.38-2.157 2.38\"/>"
        }

    },
    {
        value: "other",
        label: "Other",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97q1.316.193 2.652.316V21a.75.75 0 0 0 1.28.53l4.184-4.183a.4.4 0 0 1 .266-.112q3.01-.076 5.922-.506c1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49 49 0 0 0 12 2.25M8.25 8.625a1.125 1.125 0 1 0 0 2.25a1.125 1.125 0 0 0 0-2.25m2.625 1.125a1.125 1.125 0 1 1 2.25 0a1.125 1.125 0 0 1-2.25 0m4.875-1.125a1.125 1.125 0 1 0 0 2.25a1.125 1.125 0 0 0 0-2.25\" clip-rule=\"evenodd\"/>"
        }

    },
] as const

// Labels MUST match the admin Inbox's REASON_META labels exactly.
const REASONS = [
    {
        value: "general",
        label: "Question or hello",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092a10 10 0 1 0-4.777-4.719\"/>"
        }

    },
    {
        value: "ticket",
        label: "Ticket claim",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Zm11-4v2m0 10v2m0-8v2\"/>"
        }

    },
    {
        value: "collab",
        label: "Collaboration",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"m11 17l2 2a1 1 0 1 0 3-3\"/><path d=\"m14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4\"/><path d=\"m21 3l1 11h-2M3 3L2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8\"/></g>"
        }

    },
    {
        value: "other",
        label: "Something else",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/><circle cx=\"5\" cy=\"12\" r=\"1\"/></g>"
        }
    },
] as const

type Option = { value: string; label: string; icon: IconifyIcon }

const LIMITS = { name: 50, contact: 100, message: 1000, ticket: 9 } as const
const TICKET_PATTERN = /^[A-Z]{2}-[A-Z0-9]{6}$/

const placeholderFor = (method: string) => {
    if (method === "email") return "you@example.com"
    if (method === "x") return "your_x_handle"
    if (method === "discord") return "your_discord_username"
    return "how to reach you"
}

// Ticket mask:
// - first two characters must be letters
// - hyphen appears automatically after the second letter
// - then up to six letters/digits
// - complete format is always XX-XXXXXX, like FC-A3F9QZ
const formatTicketCode = (raw: string) => {
    let prefix = ""
    let body = ""

    for (const ch of raw.toUpperCase()) {
        if (prefix.length < 2) {
            if (/[A-Z]/.test(ch)) prefix += ch
            continue
        }

        if (/[A-Z0-9]/.test(ch)) body += ch
        if (body.length >= 6) break
    }

    if (prefix.length < 2) return prefix
    return body ? `${prefix}-${body}` : prefix
}

// In-DOM listbox: replaces the native <select> so the popup can never detach on
// mobile and so each option can carry an icon. Closes on outside click / Escape.
function IconSelect({ id, value, options, onChange }: {
    id: string
    value: string
    options: readonly Option[]
    onChange: (v: string) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const selected = options.find(o => o.value === value)

    useEffect(() => {
        if (!open) return
        const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
        document.addEventListener("mousedown", onDoc)
        document.addEventListener("keydown", onKey)
        return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey) }
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                id={id}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
                className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-200/60"
            >
                <span className="flex min-w-0 items-center gap-2">
                    <Icon
                        icon={selected?.icon ?? {
                            "width": 24,
                            "height": 24,
                            "body": "<circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/>"
                        }}
                        className="h-4 w-4 shrink-0"
                    />
                    <span className="truncate">{selected?.label ?? "Choose…"}</span>
                </span>
                <Icon
                    icon={{
                        "width": 24,
                        "height": 24,
                        "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m6 10l6 6l6-6\"/>"
                    }}
                    className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    aria-labelledby={id}
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-background py-1 shadow-lg"
                >
                    {options.map(o => (
                        <li key={o.value} role="option" aria-selected={o.value === value}>
                            <button
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false) }}
                                className={cn(
                                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                    o.value === value && "bg-pink-50 font-medium text-pink-600"
                                )}
                            >
                                <Icon icon={o.icon} className="h-4 w-4 shrink-0" />
                                <span className="truncate">{o.label}</span>
                                {
                                    o.value === value
                                    && <Icon
                                        icon={{
                                            "width": 24,
                                            "height": 24,
                                            "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m4 12l6 6L20 6\"/>"
                                        }}
                                        className="ml-auto h-4 w-4 shrink-0"
                                    />
                                }
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

const Contact = () => {
    const navigate = useNavigate()

    const [name, setName] = useState("")
    const [method, setMethod] = useState<string>("email")
    const [contact, setContact] = useState("")
    const [reason, setReason] = useState<string>("general")
    const [ticket, setTicket] = useState("")
    const [message, setMessage] = useState("")
    const [website, setWebsite] = useState("")

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")

    const methodMeta = METHODS.find(m => m.value === method)
    const isClaim = reason === "ticket"
    const isPristine = !name && !contact && !ticket && !message

    const handleReset = () => {
        setName(""); setContact(""); setTicket(""); setMessage(""); setWebsite("")
        setMethod("email"); setReason("general")
        setStatus("idle"); setErrorMsg("")
    }

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setStatus("idle")
        setErrorMsg("")

        if (!name.trim() || !contact.trim() || !message.trim()) {
            setStatus("error")
            setErrorMsg("Please fill in every required field.")
            return
        }

        if (isClaim && !TICKET_PATTERN.test(ticket.trim().toUpperCase())) {
            setStatus("error")
            setErrorMsg("Please enter your full ticket code, like FC-A3F9QZ.")
            return
        }

        setStatus("loading")
        try {
            await submitContactForm({
                name: name.trim(),
                contactMethod: method,
                contactValue: contact.trim(),
                reason,
                ticket: isClaim ? ticket.trim().toUpperCase() : "",
                message: message.trim(),
                website: website,
            })
            setStatus("success")
            setName(""); setContact(""); setTicket(""); setMessage(""); setWebsite("")
        } catch (err) {
            setStatus("error")
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
        }
    }

    if (status === "success") {
        return (
            <>
                <Meta />

                <div className="min-h-[calc(100dvh-60px)] bg-background text-foreground flex items-center justify-center px-4 py-16">
                    <div className="w-full max-w-md text-center space-y-5 anim-rise">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-100">
                            <Icon
                                icon={{
                                    "width": 24,
                                    "height": 24,
                                    "body": "<g fill=\"none\"><path fill=\"currentColor\" d=\"M12.43 21.86a9.8 9.8 0 1 0-9.8-9.8q.01 1.24.14 2.02a10 10 0 0 1 .16 1.43c-.02.2-.1.47-.25.99l-.08.24c-.71 2.39-1.07 3.59-.54 4.37a2 2 0 0 0 .36.4c.71.62 1.94.4 4.4-.02a5 5 0 0 1 .73-.1c.15 0 .34.04.72.1c.88.15 2.44.37 4.16.37\" opacity=\".2\"/><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M12.43 21.86a9.8 9.8 0 1 0-9.8-9.8q.01 1.24.14 2.02a10 10 0 0 1 .16 1.43c-.02.2-.1.47-.25.99l-.08.24c-.71 2.39-1.07 3.59-.54 4.37a2 2 0 0 0 .36.4c.71.62 1.94.4 4.4-.02a5 5 0 0 1 .73-.1c.15 0 .34.04.72.1c.88.15 2.44.37 4.16.37\"/><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"m7.84 12.94l1.26 1.54c.71.88 1.07 1.32 1.55 1.32s.83-.44 1.55-1.32l4.38-5.41\"/></g>"
                                }}
                                className="h-7 w-7 text-pink-500"
                            />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">Your note is in.</h1>
                        <p className="text-sm text-muted-foreground">
                            Thank you for trusting me with it. I read every message myself, and I will reply
                            through your {methodMeta?.label ?? "chosen contact"} as soon as I can.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="inline-flex h-11 items-center justify-center rounded-md bg-pink-500 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-600"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Meta />

            <div className="min-h-[calc(100dvh-60px)] bg-background text-foreground px-4 py-12">
                <style>{`
        @keyframes contact-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .anim-rise { animation: contact-rise 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-rise-1 { animation-delay: 60ms; }
        .anim-rise-2 { animation-delay: 120ms; }
        .hp-wrap { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      `}</style>

                <div className="mx-auto w-full max-w-2xl">
                    <header className="anim-rise mb-10 text-center">
                        <h1 className="text-3xl font-black tracking-tight">Leave a note</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Questions, collabs, ticket claims, or just a hello. I read every note myself. („• ֊ •„)
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="anim-rise anim-rise-1">
                        <div className="hp-wrap" aria-hidden="true">
                            <label htmlFor="hp-website">Website</label>
                            <input id="hp-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="c-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Your name <span className="text-pink-500" aria-hidden="true">*</span><span className="sr-only">(required)</span>
                            </label>
                            <div className="relative">
                                <Icon
                                    icon={{
                                        "width": 640,
                                        "height": 640,
                                        "body": "<path fill=\"currentColor\" d=\"M320 312c66.3 0 120-53.7 120-120S386.3 72 320 72s-120 53.7-120 120s53.7 120 120 120m-29.7 56C191.8 368 112 447.8 112 546.3c0 16.4 13.3 29.7 29.7 29.7h356.6c16.4 0 29.7-13.3 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3z\"/>"
                                    }}
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                />
                                <input
                                    id="c-name" type="text" maxLength={LIMITS.name} value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="What should I call you?"
                                    className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-200/60"
                                />
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <label htmlFor="c-reason" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                What is your note about?
                            </label>
                            <IconSelect id="c-reason" value={reason} options={REASONS} onChange={setReason} />
                        </div>

                        {isClaim && (
                            <div className="mt-6 space-y-2 anim-rise">
                                <label htmlFor="c-ticket" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Ticket code <span className="text-pink-500" aria-hidden="true">*</span><span className="sr-only">(required)</span>
                                </label>
                                <div className="relative">
                                    <Icon
                                        icon={{
                                            "width": 24,
                                            "height": 24,
                                            "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Zm11-4v2m0 10v2m0-8v2\"/>"
                                        }}
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                    />
                                    <input
                                        id="c-ticket"
                                        type="text"
                                        maxLength={LIMITS.ticket}
                                        value={ticket}
                                        onChange={(e) => setTicket(formatTicketCode(e.target.value))}
                                        placeholder="FC-A3F9QZ"
                                        inputMode="text"
                                        autoCapitalize="characters"
                                        autoComplete="off"
                                        spellCheck={false}
                                        className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 font-mono text-sm uppercase outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-200/60"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Type the full code as printed, like FC-A3F9QZ. The hyphen appears automatically.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="c-method" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    How should I reply to you?
                                </label>
                                <IconSelect id="c-method" value={method} options={METHODS} onChange={setMethod} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="c-contact" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {method === "email" ? "Your email" : "Your handle"} <span className="text-pink-500" aria-hidden="true">*</span><span className="sr-only">(required)</span>
                                </label>
                                <div className="relative">
                                    <Icon
                                        icon={{
                                            "body": "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M11.89 4.111a5.5 5.5 0 1 0 0 7.778a.75.75 0 1 1 1.06 1.061A7 7 0 1 1 15 8a2.5 2.5 0 0 1-4.083 1.935A3.5 3.5 0 1 1 11.5 8a1 1 0 0 0 2 0a5.48 5.48 0 0 0-1.61-3.889M10 8a2 2 0 1 0-4 0a2 2 0 0 0 4 0\" clip-rule=\"evenodd\"/>"
                                        }}
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                    />
                                    <input
                                        id="c-contact" type={method === "email" ? "email" : "text"} maxLength={LIMITS.contact} value={contact} onChange={(e) => setContact(e.target.value)}
                                        placeholder={placeholderFor(method)}
                                        className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-200/60"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <div className="flex items-baseline justify-between">
                                <label htmlFor="c-message" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Your message <span className="text-pink-500" aria-hidden="true">*</span><span className="sr-only">(required)</span>
                                </label>
                                <span className="text-[11px] tabular-nums text-muted-foreground">{message.length}/{LIMITS.message}</span>
                            </div>
                            <div className="relative">
                                <Icon
                                    icon={{
                                        "left": -2,
                                        "top": -2,
                                        "width": 24,
                                        "height": 24,
                                        "body": "<path fill=\"currentColor\" d=\"m5.72 14.456l1.761-.508l10.603-10.73a.456.456 0 0 0-.003-.64l-.635-.642a.443.443 0 0 0-.632-.003L6.239 12.635zM18.703.664l.635.643c.876.887.884 2.318.016 3.196L8.428 15.561l-3.764 1.084a.9.9 0 0 1-1.11-.623a.9.9 0 0 1-.002-.506l1.095-3.84L15.544.647a2.215 2.215 0 0 1 3.159.016zM7.184 1.817c.496 0 .898.407.898.909a.903.903 0 0 1-.898.909H3.592c-.992 0-1.796.814-1.796 1.817v10.906c0 1.004.804 1.818 1.796 1.818h10.776c.992 0 1.797-.814 1.797-1.818v-3.635c0-.502.402-.909.898-.909s.898.407.898.91v3.634c0 2.008-1.609 3.636-3.593 3.636H3.592C1.608 19.994 0 18.366 0 16.358V5.452c0-2.007 1.608-3.635 3.592-3.635z\"/>"
                                    }}
                                    className="pointer-events-none absolute left-3 top-3 h-4.5 w-4.5"
                                />
                                <textarea
                                    id="c-message" maxLength={LIMITS.message} rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your message here..."
                                    className="w-full resize-y rounded-md border border-border bg-background py-2.5 pl-9 pr-3 text-sm leading-relaxed outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-200/60 min-h-52 max-h-104"
                                />
                            </div>
                        </div>

                        <div
                            aria-live="polite"
                            className={cn(
                                "grid transition-all duration-300 ease-out",
                                status === "error" ? "mt-6 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
                            )}
                        >
                            <div className="overflow-hidden">
                                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                                    <Icon
                                        icon={{
                                            "width": 24,
                                            "height": 24,
                                            "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path stroke-linecap=\"round\" d=\"M12 7v6m0 3.5v.5\"/></g>"
                                        }}
                                        className="mt-0.5 h-4 w-4 shrink-0"
                                    />
                                    <p>{errorMsg}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isPristine || status === "loading"}
                                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-pink-500 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300"
                            >
                                {status === "loading" ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            icon={{
                                                "width": 24,
                                                "height": 24,
                                                "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939\"/>"
                                            }}
                                            className="h-4 w-4"
                                        />
                                        Send my note
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Contact
