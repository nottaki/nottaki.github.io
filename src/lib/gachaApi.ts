const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5173"

const getDeviceId = (): string => {
    let id = localStorage.getItem('gachaDeviceId')
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('gachaDeviceId', id)
    }
    return id
}

const getHeaders = () => ({
    'x-device-id': getDeviceId(),
    'Content-Type': 'application/json'
})

export interface Mission {
    id: number
    title: string
    description: string | null
    url: string | null
    coins: number
    cta_text: string | null
    completed: boolean
}

export interface MachineState {
    capsules: number
    coins: number
    missions: Mission[]
    canWinTicket: boolean
}

export const fetchMachineState = async (): Promise<MachineState> => {
    const res = await fetch(`${API_BASE}/api/state`, {
        headers: getHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch machine state')
    return res.json()
}

export const submitSpinToBackend = async (): Promise<{
    prize: string
    code: string | null
    expiresAt: string | null
    remaining: number
    coins: number
}> => {
    const res = await fetch(`${API_BASE}/api/spin`, {
        method: 'POST',
        headers: getHeaders()
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Spin failed' }))
        throw new Error(err.error || 'Unknown error')
    }
    return res.json()
}

export const claimMission = async (missionId: number): Promise<{
    success: boolean
    coinsAdded: number
    totalCoins: number
}> => {
    const res = await fetch(`${API_BASE}/api/missions/${missionId}/claim`, {
        method: 'POST',
        headers: getHeaders()
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Claim failed' }))
        throw new Error(err.error || 'Unknown error')
    }
    return res.json()
}
