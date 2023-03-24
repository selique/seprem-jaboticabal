import React from 'react'

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  color?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  color = 'primary',
  children,
  onClick,
}) => {
  return (
    <button
      type={type}
      className={`
        ${color === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}
        ${color === 'primary' ? 'hover:bg-blue-700' : 'hover:bg-gray-700'}
        ${color === 'secondary' ? 'text-gray-700' : 'text-white'}
        ${color === 'secondary' ? 'hover:text-gray-900' : 'hover:text-white'}
        text-white font-bold py-2 px-4 rounded`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button
