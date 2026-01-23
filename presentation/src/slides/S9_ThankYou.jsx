import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function S9_ThankYou({ isActive }) {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const textRef = useRef(null);
    const signatureRef = useRef(null);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(logoRef.current,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.2)' }
        )
            .fromTo(textRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                '-=0.4'
            )
            .fromTo(signatureRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 1, ease: 'power2.inOut' },
                '-=0.2'
            );

    }, { scope: containerRef, dependencies: [isActive] });

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-accent-blue/5">
            <div ref={logoRef} className="mb-8">
                <h1 className="text-7xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                    Hasala
                </h1>
                <p className="text-center text-2xl text-gray-400 mt-2 font-arabic">حصالة</p>
            </div>

            <div ref={textRef} className="text-center mb-16 max-w-2xl">
                <p className="text-2xl text-gray-600 mb-2">
                    AI-Powered Finance for Everyone
                </p>
            </div>

            <div ref={signatureRef} className="absolute bottom-32 text-center">
                <p className="text-xl text-gray-500 font-light mb-2">Thank You</p>
                <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">
                    Adam Amr
                </p>
            </div>
        </div>
    );
}
