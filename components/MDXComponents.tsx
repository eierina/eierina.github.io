import TOCInline from '@block0/pliny/ui/TOCInline'
import Pre from '@block0/pliny/ui/Pre'
import BlogNewsletterForm from '@block0/pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
}
