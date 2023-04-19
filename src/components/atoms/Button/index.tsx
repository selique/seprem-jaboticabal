import React from 'react'

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  color?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  href?: string
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  color = 'primary',
  children,
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
          ${color === 'primary' ? 'bg-blue-600' : 'bg-gray-600'}
          ${color === 'primary' ? 'hover:bg-blue-800' : 'hover:text-white'}
          ${color === 'secondary' ? 'bg-gray-600' : 'text-white'}
          ${color === 'secondary' ? 'hover:bg-gray-800' : 'hover:text-white'}
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
        text-white font-bold rounded min-h-[50px]
          ${color === 'primary' ? 'bg-blue-600' : 'bg-gray-600'}
          ${color === 'primary' ? 'hover:bg-blue-800' : 'hover:text-white'}
          ${color === 'secondary' ? 'bg-gray-600' : 'text-white'}
          ${color === 'secondary' ? 'hover:bg-gray-800' : 'hover:text-white'}
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
}

export default Button
