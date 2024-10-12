import dayjs from 'dayjs'

export const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD')
}

export const formatDateTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}