interface InputProps {
  id: string
  label: string
  type: string
  placeholder?: string
  required?: boolean
  register: any
  className?: string
}

const InputField: React.FC<InputProps> = ({
  id,
  label,
  type,
  placeholder,
  required,
  register,
  ...customProps
}) => {
  return (
    <div className="mb-4">
      <label
        className="block text-gray-700 text-sm font-bold mb-2"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${customProps.className}`}
        id={id}
        type={type}
        placeholder={placeholder}
        {...register(id, { required: required })}
        {...customProps}
      />
    </div>
  )
}

export default InputField
