const acTL = new TextEncoder().encode("acTL")

export async function hasAcTlChunk(file: File): Promise<boolean> {
  try {
    const header = await readFileHeader(file)
    return scanForAcTl(header)
  } catch {
    return false
  }
}

async function readFileHeader(file: File): Promise<Uint8Array> {
  const blob = file.slice(0, 64)
  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}

function scanForAcTl(header: Uint8Array): boolean {
  // acTL after PNG signature (8) + IHDR chunk (4 len + 4 type + 13 data + 4 CRC)
  // Minimum offset: 33 bytes. We need at least 41 bytes to read the chunk type.
  if (header.length < 41) {
    return false
  }
  // Check PNG signature
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < 8; i++) {
    if (header[i] !== signature[i]) return false
  }
  // acTL is always the chunk immediately after IHDR (offset 37)
  // Use direct offset check — no loop needed for valid PNG structure
  if (
    header.length >= 41 &&
    header[37] === acTL[0] &&
    header[38] === acTL[1] &&
    header[39] === acTL[2] &&
    header[40] === acTL[3]
  ) {
    return true
  }
  return false
}
