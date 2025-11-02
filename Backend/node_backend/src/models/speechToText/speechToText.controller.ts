import WebSocket from "ws";
import { join } from "path";
import { spawn } from "child_process";
import { SpeechClient } from "@google-cloud/speech";

export function initSpeechWebSocket(server: any) {
    const wss = new WebSocket.Server({ server, path: "/speech/ws" });
    const keyPath = join(__dirname, "../../config/gcp_cred.json");
    console.log(keyPath);
    
    wss.on("connection", (ws) => {
        console.log("WebSocket connected");
        
        let hasReceivedAudio = false; // Track if we received any audio data
        let isClosing = false; // Prevent duplicate cleanup

        const client = new SpeechClient({
            keyFilename: keyPath
        });

        // Create GCP recognize stream
        const recognizeStream = client.streamingRecognize({
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 48000,
                languageCode: "en-US",
                alternativeLanguageCodes: ["en-IN"],
                enableAutomaticPunctuation: true,
            },
            interimResults: true,
        });

        recognizeStream.on("data", (data) => {
            if (data.results[0] && data.results[0].alternatives[0]) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ transcript: data.results[0].alternatives[0].transcript }));
                }
            }
        });

        recognizeStream.on("error", (err: any) => {
            // Suppress error code 11 (stream ended) as it's expected when closing
            if (err.code !== 11) {
                console.error("GCP STT error:", err);
            }
        });
        
        recognizeStream.on("end", () => console.log("GCP stream ended"));

        // FFmpeg converts WebM/Opus → PCM16
        const ffmpeg = spawn("ffmpeg", [
            "-i", "pipe:0",
            "-f", "s16le",
            "-ar", "48000",
            "-ac", "1",
            "pipe:1",
        ]);

        // Reduce FFmpeg stderr logging (only log errors)
        ffmpeg.stderr.on("data", (data) => {
            const message = data.toString();
            // Only log actual errors, not progress updates
            if (message.includes('Error') || message.includes('error')) {
                console.error("FFmpeg error:", message);
            }
        });

        // Pipe FFmpeg output to GCP
        ffmpeg.stdout.pipe(recognizeStream);

        // Handle incoming audio chunks from frontend
        ws.on("message", (chunk: Uint8Array) => {
            if (!ffmpeg.stdin.destroyed && !isClosing) {
                hasReceivedAudio = true; // Mark that we received audio
                ffmpeg.stdin.write(Buffer.from(chunk));
            }
        });

        const cleanup = () => {
            if (isClosing) return; // Prevent duplicate cleanup
            isClosing = true;
            
            console.log("WebSocket disconnected - cleaning up...");
            
            // Only process if we actually received audio data
            if (hasReceivedAudio) {
                // Close stdin first to signal end of input
                if (!ffmpeg.stdin.destroyed) {
                    try {
                        ffmpeg.stdin.end();
                    } catch (err) {
                        console.error("Error closing FFmpeg stdin:", err);
                    }
                }
                
                // Give FFmpeg time to finish processing, then kill it
                setTimeout(() => {
                    if (!ffmpeg.killed) {
                        ffmpeg.kill('SIGTERM');
                        console.log("FFmpeg process terminated");
                    }
                }, 1000);
            } else {
                // No audio received, just kill FFmpeg immediately
                if (!ffmpeg.killed) {
                    ffmpeg.kill('SIGKILL');
                    console.log("FFmpeg killed (no audio received)");
                }
            }
            
            // End GCP stream gracefully
            setTimeout(() => {
                try {
                    recognizeStream.end();
                } catch (err) {
                    // Ignore errors when ending stream
                }
            }, hasReceivedAudio ? 1500 : 100);
        };

        ws.on("close", cleanup);
        ws.on("error", (err) => {
            console.error("WebSocket error:", err);
            cleanup();
        });

        ffmpeg.on("close", (code) => {
            console.log("FFmpeg closed with code:", code);
            recognizeStream.end();
        });

        ffmpeg.on("error", (err) => {
            console.error("FFmpeg process error:", err);
        });
    });
}
