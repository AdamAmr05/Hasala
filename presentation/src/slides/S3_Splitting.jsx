import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function S3_Splitting({ isActive }) {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const stepsRef = useRef([]);

    // Corrected Order:
    // 1. Groups Overview
    // 2. Add Expense
    // 3. Group Details (Creation/View)
    // 4. Settle Up
    const steps = [
        {
            src: '/assets/screenshots/Splitting groups view.png',
            title: '1. Track Groups',
            desc: 'See all active split groups'
        },
        {
            src: '/assets/screenshots/Add expense in splitting.png',
            title: '2. Add Expense',
            desc: 'Log shared spending'
        },
        {
            src: '/assets/screenshots/Splitting.png',
            title: '3. Group Details',
            desc: 'View expenses & balances'
        },
        {
            src: '/assets/screenshots/Settle Up.png',
            title: '4. Settle Up',
            desc: 'Clear debts easily'
        },
    ];

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        // Title
        tl.fromTo(titleRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
            // Steps stagger in
            .fromTo(stepsRef.current,
                { y: 50, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.2, ease: 'power2.out' },
                '-=0.3'
            );

    }, { scope: containerRef, dependencies: [isActive] });

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-6">
            <h1
                ref={titleRef}
                className="text-4xl font-bold text-primary mb-8"
            >
                Smart <span className="text-accent-blue">Expense Splitting</span>
            </h1>

            {/* Steps Row */}
            <div className="flex gap-6 items-start justify-center w-full max-w-[95vw]">
                {steps.map((step, i) => (
                    <div
                        key={i}
                        ref={el => stepsRef.current[i] = el}
                        className="flex flex-col items-center gap-4 flex-1 min-w-0"
                    >
                        {/* Image Container */}
                        <div className="relative w-full group transition-transform duration-300 hover:scale-[1.02]">
                            <img
                                src={step.src}
                                alt={step.title}
                                className="w-full h-auto object-contain max-h-[55vh] drop-shadow-2xl rounded-2xl"
                            />
                        </div>

                        {/* Label */}
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-primary">{step.title}</h3>
                            <p className="text-sm text-gray-500">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
