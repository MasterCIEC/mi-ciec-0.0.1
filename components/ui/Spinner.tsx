
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'border-ciec-blue' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-16 h-16',
    };

    return (
        <div className="flex justify-center items-center">
            <div
                className={`${sizes[size]} animate-spin rounded-full border-4 border-solid ${color} border-t-transparent`}
            ></div>
        </div>
    );
};

export default Spinner;
