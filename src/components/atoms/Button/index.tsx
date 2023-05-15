import React from 'react'

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  color?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
  disabled?: boolean
  href?: string
  onClick?: () => void
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  color = 'primary',
  children,
  className,
  onClick,
  disabled,
  href,
  ...props
}) => {
  if (href !== undefined) {
    return (
      <a
        href={href}
        className={`
          min-h-[50px]
          flex
          items-center
          justify-center
          text-white font-bold rounded
          ${
            color === 'primary' &&
            'bg-primary hover:bg-secondary text-white hover:text-white'
          }
          ${
            color === 'secondary' &&
            'bg-gray-600 hover:bg-gray-800 text-white hover:text-white'
          }
          ${color === 'danger' && 'bg-red-600 hover:bg-red-400'}
          ${disabled && 'opacity-50 cursor-not-allowed'}

          ${className}
        `}
        {...props}
      >
        {children}
      </a>
    )
  } else {
    return (
      <button
        type={type}
        className={`
        text-white font-bold rounded min-h-[50px] min-w-[60px] sm:min-w-[100px]
        ${
          color === 'primary' &&
          'bg-primary hover:bg-secondary text-white hover:text-white'
        }
        ${
          color === 'secondary' &&
          'bg-gray-600 hover:bg-gray-800 text-white hover:text-white'
        }
        ${color === 'danger' && 'bg-red-600 hover:bg-red-400'}
        ${disabled && 'opacity-50 cursor-not-allowed'}
        ${className}
        `}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    )
  }
}

export default Button
