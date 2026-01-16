class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0];
            // copy the data to avoid issues with transfers/buffer re-use if we optimized later
            // for now, strict copy is safe.
            // However, efficient transfer is to just post.
            // input[0] is a Float32Array.
            if (channelData) {
                this.port.postMessage(channelData);
            }
        }
        // Keep processor alive
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
