import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Users, Database, Sparkles } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function S7_Learning({ isActive }) {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const imageRef = useRef(null);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(contentRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        )
            .fromTo(imageRef.current,
                { y: 40, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
                '-=0.5'
            );

    }, { scope: containerRef, dependencies: [isActive] });

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-8">

            <div ref={contentRef} className="text-center mb-10 max-w-2xl">
                <h1 className="text-4xl font-bold text-primary mb-4">
                    Deep <span className="text-accent-blue">Context</span>
                </h1>
                <p className="text-xl text-gray-500 leading-relaxed">
                    Hasala quietly learns from every transaction, building a rich understanding of your financial circle to make future interactions instant.
                </p>
            </div>

            <div ref={imageRef} className="relative group">
                {/* Abstract glow to represent 'AI/Database' loop without being technical */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-[2.5rem] blur-xl opacity-50 transition-opacity duration-1000 group-hover:opacity-75" />

                <img
                    src="/assets/screenshots/Hasala learning people.png"
                    alt="Hasala Learning People"
                    className="relative w-auto h-[50vh] object-contain rounded-3xl shadow-2xl"
                />


            </div>

        </div>
    );
}
