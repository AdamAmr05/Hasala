import React from 'react';
import { ShoppingBag, Coffee, Home, Car, Zap, MoreHorizontal, HandHeart, Utensils } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
    'Food': <Utensils size={18} />,
    'Dining': <Coffee size={18} />,
    'Shopping': <ShoppingBag size={18} />,
    'Housing': <Home size={18} />,
    'Transport': <Car size={18} />,
    'Utilities': <Zap size={18} />,
    'Giving': <HandHeart size={18} />,
    'General': <MoreHorizontal size={18} />,
    'Other': <MoreHorizontal size={18} />,
};

interface Props {
    category: string;
    size?: number;
    className?: string;
}

const CategoryIcon: React.FC<Props> = ({ category, size = 18, className }) => {
    const Icon = ICONS[category] || <MoreHorizontal size={size} />;
    // If the icon in the map is a ReactNode (already instantiated), we can't easily change size via prop if it's hardcoded.
    // Better to store components or just clone element.
    // For simplicity matching the existing map structure:
    return (
        <div className={`flex items-center justify-center ${className}`}>
            {ICONS[category] || <MoreHorizontal size={size} />}
        </div>
    );
};

export default CategoryIcon;
