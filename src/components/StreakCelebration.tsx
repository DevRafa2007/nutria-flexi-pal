import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface StreakCelebrationProps {
    show: boolean;
    streakCount: number;
    onComplete: () => void;
}

const StreakCelebration = ({ show, streakCount, onComplete }: StreakCelebrationProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [animationPhase, setAnimationPhase] = useState<'enter' | 'stay' | 'exit'>('enter');

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            setAnimationPhase('enter');

            // Fase de entrada (bounce in)
            setTimeout(() => setAnimationPhase('stay'), 600);

            // Fase de saída
            setTimeout(() => setAnimationPhase('exit'), 2000);

            // Esconder completamente
            setTimeout(() => {
                setIsVisible(false);
                onComplete();
            }, 2500);
        }
    }, [show, onComplete]);

    // Cor do fogo baseada no streak
    const getFireColor = () => {
        if (streakCount >= 100) return 'text-purple-500'; // Lendário
        if (streakCount >= 50) return 'text-red-600';     // Épico
        if (streakCount >= 30) return 'text-orange-600'; // Avançado
        if (streakCount >= 7) return 'text-orange-500';  // Aquecendo
        return 'text-orange-400'; // Iniciante
    };

    const getFireEmoji = () => {
        if (streakCount >= 100) return '🔥💜🔥'; // Roxo lendário
        if (streakCount >= 50) return '🔥❤️🔥';  // Vermelho épico
        return '🔥';
    };

    const getMotivationalText = () => {
        if (streakCount >= 100) return 'LENDÁRIO! 🏆';
        if (streakCount >= 50) return 'ÉPICO! ⚡';
        if (streakCount >= 30) return 'IMPARÁVEL! 💪';
        if (streakCount >= 14) return 'INCRÍVEL! 🌟';
        if (streakCount >= 7) return 'CONSISTENTE! ✨';
        if (streakCount >= 3) return 'AQUECENDO! 🚀';
        return 'BOM COMEÇO! 👏';
    };

    const getBackgroundGradient = () => {
        if (streakCount >= 100) return 'from-purple-500/20 via-purple-600/30 to-purple-700/20';
        if (streakCount >= 50) return 'from-red-500/20 via-red-600/30 to-red-700/20';
        return 'from-orange-400/20 via-orange-500/30 to-red-500/20';
    };

    if (!isVisible) return null;

    const animationClasses = {
        enter: 'animate-bounce scale-0 opacity-0',
        stay: 'scale-100 opacity-100',
        exit: 'scale-150 opacity-0',
    };

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-gradient-radial ${getBackgroundGradient()} transition-opacity duration-300 ${animationPhase === 'exit' ? 'opacity-0' : 'opacity-100'}`}
        >
            <div
                className={`flex flex-col items-center gap-4 transition-all duration-500 ease-out ${animationClasses[animationPhase]}`}
                style={{
                    transform: animationPhase === 'stay' ? 'scale(1)' : animationPhase === 'enter' ? 'scale(0)' : 'scale(1.5)',
                }}
            >
                {/* Emoji de fogo gigante */}
                <div className="relative">
                    <span
                        className={`text-8xl sm:text-9xl drop-shadow-2xl ${animationPhase === 'stay' ? 'animate-pulse' : ''}`}
                        style={{
                            filter: streakCount >= 100 ? 'hue-rotate(270deg)' : streakCount >= 50 ? 'hue-rotate(0deg) saturate(1.5)' : 'none',
                            textShadow: '0 0 40px rgba(255, 150, 0, 0.8), 0 0 80px rgba(255, 100, 0, 0.5)',
                        }}
                    >
                        {getFireEmoji()}
                    </span>

                    {/* Partículas de fogo */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-ping">
                        <span className="text-2xl">✨</span>
                    </div>
                    <div className="absolute -top-2 -left-4 animate-bounce" style={{ animationDelay: '0.1s' }}>
                        <span className="text-xl">⭐</span>
                    </div>
                    <div className="absolute -top-2 -right-4 animate-bounce" style={{ animationDelay: '0.2s' }}>
                        <span className="text-xl">⭐</span>
                    </div>
                </div>

                {/* Número de dias com estilo */}
                <div className={`text-center ${getFireColor()}`}>
                    <div
                        className="text-5xl sm:text-6xl font-black drop-shadow-lg"
                        style={{
                            textShadow: streakCount >= 100
                                ? '0 0 20px rgba(168, 85, 247, 0.8)'
                                : streakCount >= 50
                                    ? '0 0 20px rgba(239, 68, 68, 0.8)'
                                    : '0 0 20px rgba(249, 115, 22, 0.8)',
                        }}
                    >
                        {streakCount} {streakCount === 1 ? 'DIA' : 'DIAS'}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold mt-2 text-foreground/80">
                        {getMotivationalText()}
                    </div>
                </div>

                {/* Barra de progresso para próximo nível */}
                {streakCount < 100 && (
                    <div className="w-48 sm:w-64 mt-2">
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${streakCount >= 50 ? 'bg-gradient-to-r from-red-500 to-purple-500' :
                                        streakCount >= 30 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                                            'bg-gradient-to-r from-yellow-400 to-orange-500'
                                    }`}
                                style={{
                                    width: streakCount >= 50
                                        ? `${((streakCount - 50) / 50) * 100}%`
                                        : `${(streakCount / 50) * 100}%`
                                }}
                            />
                        </div>
                        <div className="text-xs text-center text-muted-foreground mt-1">
                            {streakCount < 50
                                ? `${50 - streakCount} dias para Épico 🔥`
                                : `${100 - streakCount} dias para Lendário 💜`}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default StreakCelebration;
