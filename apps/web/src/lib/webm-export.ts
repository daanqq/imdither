import type { AudioTrack, FrameSequence } from "@workspace/core"
import {
  Output,
  BufferTarget,
  WebMOutputFormat,
  EncodedVideoPacketSource,
  EncodedAudioPacketSource,
  EncodedPacket,
} from "mediabunny"
import type { VideoExportSettings } from "./motion-types"

export async function encodeFrameSequenceToWebM(
  frameSequence: FrameSequence,
  settings: VideoExportSettings,
  audioTrack?: AudioTrack
): Promise<Uint8Array> {
  const { frames, sourceWidth, sourceHeight, durationsMs } = frameSequence
  const frameCount = frames.length
  if (frameCount === 0) throw new Error("No frames to encode")

  if (typeof VideoEncoder === "undefined") {
    throw new Error("WebCodecs VideoEncoder not available")
  }
  if (typeof VideoFrame === "undefined") {
    throw new Error("WebCodecs VideoFrame not available")
  }
  if (typeof createImageBitmap === "undefined") {
    throw new Error("createImageBitmap not available")
  }

  const target = new BufferTarget()
  const output = new Output({
    target,
    format: new WebMOutputFormat(),
  })

  const vp9Source = new EncodedVideoPacketSource("vp9")
  output.addVideoTrack(vp9Source, {
    frameRate: Math.round(1000 / (durationsMs[0] ?? 100)),
  })

  let audioSource: EncodedAudioPacketSource | undefined
  if (audioTrack) {
    audioSource = new EncodedAudioPacketSource(audioTrack.codec as never)
    output.addAudioTrack(audioSource, {
      sampleRate: audioTrack.sampleRate,
      numberOfChannels: audioTrack.numberOfChannels,
    })
  }

  await output.start()

  const frameDurationSec = (durationsMs[0] ?? 100) / 1000

  const encoder = new VideoEncoder({
    output(chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) {
      const data = new Uint8Array(chunk.byteLength)
      chunk.copyTo(data)
      const packet = new EncodedPacket(
        data,
        chunk.type === "key" ? "key" : "delta",
        chunk.timestamp! / 1_000_000,
        chunk.duration! / 1_000_000
      )
      vp9Source.add(packet, meta)
    },
    error(error: Error) {
      throw error
    },
  })

  const codecString = await resolveVp9Codec(sourceWidth, sourceHeight)

  const crf = Math.max(0, Math.min(63, settings.crf))
  const quality = 1 - crf / 63
  const pixels = sourceWidth * sourceHeight
  // Base bitrate per resolution tier + CRF scaling
  const baseBitrate =
    pixels <= 38400 // < 240p
      ? 100_000
      : pixels <= 122_880 // < 360p
        ? 250_000
        : pixels <= 307_200 // < 480p
          ? 500_000
          : pixels <= 921_600 // < 720p
            ? 1_500_000
            : 4_000_000
  // CRF 0 → 5× base, CRF 63 → 0.1× base
  const bitrate = Math.round(baseBitrate * (0.1 + quality * 4.9))

  const encoderConfig: VideoEncoderConfig = {
    codec: codecString,
    width: sourceWidth,
    height: sourceHeight,
    bitrate,
    bitrateMode: "variable",
  }

  encoder.configure(encoderConfig)

  for (let i = 0; i < frameCount; i++) {
    const frame = frames[i]
    const timestampUs = i * frameDurationSec * 1_000_000
    const durationUs = frameDurationSec * 1_000_000

    const imageData = new ImageData(
      new Uint8ClampedArray(frame.data),
      frame.width,
      frame.height
    )

    const imageBitmap = await createImageBitmap(imageData)

    const videoFrame = new VideoFrame(imageBitmap, {
      timestamp: timestampUs,
      duration: durationUs,
    })
    imageBitmap.close()

    encoder.encode(videoFrame)
    videoFrame.close()
  }

  await encoder.flush()
  encoder.close()
  vp9Source.close()

  if (audioSource && audioTrack) {
    const packet = new EncodedPacket(
      new Uint8Array(audioTrack.data),
      "key",
      0,
      frameCount * frameDurationSec
    )
    audioSource.add(packet)
    audioSource.close()
  }

  await output.finalize()

  return new Uint8Array(target.buffer!)
}

const VP9_CODEC_CANDIDATES = [
  "vp09.00.10.08",
  "vp09.00.10.08.00.00.00.00",
  "vp9",
]

async function resolveVp9Codec(width: number, height: number): Promise<string> {
  for (const codec of VP9_CODEC_CANDIDATES) {
    try {
      const supported = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
      })
      if (supported.supported) return codec
    } catch {
      // try next
    }
  }
  throw new Error("VP9 not supported by this browser")
}
