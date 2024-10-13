export const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

export const formatCommitId = (commitId: string) => {
  return commitId.substring(0, 7)
}
export const formatMessage = (message: string) => {
  return truncateText(message, 50)
}
export const formatAuthor = (author: string) => {
  return truncateText(author, 10)
}
