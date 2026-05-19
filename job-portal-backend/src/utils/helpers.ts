export const generatePublicId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const extractHashtags = (text) => {
  return text.match(/#\w+/g) || []
}