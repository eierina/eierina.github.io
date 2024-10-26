import TOCInline from '@eierina/pliny/ui/TOCInline'
import Pre from '@eierina/pliny/ui/Pre'
import BlogNewsletterForm from '@eierina/pliny/ui/BlogNewsletterForm'
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
