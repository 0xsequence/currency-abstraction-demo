import { SequenceAPIClient } from '@0xsequence/api'
import { useMemo } from 'react'

import { useProjectAccessKey } from './useProjectAccessKey'

export const useAPIClient = () => {
  const projectAccessKey = useProjectAccessKey()

  const clientUrl = import.meta.env.VITE_SEQUENCE_API_URL || 'https://api.sequence.app'

  const apiClient = useMemo(() => {
    return new SequenceAPIClient(clientUrl, projectAccessKey)
  }, [clientUrl, projectAccessKey])

  return apiClient
}
