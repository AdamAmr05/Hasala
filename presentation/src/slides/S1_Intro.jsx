import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function S1_Poster({ isActive }) {
    const containerRef = useRef(null);
    const posterRef = useRef(null);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(posterRef.current,
            { scale: 0.95, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' }
        );

    }, { scope: containerRef, dependencies: [isActive] });

    return (
        <div ref={containerRef} className="h-full w-full flex items-center justify-center p-8 bg-background">
            <img
                ref={posterRef}
                src="/assets/screenshots/HASALA FINAL POSTER.jpg"
                alt="Hasala Poster"
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
        </div>
    );
}
