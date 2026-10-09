import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Calendar } from 'lucide-react';

export interface DateInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: string; // Formato ISO: YYYY-MM-DD
    onChange?: (value: string) => void;
    containerClassName?: string;
}

function isoToDisplay(iso?: string): string {
    if (!iso) return '';
    const clean = iso.slice(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
        const [y, m, d] = parts;
        if (y && m && d) {
            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
    }
    return '';
}

function displayToIso(display: string): string | null {
    const parts = display.split('/');
    if (parts.length === 3) {
        const [d, m, y] = parts;
        if (d?.length === 2 && m?.length === 2 && y?.length === 4) {
            const dayNum = parseInt(d, 10);
            const monthNum = parseInt(m, 10);
            const yearNum = parseInt(y, 10);
            if (
                monthNum >= 1 &&
                monthNum <= 12 &&
                dayNum >= 1 &&
                dayNum <= 31 &&
                yearNum >= 1900 &&
                yearNum <= 2100
            ) {
                const date = new Date(yearNum, monthNum - 1, dayNum);
                if (
                    date.getFullYear() === yearNum &&
                    date.getMonth() === monthNum - 1 &&
                    date.getDate() === dayNum
                ) {
                    return `${y}-${m}-${d}`;
                }
            }
        }
    }
    return null;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
    (
        {
            value,
            onChange,
            className = '',
            containerClassName = '',
            placeholder = 'DD/MM/AAAA',
            disabled,
            required,
            min,
            max,
            onKeyDown,
            onBlur,
            ...rest
        },
        ref
    ) => {
        const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
        const pickerRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
            setDisplayValue(isoToDisplay(value));
        }, [value]);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            // Detección si pegaron una fecha en formato ISO YYYY-MM-DD
            const trimmed = raw.trim();
            if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
                const [y, m, d] = trimmed.slice(0, 10).split('-');
                const iso = `${y}-${m}-${d}`;
                setDisplayValue(`${d}/${m}/${y}`);
                onChange?.(iso);
                return;
            }

            let digitsOnly = raw.replace(/\D/g, '').slice(0, 8);
            let formatted = digitsOnly;

            if (digitsOnly.length > 4) {
                formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
            } else if (digitsOnly.length > 2) {
                formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
            }

            // Permitir que el usuario escriba '/' explícitamente y autocompletar si escribió 1 dígito
            if (raw.endsWith('/')) {
                if (digitsOnly.length === 1) {
                    digitsOnly = `0${digitsOnly}`;
                    formatted = `${digitsOnly}/`;
                } else if (digitsOnly.length === 3) {
                    digitsOnly = `${digitsOnly.slice(0, 2)}0${digitsOnly.slice(2)}`;
                    formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/`;
                } else if (digitsOnly.length === 2 || digitsOnly.length === 4) {
                    formatted = `${formatted}/`;
                }
            }

            setDisplayValue(formatted);

            if (digitsOnly.length === 8) {
                const iso = displayToIso(formatted);
                if (iso) {
                    onChange?.(iso);
                }
            } else if (digitsOnly.length === 0) {
                onChange?.('');
            }
        };

        const handleBlurEvent = (e: React.FocusEvent<HTMLInputElement>) => {
            if (onBlur) onBlur(e);

            if (!displayValue.trim()) {
                setDisplayValue('');
                onChange?.('');
                return;
            }

            const iso = displayToIso(displayValue);
            if (iso) {
                setDisplayValue(isoToDisplay(iso));
                onChange?.(iso);
            } else {
                // Si la fecha está incompleta o es inválida, se restaura al valor previo válido
                setDisplayValue(isoToDisplay(value));
            }
        };

        const handleOpenPicker = () => {
            const el = pickerRef.current;
            if (!el) return;
            try {
                if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
                    (el as HTMLInputElement & { showPicker: () => void }).showPicker();
                } else {
                    el.focus();
                }
            } catch {
                el.focus();
            }
        };

        return (
            <div className={`relative flex items-center ${containerClassName}`}>
                <input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={handleInputChange}
                    onBlur={handleBlurEvent}
                    onKeyDown={onKeyDown}
                    maxLength={10}
                    disabled={disabled}
                    required={required}
                    className={`w-full pr-10 ${className}`}
                    {...rest}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center">
                    <button
                        type="button"
                        tabIndex={-1}
                        disabled={disabled}
                        onClick={handleOpenPicker}
                        className="w-full h-full flex items-center justify-center text-slate-400 hover:text-orange-500 transition rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Abrir selector de fecha"
                    >
                        <Calendar className="w-4 h-4" />
                    </button>
                    <input
                        ref={pickerRef}
                        type="date"
                        tabIndex={-1}
                        aria-hidden="true"
                        value={value ? value.slice(0, 10) : ''}
                        min={min}
                        max={max}
                        disabled={disabled}
                        onClick={(e) => {
                            try {
                                e.currentTarget.showPicker();
                            } catch {
                                // fallback
                            }
                        }}
                        onChange={(e) => {
                            if (e.target.value) {
                                onChange?.(e.target.value);
                            }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>
            </div>
        );
    }
);

DateInput.displayName = 'DateInput';
