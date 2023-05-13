import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { TriangleRightIcon } from '@radix-ui/react-icons'
import { clsx } from 'clsx'
import React from 'react'

interface CollapsibleProps {
  children?: React.ReactNode
  title: string
}

const Collapsible = ({ title, children }: CollapsibleProps) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <CollapsiblePrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <CollapsiblePrimitive.Trigger
        className={clsx(
          'group flex w-full select-none items-center justify-between rounded-md px-8 py-4 text-left text-3xl font-bold',
          'bg-secondary hover:bg-primary text-gray-50 hover:text-white'
        )}
      >
        <h2 className="mb-2 text-3xl font-bold">{title}</h2>
        <TriangleRightIcon className="gray-50 transform duration-300 ease-in-out group-radix-state-open:rotate-90 w-auto h-10" />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="my-2 flex flex-col space-y-10">
        {children}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Collapsible }
