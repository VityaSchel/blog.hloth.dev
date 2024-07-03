import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { getPlaiceholder } from 'plaiceholder'

const storagePath = process.env.STORAGE_PATH
if(!storagePath) {
  throw new Error('STORAGE_PATH is not defined')
}
const publicStorageURL = process.env.PUBLIC_STORAGE_URL
if (!publicStorageURL) {
  throw new Error('PUBLIC_STORAGE_URL is not defined')
}

type PostUploadImageResponse = {
  success: number
  file?: {
    url: string
    placeholder: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostUploadImageResponse>,
) {
  if (req.cookies['token'] !== process.env.ADMIN_TOKEN) {
    res.status(401).send({ success: 0 })
    return
  }
  if(req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }
  const filename = uuid()
  const fileRequest = await fetch(req.body.url)
  const mimeType = fileRequest.headers.get('content-type')?.split('/')[1] ?? 'jpg'
  if(!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(mimeType)) {
    console.log('Unsupported mimetype', mimeType)
    res.status(415).json({ success: 0 })
    return
  }
  const file = Buffer.from(await fileRequest.arrayBuffer())
  if(file.byteLength > 10 * 1024 * 1024) {
    res.status(413).json({ success: 0 })
    return
  }
  const extension = '.' + mimeType
  await fs.writeFile(path.join(storagePath as string, filename + extension), file, 'binary')
  res.status(200).send({
    success: 1,
    file: {
      url: path.resolve(publicStorageURL as string, filename + extension),
      placeholder: (await getPlaiceholder(file)).base64
    }
  })
}
