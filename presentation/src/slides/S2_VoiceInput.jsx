import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Mic, Keyboard } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function S2_VoiceInput({ isActive }) {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const cardsRef = useRef([]);
    const videoRef = useRef(null);
    const waveformsRef = useRef([]);

    useGSAP(() => {
        if (!isActive) return;

        const tl = gsap.timeline();

        tl.fromTo(titleRef.current,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
            .fromTo(cardsRef.current,
                { y: 50, opacity: 0, scale: 0.97 },
                { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' },
                '-=0.3'
            );

        waveformsRef.current.forEach((bar, i) => {
            if (!bar) return;
            gsap.to(bar, {
                scaleY: Math.random() * 0.5 + 0.5,
                duration: 0.25 + Math.random() * 0.15,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: i * 0.04,
            });
        });

    }, { scope: containerRef, dependencies: [isActive] });

    useEffect(() => {
        if (isActive && videoRef.current) {
            const timer = setTimeout(() => {
                videoRef.current.play();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    return (
        <div ref={containerRef} className="h-full w-full flex items-center justify-center p-8 gap-8">
            {/* Left side: Cards */}
            <div className="flex flex-col gap-6">
                <h1
                    ref={titleRef}
                    className="text-4xl font-bold text-primary mb-4"
                >
                    Your Voice,<br />
                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Your Finance</span>
                </h1>

                {/* Expense Card */}
                <div
                    ref={el => cardsRef.current[0] = el}
                    className="relative w-72 p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100/50 shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                            <Mic className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Expense Mode</h3>
                            <p className="text-xs text-gray-500">Voice logging</p>
                        </div>
                    </div>

                    <div className="h-12 bg-white/70 rounded-xl flex items-center justify-center gap-0.5 px-3">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                ref={el => waveformsRef.current[i] = el}
                                className="w-1 h-6 rounded-full bg-gradient-to-t from-orange-400 to-pink-500"
                                style={{ transform: 'scaleY(0.4)' }}
                            />
                        ))}
                    </div>

                    <p className="mt-3 text-center text-sm text-gray-600 font-arabic">
                        "اتغديت كشري بخمسين جنيه"
                    </p>
                </div>

                {/* Income Card */}
                <div
                    ref={el => cardsRef.current[1] = el}
                    className="relative w-72 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100/50 shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                            <Keyboard className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Income Mode</h3>
                            <p className="text-xs text-gray-500">Type or speak</p>
                        </div>
                    </div>

                    <div className="h-12 bg-white/70 rounded-xl flex items-center px-3">
                        <span className="text-gray-700 text-sm">Salary 15000 EGP</span>
                        <span className="ml-1 w-0.5 h-4 bg-green-500 animate-pulse" />
                    </div>

                    <p className="mt-3 text-center text-sm text-gray-600">
                        Auto-categorized as <span className="font-medium text-green-600">Salary</span>
                    </p>
                </div>
            </div>

            {/* Right side: Demo Video */}
            <div
                ref={el => cardsRef.current[2] = el}
                className="relative"
            >
                <div className="absolute inset-0 -z-10 blur-2xl opacity-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl scale-105" />
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-black border border-black/10">
                    <video
                        ref={videoRef}
                        src="/assets/videos/AI chat hasala demo.mp4"
                        className="h-[70vh] w-auto block transform scale-[1.01]"
                        loop
                        muted
                        playsInline
                    />
                </div>
            </div>
        </div>
    );
}
