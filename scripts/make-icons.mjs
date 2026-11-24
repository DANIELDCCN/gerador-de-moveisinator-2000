import { deflateSync } from "node:zlib"
import { mkdirSync, writeFileSync } from "node:fs"

function crc32(buf) {
  let c = ~0
  for (const byte of buf) {
    c ^= byte
    for (let bit = 0; bit < 8; bit += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc(size * size * 4)
  const pixel = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const index = (y * size + x) * 4
    raw[index] = r
    raw[index + 1] = g
    raw[index + 2] = b
    raw[index + 3] = 255
  }
  paint(pixel, size)
  const stride = size * 4
  const scan = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    scan[y * (stride + 1)] = 0
    raw.copy(scan, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scan)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

function chest(pixel, size) {
  const margin = Math.round(size * 0.16)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) pixel(x, y, 251, 247, 239)
  }
  const left = margin
  const top = margin
  const right = size - margin
  const bottom = size - margin
  for (let t = 0; t < Math.max(3, Math.round(size * 0.02)); t += 1) {
    for (let x = left; x < right; x += 1) {
      pixel(x, top + t, 22, 22, 22)
      pixel(x, bottom - 1 - t, 22, 22, 22)
    }
    for (let y = top; y < bottom; y += 1) {
      pixel(left + t, y, 22, 22, 22)
      pixel(right - 1 - t, y, 22, 22, 22)
    }
  }
  const rows = 4
  const innerTop = top + Math.round(size * 0.04)
  const innerBottom = bottom - Math.round(size * 0.04)
  const innerLeft = left + Math.round(size * 0.06)
  const rowH = (innerBottom - innerTop) / rows
  for (let row = 1; row < rows; row += 1) {
    const y = Math.round(innerTop + row * rowH)
    for (let x = left; x < right; x += 1) pixel(x, y, 22, 22, 22)
  }
  for (let row = 0; row < rows; row += 1) {
    const y = Math.round(innerTop + row * rowH + rowH / 2)
    for (let x = innerLeft; x < innerLeft + Math.round(size * 0.12); x += 1) pixel(x, y, 22, 22, 22)
  }
}

mkdirSync("public/icons", { recursive: true })
writeFileSync("public/icons/icon-192.png", png(192, chest))
writeFileSync("public/icons/icon-512.png", png(512, chest))
