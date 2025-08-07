
import React, { useState, useEffect } from 'react';

const RIF_PREFIXES = ['V', 'E', 'J', 'P', 'G', 'C'];

interface RifInputProps {
    label: string;
    value: string | null | undefined;
    onChange: (value: string) => void;
    onBlur?: () => void;
    readOnly?: boolean;
    required?: boolean;
    selectTabIndex?: number;
    numberTabIndex?: number;
}

const RifInput: React.FC<RifInputProps> = ({ label, value, onChange, onBlur, readOnly, required, selectTabIndex, numberTabIndex }) => {
    const [prefix, setPrefix] = useState('J');
    const [number, setNumber] = useState('');

    useEffect(() => {
        // This effect synchronizes the internal state with the parent's value prop.
        if (value) {
            const cleanedValue = value.replace(/-/g, '');
            const p = cleanedValue.charAt(0).toUpperCase();
            if (RIF_PREFIXES.includes(p)) {
                setPrefix(p);
                setNumber(cleanedValue.substring(1));
            } else {
                // If value from parent has no valid prefix, default to J but keep the number
                setPrefix('J');
                setNumber(cleanedValue);
            }
        } else {
            // If the parent value is empty, reset to visual default.
            setPrefix('J');
            setNumber('');
        }
    }, [value]);
    
    const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPrefix = e.target.value;
        setPrefix(newPrefix);
        // Always notify parent on change
        onChange(`${newPrefix}${number}`);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
        setNumber(newNumber);
        onChange(`${prefix}${newNumber}`);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text').toUpperCase();
        const cleanedPastedText = pastedText.replace(/[^A-Z0-9]/g, '');

        const foundPrefix = RIF_PREFIXES.find(p => cleanedPastedText.startsWith(p));
        if (foundPrefix) {
            const newNumber = cleanedPastedText.substring(foundPrefix.length).slice(0, 9);
            setPrefix(foundPrefix);
            setNumber(newNumber);
            onChange(`${foundPrefix}${newNumber}`);
        } else {
            const newNumber = cleanedPastedText.replace(/[^0-9]/g, '').slice(0, 9);
            // Keep current prefix if pasted text doesn't have one
            setNumber(newNumber);
            onChange(`${prefix}${newNumber}`);
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
                    tabIndex={selectTabIndex}
                    className="bg-ciec-bg border border-ciec-border rounded-l-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70 z-10"
                >
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
                    required={required}
                    tabIndex={numberTabIndex}
                    className="w-full bg-ciec-bg border-t border-b border-r border-ciec-border rounded-r-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70 -ml-px"
                />
            </div>
        </div>
    );
};

export default RifInput;
