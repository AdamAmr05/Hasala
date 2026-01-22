import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function S8_AIChat({ isActive }) {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const videoContainerRef = useRef(null);
    const videoRef = useRef(null);
    const glowRef = useRef(null);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(titleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
        )
            .fromTo(subtitleRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
                '-=0.4'
            )
            .fromTo(videoContainerRef.current,
                { y: 60, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
                '-=0.3'
            );

        gsap.to(glowRef.current, {
            scale: 1.08,
            opacity: 0.5,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });

    }, { scope: containerRef, dependencies: [isActive] });

    useEffect(() => {
        if (isActive && videoRef.current) {
            const timer = setTimeout(() => {
                videoRef.current.play();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-blue-50/30">
            <h1
                ref={titleRef}
                className="text-5xl font-bold text-center mb-3"
            >
                <span className="text-primary">The </span>
                <span className="text-accent-blue">AI Financial Coach</span>
            </h1>

            <p
                ref={subtitleRef}
                className="text-lg text-gray-500 text-center mb-8 max-w-xl"
            >
                This is where it all comes together.
                Generative UI that thinks, queries, and renders insights in real-time.
            </p>

            <div
                ref={videoContainerRef}
                className="relative"
            >
                <div
                    ref={glowRef}
                    className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-accent-blue rounded-3xl"
                />

                <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 bg-black">
                    <video
                        ref={videoRef}
                        src="/assets/videos/AI demo hasala.mp4"
                        className="h-[58vh] w-auto block transform scale-[1.01]"
                        loop
                        muted
                        playsInline
                    />
                </div>
            </div>


        </div>
    );
}
