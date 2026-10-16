import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import Lenis from 'lenis'

import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)
