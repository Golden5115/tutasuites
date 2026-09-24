export function getDateBounds(dateFilter: string = "today") {
  const now = new Date()
  if (dateFilter === "yesterday") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
    return { gte: start, lte: end }
  }
  if (dateFilter === "week") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    return { gte: start }
  }
  if (dateFilter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    return { gte: start }
  }
  if (dateFilter === "all") {
    return undefined
  }
  // Default: today
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { gte: start, lte: end }
}
