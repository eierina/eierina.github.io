import Link from 'next/link'
import { slug } from 'github-slugger'
interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  return (
    <div
      key={text}
      className="mr-3 inline-flex items-center rounded-full border border-transparent bg-gray-300/30 px-2.5 py-0.5 text-sm font-medium lowercase text-primary-500 dark:bg-gray-800/80"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3 -translate-x-0.5"
      >
        <line x1="4" x2="20" y1="9" y2="9"></line>
        <line x1="4" x2="20" y1="15" y2="15"></line>
        <line x1="10" x2="8" y1="3" y2="21"></line>
        <line x1="16" x2="14" y1="3" y2="21"></line>
      </svg>
      {text.split(' ').join('-')}
    </div>
  )
}

export default Tag
