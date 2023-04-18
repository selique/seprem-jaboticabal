import React from 'react'

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  color?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
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
        ${color === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}
        ${color === 'primary' ? 'hover:bg-blue-700' : 'hover:text-white'}
        ${color === 'secondary' ? 'bg-gray-500' : 'text-white'}
        ${color === 'secondary' ? 'hover:bg-gray-700' : 'hover:text-white'}
        text-white font-bold py-2 px-4 rounded`}
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
          ${color === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}
          ${color === 'primary' ? 'hover:bg-blue-700' : 'hover:text-white'}
          ${color === 'secondary' ? 'bg-gray-500' : 'text-white'}
          ${color === 'secondary' ? 'hover:bg-gray-700' : 'hover:text-white'}
          text-white font-bold py-2 px-4 rounded`}
        {...props}
      >
        {children}
      </button>
    )
  }
}

export default Button
