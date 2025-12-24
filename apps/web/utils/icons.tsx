import React from 'react';
import {
    Car, Home, Plane, Laptop, Smartphone, Gift, GraduationCap,
    Gem, Baby, Dog, Bike, PiggyBank, Wallet, Camera, Music,
    Gamepad, Coffee, Shirt, Watch, Heart
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ElementType> = {
    'Car': Car,
    'Home': Home,
    'Plane': Plane,
    'Laptop': Laptop,
    'Phone': Smartphone,
    'Gift': Gift,
    'Education': GraduationCap,
    'Jewelry': Gem,
    'Baby': Baby,
    'Pet': Dog,
    'Bike': Bike,
    'Savings': PiggyBank,
    'Wallet': Wallet,
    'Camera': Camera,
    'Music': Music,
    'Gaming': Gamepad,
    'Coffee': Coffee,
    'Clothing': Shirt,
    'Watch': Watch,
    'Health': Heart,
};

export const getIcon = (iconName: string, props: any = {}) => {
    const IconComponent = ICON_MAP[iconName] || PiggyBank;
    return <IconComponent {...props} />;
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
