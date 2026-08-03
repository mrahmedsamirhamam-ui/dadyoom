export default class DadVoice {
  private audio: HTMLAudioElement | null = null;

  stop(): void {
    this.audio?.pause();
    this.audio = null;
  }

  async playBlob(blob: Blob): Promise<void> {
    this.stop();

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    this.audio = audio;

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        this.audio = null;
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        this.audio = null;
        reject(new Error("فشل تشغيل صوت ضاد."));
      };

      audio.play().catch(reject);
    });
  }
}
