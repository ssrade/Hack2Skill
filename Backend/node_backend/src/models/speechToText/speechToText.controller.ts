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

        const client = new SpeechClient({
            keyFilename: keyPath
        });

        // Create GCP recognize stream
        const recognizeStream = client.streamingRecognize({
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 48000,
                languageCode: "en-US",
                alternativeLanguageCodes: ["hi-IN", "en-IN"],
                enableAutomaticPunctuation: true,
            },
            interimResults: true,
        });

        recognizeStream.on("data", (data) => {
            if (data.results[0] && data.results[0].alternatives[0]) {
                ws.send(JSON.stringify({ transcript: data.results[0].alternatives[0].transcript }));
            }
        });

        recognizeStream.on("error", (err) => console.error("GCP STT error:", err));
        recognizeStream.on("end", () => console.log("GCP stream ended"));

        // FFmpeg converts WebM/Opus → PCM16
        const ffmpeg = spawn("ffmpeg", [
            "-i", "pipe:0",
            "-f", "s16le",
            "-ar", "48000",
            "-ac", "1",
            "pipe:1",
        ]);

        ffmpeg.stderr.on("data", (data) => console.log("FFmpeg:", data.toString()));

        // Pipe FFmpeg output to GCP
        ffmpeg.stdout.pipe(recognizeStream);

        // Handle incoming audio chunks from frontend
        ws.on("message", (chunk: Uint8Array) => {
            if (!ffmpeg.stdin.destroyed) ffmpeg.stdin.write(Buffer.from(chunk));
        });

        ws.on("close", () => {
            console.log("WebSocket disconnected");
            if (!ffmpeg.stdin.destroyed) ffmpeg.stdin.end();
        });

        ffmpeg.on("close", () => {
            recognizeStream.end();
            console.log("FFmpeg closed");
        });
    });
}
