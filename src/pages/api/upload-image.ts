import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { getPlaiceholder } from 'plaiceholder'
import formidable from 'formidable'
import sharp from 'sharp'

export const config = {
  api: {
    bodyParser: false,
  },
}


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
  error?: string
  file?: {
    url: string
    placeholder: string
    width: number
    height: number
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
  const form = formidable({
    allowEmptyFiles: false,
    uploadDir: storagePath as string,
    filename: (_, ext) => filename + ext,
    keepExtensions: true
  })
  const [, files] = await form.parse(req)
  if (Object.values(files).length !== 1) {
    res.status(413).json({ success: 0 })
    return
  }
  const file = Object.values(files)[0]?.[0] as import('formidable').File
  if(file.size > 10 * 1024 * 1024) {
    res.status(413).json({ success: 0 })
    return
  }
  const buffer = await fs.readFile(file.filepath)
  const extension = path.extname(file.originalFilename ?? file.newFilename).toLowerCase()
  const { width, height } = await sharp(buffer).metadata()
  if(!width || !height) {
    res.status(500).json({ success: 0, error: 'No width or height metadata' })
    return
  }
  res.status(200).send({
    success: 1,
    file: {
      url: path.resolve(publicStorageURL as string, filename + extension),
      placeholder: (await getPlaiceholder(await fs.readFile(file.filepath))).base64,
      width,
      height
    }
  })
}
