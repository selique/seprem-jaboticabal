import React, { ForwardedRef } from 'react'
import { FieldError } from 'react-hook-form'
import InputMask, { ReactInputMask } from 'react-input-mask'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  type: string
  placeholder?: string
  className?: string
  mask?: string
  error?: FieldError
}

const InputField = React.forwardRef<ReactInputMask, InputProps>(
  function InputField(
    { id, label, type, placeholder, mask, className, error, ...props },
    ref
  ) {
    return (
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor={id}
        >
          {label}
        </label>
        {mask ? (
          <InputMask
            mask={mask}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              className ?? ''
            } 
            ${error ? 'border-red-500' : ''}`}
            id={id}
            type={type}
            placeholder={placeholder}
            ref={ref as ForwardedRef<ReactInputMask>}
            {...props}
          />
        ) : (
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              className ?? ''
            } 
            ${error ? 'border-red-500' : ''}`}
            id={id}
            type={type}
            placeholder={placeholder}
            ref={ref as ForwardedRef<HTMLInputElement>}
            {...props}
          />
        )}
        {error?.message && (
          <small className="text-red-500 text-xs font-bold">
            {error.message ?? 'Campo obrigatório'}
          </small>
        )}
      </div>
    )
  }
)

InputField.displayName = 'InputField'

export default InputField
