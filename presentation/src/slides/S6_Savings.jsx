import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { PiggyBank } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function S6_Savings({ isActive }) {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const videoContainerRef = useRef(null);
    const videoRef = useRef(null);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(titleRef.current,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
            .fromTo(videoContainerRef.current,
                { y: 60, opacity: 0, scale: 0.97 },
                { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' },
                '-=0.3'
            );

    }, { scope: containerRef, dependencies: [isActive] });

    useEffect(() => {
        if (isActive && videoRef.current) {
            const timer = setTimeout(() => {
                videoRef.current.play();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-8">
            <div ref={titleRef} className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <PiggyBank className="text-accent-green" size={32} />
                    <h1 className="text-4xl font-bold text-primary">
                        Savings Goals
                    </h1>
                </div>
                <p className="text-gray-500">
                    Track progress toward your financial goals
                </p>
            </div>

            <div
                ref={videoContainerRef}
                className="relative"
            >
                <div className="absolute inset-0 -z-10 blur-3xl opacity-15 bg-accent-green rounded-3xl scale-105" />
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-black border border-black/10">
                    <video
                        ref={videoRef}
                        src="/assets/videos/Hasala Saving demo.mp4"
                        className="h-[65vh] w-auto block transform scale-[1.01]"
                        loop
                        muted
                        playsInline
                    />
                </div>
            </div>
        </div>
    );
}
