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
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskDigit = mask[i];
    
    if (maskDigit === '9') {
      // Aceita apenas dígitos
      if (/\d/.test(value[valueIndex])) {
        maskedValue += value[valueIndex];
        valueIndex++;
      } else {
        valueIndex++;
        i--;
      }
    } else {
      // Caractere fixo da máscara (., -, /, etc)
      maskedValue += maskDigit;
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

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(applyMask(value, mask, maskChar, alwaysShowMask));
      }
    }, [value, mask, maskChar, alwaysShowMask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = removeMask(e.target.value);
      const maskedValue = applyMask(rawValue, mask, maskChar);
      
      setInternalValue(maskedValue);
      
      if (onChange) {
        // Criar um novo evento com o valor sem máscara
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

    return (
      <Input
        {...props}
        ref={ref}
        value={internalValue}
        onChange={handleChange}
        className={cn(className)}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };
