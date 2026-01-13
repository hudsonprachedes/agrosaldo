import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type MaskedInputProps = Omit<React.ComponentProps<typeof Input>, 'onChange'> & {
  mask: string;
  value?: string;
  alwaysShowMask?: boolean;
  maskChar?: string | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

// Função auxiliar para aplicar máscara
function applyMask(value: string, mask: string, maskChar: string | null = null, alwaysShowMask = false): string {
  if (!value) return alwaysShowMask && maskChar ? mask.replace(/9/g, maskChar) : '';
  
  let maskedValue = '';
  let valueIndex = 0;
  let maskIndex = 0;
  
  // Aplica a máscara enquanto houver caracteres
  while (valueIndex < value.length) {
    if (maskIndex >= mask.length) {
      // Se a máscara acabou mas ainda há dígitos, apenas adiciona (para permitir transição)
      maskedValue += value[valueIndex];
      valueIndex++;
      continue;
    }
    
    const maskDigit = mask[maskIndex];
    
    if (maskDigit === '9') {
      // Aceita apenas dígitos
      if (/\d/.test(value[valueIndex])) {
        maskedValue += value[valueIndex];
        valueIndex++;
        maskIndex++;
      } else {
        valueIndex++;
      }
    } else {
      // Caractere fixo da máscara (., -, /, etc)
      maskedValue += maskDigit;
      maskIndex++;
      if (value[valueIndex] === maskDigit) {
        valueIndex++;
      }
    }
  }
  
  return maskedValue;
}

// Função auxiliar para remover máscara
function removeMask(value: string): string {
  return value.replace(/[^\d]/g, '');
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    {
      mask,
      className,
      value = '',
      alwaysShowMask = false,
      maskChar = null,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(() => 
      applyMask(value, mask, maskChar, alwaysShowMask)
    );

    // Atualizar quando mask ou value mudarem
    React.useEffect(() => {
      if (value !== undefined) {
        const rawValue = value.replace(/\D/g, '');
        const maskedValue = applyMask(rawValue, mask, maskChar, alwaysShowMask);
        setInternalValue(maskedValue);
      }
    }, [value, mask, maskChar, alwaysShowMask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove tudo que não é número
      const rawValue = e.target.value.replace(/\D/g, '');
      
      // Limita a 14 dígitos (CNPJ máximo)
      const limitedValue = rawValue.slice(0, 14);
      const maskedValue = applyMask(limitedValue, mask, maskChar);
      
      setInternalValue(maskedValue);
      
      if (onChange) {
        // Criar um novo evento com o valor mascarado
        const newEvent = {
          ...e,
          target: {
            ...e.target,
            value: maskedValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(newEvent);
      }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Bloqueia qualquer tecla que não seja número
      if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={internalValue}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        inputMode="numeric"
        className={cn(className)}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };
