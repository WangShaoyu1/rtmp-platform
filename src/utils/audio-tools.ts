/**
 * Get the duration of an audio file.
 * @param {string | Blob} audioSource - The audio source (URL or Blob object).
 * @returns {Promise<number>} The duration of the audio in seconds.
 */
export function getAudioDuration(audioSource: string | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext ||
      // @ts-ignore
      window.webkitAudioContext)();

    let source: string;

    if (typeof audioSource === 'string') {
      // If audioSource is a URL
      source = audioSource;
    } else if (audioSource instanceof Blob) {
      // If audioSource is a Blob object
      source = URL.createObjectURL(audioSource);
    } else {
      reject(new Error('Invalid audio source'));

      return;
    }

    fetch(source)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        const duration = audioBuffer.duration;

        resolve(duration);

        // Release object URL if created
        if (audioSource instanceof Blob) {
          URL.revokeObjectURL(source);
        }

        // Close AudioContext
        audioContext.close();
      })
      .catch((error) => {
        reject(error);
        if (audioSource instanceof Blob) {
          URL.revokeObjectURL(source);
        }
        audioContext.close();
      });
  });
}
