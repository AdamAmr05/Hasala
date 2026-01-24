import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Minimal title slide
export default function S0_Title({ isActive }) {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const taglineRef = useRef(null);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(logoRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        )
            .fromTo(taglineRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                '-=0.4'
            );

    }, { scope: containerRef, dependencies: [isActive] });

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center bg-background">
            <div ref={logoRef} className="text-center">
                <h1 className="text-8xl font-bold text-primary tracking-tight">
                    Hasala
                </h1>
                <p className="text-3xl text-gray-400 mt-2 font-arabic">حصالة</p>
            </div>

            <p
                ref={taglineRef}
                className="mt-8 text-xl text-gray-500"
            >
                AI-Powered Finance for Everyone
            </p>
        </div>
    );
}
