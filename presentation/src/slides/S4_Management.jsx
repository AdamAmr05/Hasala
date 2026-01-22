import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Repeat, Settings } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function S4_Management({ isActive }) {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const cardsRef = useRef([]);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(titleRef.current,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
            .fromTo(cardsRef.current[0],
                { x: -60, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                '-=0.3'
            )
            .fromTo(cardsRef.current[1],
                { x: 60, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                '-=0.5'
            );

    }, { scope: containerRef, dependencies: [isActive] });

    return (
        <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-8">
            <h1
                ref={titleRef}
                className="text-4xl font-bold text-primary mb-2"
            >
                Set It. <span className="text-accent-green">Forget It.</span>
            </h1>
            <p className="text-gray-500 mb-10">Automate your recurring expenses</p>

            <div className="flex gap-6 items-stretch">
                {/* Recurring Transactions Card */}
                <div
                    ref={el => cardsRef.current[0] = el}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="p-4 bg-accent-blue/5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-accent-blue flex items-center justify-center">
                                <Repeat className="text-white" size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Recurring Transactions</h3>
                                <p className="text-xs text-gray-500">Auto-log monthly expenses</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3">
                        <img
                            src="/assets/screenshots/Recurring transactions.png"
                            alt="Recurring Transactions"
                            className="h-[55vh] w-auto rounded-xl object-contain"
                        />
                    </div>
                </div>

                {/* Settings Card */}
                <div
                    ref={el => cardsRef.current[1] = el}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center">
                                <Settings className="text-white" size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Settings</h3>
                                <p className="text-xs text-gray-500">Personalize your experience</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3">
                        <img
                            src="/assets/screenshots/Settings page.png"
                            alt="Settings Page"
                            className="h-[55vh] w-auto rounded-xl object-contain"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
