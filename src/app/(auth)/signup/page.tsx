import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your account',
}

const Page = () => {
  redirect('/auth/sign-up')
}

export default Page
