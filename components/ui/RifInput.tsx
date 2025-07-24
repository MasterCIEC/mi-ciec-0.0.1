import React, { useState, useEffect } from 'react';

const RIF_PREFIXES = ['V', 'E', 'J', 'P', 'G', 'C'];

interface RifInputProps {
    label: string;
    value: string | null | undefined;
    onChange: (value: string) => void;
    onBlur?: () => void;
    readOnly?: boolean;
    required?: boolean;
}

const RifInput: React.FC<RifInputProps> = ({ label, value, onChange, onBlur, readOnly, required }) => {
    const [prefix, setPrefix] = useState('');
    const [number, setNumber] = useState('');

    useEffect(() => {
        if (value) {
            const parts = value.split('-');
            if (parts.length > 0) {
                const p = parts[0].toUpperCase();
                if (RIF_PREFIXES.includes(p)) {
                    setPrefix(p);
                    setNumber(parts.length > 1 ? parts.slice(1).join('').replace(/[^0-9]/g, '') : '');
                } else {
                    const numOnly = value.replace(/[^0-9]/g, '');
                    setNumber(numOnly);
                }
            }
        } else {
            setPrefix('');
            setNumber('');
        }
    }, [value]);
    
    const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPrefix = e.target.value;
        setPrefix(newPrefix);
        onChange(`${newPrefix}-${number}`);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
        setNumber(newNumber);
        onChange(`${prefix}-${newNumber}`);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text').toUpperCase();
        
        const foundPrefix = RIF_PREFIXES.find(p => pastedText.startsWith(p));

        if (foundPrefix) {
            const rest = pastedText.substring(foundPrefix.length);
            const newNumber = rest.replace(/[^0-9]/g, '').slice(0, 9);
            setPrefix(foundPrefix);
            setNumber(newNumber);
            onChange(`${foundPrefix}-${newNumber}`);
        } else {
            const newNumber = pastedText.replace(/[^0-9]/g, '').slice(0, 9);
            setNumber(newNumber);
            onChange(`${prefix}-${newNumber}`);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}{required && '*'}</label>
            <div className="flex items-center">
                <select
                    value={prefix}
                    onChange={handlePrefixChange}
                    disabled={readOnly}
                    className="bg-ciec-bg border border-ciec-border rounded-l-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70 z-10"
                >
                    <option value="">-</option>
                    {RIF_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                    type="text"
                    value={number}
                    onChange={handleNumberChange}
                    onPaste={handlePaste}
                    onBlur={onBlur}
                    maxLength={9}
                    placeholder="123456789"
                    disabled={readOnly}
                    className="w-full bg-ciec-bg border-t border-b border-r border-ciec-border rounded-r-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70 -ml-px"
                />
            </div>
        </div>
    );
};

export default RifInput;
