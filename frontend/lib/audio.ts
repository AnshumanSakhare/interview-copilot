// Audio capture and PCM16 encoding utilities

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  bitDepth: number;
}

export const AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000, // 16kHz required by Gemini Live
  channelCount: 1,   // Mono
  bitDepth: 16,      // 16-bit PCM
};

export class AudioCapture {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isRecording = false;
  private onChunk: (chunk: Uint8Array) => void = () => {};

  async start(onChunk: (chunk: Uint8Array) => void): Promise<void> {
    this.onChunk = onChunk;
    
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: AUDIO_CONFIG.sampleRate,
        },
      });

      // Create audio context with matching sample rate
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.sampleRate,
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Use ScriptProcessor for real-time audio chunks
      const bufferSize = 4096;
      this.processor = this.audioContext.createScriptProcessor(
        bufferSize,
        1, // input channels
        1  // output channels
      );

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatToPCM16(inputData);
        this.onChunk(pcm16);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isRecording = true;
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }

  stop(): void {
    this.isRecording = false;
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private floatToPCM16(float32Array: Float32Array): Uint8Array {
    const length = float32Array.length;
    const int16 = new Int16Array(length);
    
    for (let i = 0; i < length; i++) {
      let sample = float32Array[i];
      sample = Math.max(-1, Math.min(1, sample)); // Clamp to [-1, 1]
      sample = sample * 32767; // Convert to 16-bit range
      int16[i] = Math.round(sample);
    }
    
    return new Uint8Array(int16.buffer);
  }
}

export function detectFillers(text: string): string[] {
  const fillers = ['uh', 'um', 'erm', 'like', 'you know', 'basically', 'literally', 'actually'];
  const lowerText = text.toLowerCase();
  const found = fillers.filter(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    return regex.test(lowerText);
  });
  return [...new Set(found)]; // Unique fillers
}
