import { createTRPCReact } from '@trpc/react-query'

import type { IServerRouter } from '@server/router'

export const trpc = createTRPCReact<IServerRouter>()
