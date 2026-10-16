// Define the paths to sound files in `public/sounds` directory
const SOUND_PATHS: Record<string, string> = {
    coinDrop: '/sounds/coin-drop.mp3',
    coinInsert: '/sounds/coin-insert.mp3',
    spinStart: '/sounds/spin.mp3',
    capsuleDrop: '/sounds/capsule-drop.mp3',
    capsuleOpen: '/sounds/capsule-open.mp3',
    missionClaim: '/sounds/mission-claim.mp3',
    uiTap: '/sounds/ui-tap.mp3',
}

// Export SOUNDS as an object of keys so VendingMachine.tsx can use SOUNDS.coinDrop
export const SOUNDS = {
    coinDrop: 'coinDrop',
    coinInsert: 'coinInsert',
    spinStart: 'spinStart',
    capsuleDrop: 'capsuleDrop',
    capsuleOpen: 'capsuleOpen',
    missionClaim: 'missionClaim',
    uiTap: 'uiTap',
} as const

// Create the Audio objects ONCE and store them by path
const audioCache: Record<string, HTMLAudioElement> = {}

for (const [key, path] of Object.entries(SOUND_PATHS)) {
    const audio = new Audio(path)
    audio.preload = 'auto' // Tell the browser to download it immediately
    // Catch loading errors gracefully if the file doesn't exist yet
    audio.addEventListener('error', () => {
        // Silently ignore missing sound files during development
    })
    audioCache[key] = audio
}

// Play the sound by resetting it to the start
export const playSound = (soundKey: keyof typeof SOUNDS, volume: number = 1) => {
    // Respect the global mute toggle on the machine body
    if (typeof window !== 'undefined' && localStorage.getItem('gachaMuted') === 'true') return

    const audio = audioCache[soundKey]
    if (audio) {
        audio.volume = volume
        audio.currentTime = 0 // Rewind to start so we can spam click it
        audio.play().catch(() => { })
    }
}
