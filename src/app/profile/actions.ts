'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateProfileCache() {
  revalidatePath('/') // Revalidate homepage
  revalidatePath('/profile') // Revalidate profile page
}






























