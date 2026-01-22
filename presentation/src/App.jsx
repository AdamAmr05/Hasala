import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

// Slides - NEW ORDER
import S0_Title from './slides/S0_Title';
import S1_Poster from './slides/S1_Intro';
import S2_VoiceInput from './slides/S2_VoiceInput';
import S3_Splitting from './slides/S3_Splitting';
import S4_Management from './slides/S4_Management';
import S4b_Family from './slides/S4b_Family';
import S5_Analytics from './slides/S5_Analytics';
import S6_Savings from './slides/S6_Savings';
import S7_Learning from './slides/S7_Learning';
import S8_AIChat from './slides/S8_AIChat';
import S9_ThankYou from './slides/S9_ThankYou';

gsap.registerPlugin(useGSAP);

const SLIDES = [
    { component: S0_Title, title: 'Title' },
    { component: S1_Poster, title: 'Poster' },
    { component: S2_VoiceInput, title: 'Voice Input' },
    { component: S5_Analytics, title: 'Analytics' },
    { component: S4_Management, title: 'Management' },
    { component: S4b_Family, title: 'Family' },
    { component: S3_Splitting, title: 'Splitting' },
    { component: S6_Savings, title: 'Savings' },
    { component: S7_Learning, title: 'Learning' },
    { component: S8_AIChat, title: 'AI Chat' },
    { component: S9_ThankYou, title: 'Thank You' },
];

function App() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef(null);
    const slideRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isAnimating) return;

            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    goToNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPrev();
                    break;
                case 'f':
                case 'F':
                    toggleFullscreen();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide, isAnimating]);

    const animateSlideTransition = useCallback((direction, newIndex) => {
        if (!slideRef.current) return;

        setIsAnimating(true);

        const tl = gsap.timeline({
            onComplete: () => {
                setCurrentSlide(newIndex);
                setIsAnimating(false);
            }
        });

        tl.to(slideRef.current, {
            opacity: 0,
            x: direction === 'next' ? -60 : 60,
            duration: 0.35,
            ease: 'power2.inOut',
        });
    }, []);

    useGSAP(() => {
        if (!slideRef.current) return;

        gsap.fromTo(slideRef.current,
            { opacity: 0, x: 60 },
            { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
        );
    }, { dependencies: [currentSlide], scope: containerRef });

    const goToNext = useCallback(() => {
        if (currentSlide < SLIDES.length - 1) {
            animateSlideTransition('next', currentSlide + 1);
        }
    }, [currentSlide, animateSlideTransition]);

    const goToPrev = useCallback(() => {
        if (currentSlide > 0) {
            animateSlideTransition('prev', currentSlide - 1);
        }
    }, [currentSlide, animateSlideTransition]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const CurrentSlideComponent = SLIDES[currentSlide].component;

    return (
        <div ref={containerRef} className="h-screen w-screen overflow-hidden bg-background relative font-sans">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200/50 z-50">
                <div
                    className="h-full bg-accent-blue transition-all duration-500 ease-out"
                    style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
                />
            </div>

            {/* Slide container */}
            <div ref={slideRef} className="h-full w-full">
                <CurrentSlideComponent isActive={true} />
            </div>

            {/* Minimal Navigation Controls - Auto-hides when not hovering bottom area */}
            <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center pb-4 opacity-0 hover:opacity-100 transition-opacity duration-300 z-50 bg-gradient-to-t from-black/20 to-transparent">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 shadow-lg mb-2">
                    <button
                        onClick={goToPrev}
                        disabled={currentSlide === 0 || isAnimating}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 text-white"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex gap-1 px-2">
                        {SLIDES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => !isAnimating && setCurrentSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? 'w-4 bg-white'
                                    : 'w-1.5 bg-white/30 hover:bg-white/60'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={goToNext}
                        disabled={currentSlide === SLIDES.length - 1 || isAnimating}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 text-white"
                    >
                        <ChevronRight size={16} />
                    </button>

                    <div className="w-px h-3 bg-white/20 mx-1" />

                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Slide counter */}
            <div className="absolute top-6 right-6 z-50 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
                <span className="text-sm font-medium text-primary">
                    {currentSlide + 1} / {SLIDES.length}
                </span>
            </div>
        </div>
    );
}

export default App;
