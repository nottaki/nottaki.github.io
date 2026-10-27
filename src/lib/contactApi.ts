const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5173"

export interface ContactPayload {
    name: string
    contactMethod: string
    contactValue: string
    reason: string
    ticket: string
    message: string
    website: string
}

export const submitContactForm = async (payload: ContactPayload) => {
    const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })

    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || "Could not send your note. Please try again.")
    }
    return res.json()
}
