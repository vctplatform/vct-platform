import * as React from 'react';
import Image from 'next/image';

export const UI_Logo = ({ size = 48, className = "" }: { size?: number, className?: string }) => {
    return (
        <Image
            src="/logo-vct.png"
            alt="VCT Platform"
            width={size}
            height={size}
            className={className}
            style={{
                objectFit: 'contain',
                borderRadius: size > 32 ? 8 : 4,
                filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.15))',
            }}
            priority={size >= 48}
        />
    );
};
