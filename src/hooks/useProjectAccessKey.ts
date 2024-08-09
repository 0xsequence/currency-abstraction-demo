export const useProjectAccessKey = () => {
  const projectAccessKey = import.meta.env.VITE_PROJECT_ACCESS_KEY || 'AQAAAAAAADVH8R2AGuQhwQ1y8NaEf1T7PJM'

  return projectAccessKey
}
