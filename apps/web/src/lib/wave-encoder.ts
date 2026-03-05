/**
 * wave-encoder.ts
 * Helper to encode raw PCM float32 array samples into a standard .wav blob
 * 16-bit PCM Mono at the given sampleRate.
 */

export function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const numChannels = 1
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const dataLength = samples.length * bytesPerSample
    const headerLength = 44
    const buffer = new ArrayBuffer(headerLength + dataLength)
    const view = new DataView(buffer)

    /** Helper to write strings into the DataView */
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    // RIFF Chunk
    writeString(0, "RIFF")
    view.setUint32(4, 36 + dataLength, true) // RIFF chunk length
    writeString(8, "WAVE") // Format

    // FMT Chunk
    writeString(12, "fmt ")
    view.setUint32(16, 16, true) // Chunk size
    view.setUint16(20, 1, true) // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true) // Byte rate
    view.setUint16(32, numChannels * bytesPerSample, true) // Block align
    view.setUint16(34, bitsPerSample, true)

    // Data Chunk
    writeString(36, "data")
    view.setUint32(40, dataLength, true)

    // Convert Float32 to Int16
    let offset = headerLength
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i])) // Clamp value
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        offset += 2
    }

    return new Blob([view], { type: "audio/wav" })
}
