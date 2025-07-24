import React, { useState, useEffect } from 'react';

const PHONE_PREFIXES = ['0412', '0414', '0424', '0416', '0426', '0212', '0241', '0242', '0245', '0249'];

interface PhoneInputProps {
    label: string;
    value: string | null | undefined;
    onChange: (value: string) => void;
    readOnly?: boolean;
    required?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ label, value, onChange, readOnly, required }) => {
    const [prefix, setPrefix] = useState('');
    const [number, setNumber] = useState('');

    useEffect(() => {
        const fullNumber = value ? value.replace(/[^0-9]/g, '') : '';
        if (fullNumber) {
            let found = false;
            for (const p of PHONE_PREFIXES) {
                if (fullNumber.startsWith(p)) {
                    setPrefix(p);
                    setNumber(fullNumber.substring(p.length));
                    found = true;
                    break;
                }
            }
            if (!found) {
                setNumber(fullNumber);
            }
        } else {
            setPrefix('');
            setNumber('');
        }
    }, [value]);
    
    const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPrefix = e.target.value;
        setPrefix(newPrefix);
        onChange(`${newPrefix}${number}`);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
        setNumber(newNumber);
        onChange(`${prefix}${newNumber}`);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const cleaned = pastedText.replace(/[^0-9]/g, '');
        let processedNumber = cleaned;

        if (processedNumber.startsWith('58')) {
            processedNumber = '0' + processedNumber.substring(2);
        }

        let found = false;
        for (const p of PHONE_PREFIXES) {
            if (processedNumber.startsWith(p)) {
                const newPrefix = p;
                const newNumber = processedNumber.substring(p.length).slice(0, 7);
                setPrefix(newPrefix);
                setNumber(newNumber);
                onChange(`${newPrefix}${newNumber}`);
                found = true;
                break;
            }
        }
        
        if (!found) {
             const newNumber = processedNumber.slice(0, 7);
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
                    className="bg-ciec-bg border border-ciec-border rounded-l-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70 z-10"
                >
                    <option value="">- Código -</option>
                    {PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                    type="text"
                    value={number}
                    onChange={handleNumberChange}
                    onPaste={handlePaste}
                    maxLength={7}
                    placeholder="1234567"
                    disabled={readOnly}
                    className="w-full bg-ciec-bg border-t border-b border-r border-ciec-border rounded-r-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70 -ml-px"
                />
            </div>
        </div>
    );
};

export default PhoneInput;
