import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT = join(process.cwd(), 'assets', 'audio');
const RATE = 16000;

function writeWav(name, duration, sampleAt) {
  const samples = Math.floor(duration * RATE);
  const bytes = 44 + samples * 2;
  const buffer = Buffer.alloc(bytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(bytes - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index += 1) {
    const t = index / RATE;
    const fade = Math.min(1, t * 30, (duration - t) * 18);
    const value = Math.max(-1, Math.min(1, sampleAt(t) * fade));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  writeFileSync(join(OUTPUT, `${name}.wav`), buffer);
}

mkdirSync(OUTPUT, { recursive: true });

writeWav('tap', 0.09, (t) => Math.sin(2 * Math.PI * (680 - t * 1900) * t) * 0.18);
writeWav('clue', 0.34, (t) => (Math.sin(2 * Math.PI * 660 * t) + Math.sin(2 * Math.PI * 990 * t)) * 0.12);
writeWav('correct', 0.7, (t) => {
  const notes = [523.25, 659.25, 783.99];
  const note = notes[Math.min(2, Math.floor(t / 0.22))];
  return Math.sin(2 * Math.PI * note * t) * 0.19;
});
writeWav('incorrect', 0.45, (t) => (Math.sin(2 * Math.PI * (260 - t * 180) * t) + Math.sin(2 * Math.PI * 130 * t)) * 0.12);
writeWav('achievement', 1.0, (t) => {
  const notes = [392, 523.25, 659.25, 783.99];
  const note = notes[Math.min(3, Math.floor(t / 0.24))];
  return (Math.sin(2 * Math.PI * note * t) + Math.sin(2 * Math.PI * note * 2 * t) * 0.2) * 0.16;
});
writeWav('ambient', 12, (t) => {
  const pulse = 0.62 + 0.38 * Math.sin(2 * Math.PI * 0.08 * t);
  const drone = Math.sin(2 * Math.PI * 55 * t) * 0.038 + Math.sin(2 * Math.PI * 82.41 * t) * 0.026;
  const shimmer = Math.sin(2 * Math.PI * 164.81 * t + Math.sin(t * 0.7)) * 0.009;
  return (drone + shimmer) * pulse;
});
