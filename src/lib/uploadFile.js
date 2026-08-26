import { supabase } from './supabase'

const BUCKET = 'candidate-files'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB guardrail from build brief section 9

/**
 * Uploads a file to Supabase Storage under the given folder.
 * Throws if the file exceeds the 5MB guardrail — callers should catch
 * this and show the user a warning rather than silently proceeding.
 */
export async function uploadFile(file, folder) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('FILE_TOO_LARGE')
  }

  const path = `${folder}/${Date.now()}-${file.name}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
