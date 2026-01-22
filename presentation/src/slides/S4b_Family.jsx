import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function S4b_Family({ isActive }) {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const imageRef = useRef(null);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(titleRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
            .fromTo(imageRef.current,
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' },
                '-=0.4'
            );

    }, { scope: containerRef, dependencies: [isActive] });

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-8">

            <div ref={titleRef} className="text-center mb-10">
                <h1 className="text-4xl font-bold text-primary mb-2">
                    Family <span className="text-accent-blue">Overview</span>
                </h1>
                <p className="text-xl text-gray-500">
                    Manage household finances in one place
                </p>
            </div>

            <div ref={imageRef} className="relative group transition-transform duration-300 hover:scale-[1.02]">
                <img
                    src="/assets/screenshots/Family overview.png"
                    alt="Family Overview"
                    className="h-[60vh] w-auto object-contain drop-shadow-2xl rounded-2xl"
                />
            </div>

        </div>
    );
}
