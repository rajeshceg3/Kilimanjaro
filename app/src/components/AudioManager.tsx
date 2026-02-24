import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { MathUtils } from 'three';

export const AudioManager = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Layer Gain Nodes
  const lowLayerGainRef = useRef<GainNode | null>(null);
  const midLayerGainRef = useRef<GainNode | null>(null);
  const highLayerGainRef = useRef<GainNode | null>(null);
  const summitLayerGainRef = useRef<GainNode | null>(null);

  const [isAudioStarted, setIsAudioStarted] = useState(false);

  useEffect(() => {
    // Initialize Audio Context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.5; // Overall volume
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // --- Create Noise Buffer (2 seconds of white noise) ---
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Helper to create a looped noise source with a filter
    const createNoiseLayer = (filterType: BiquadFilterType, frequency: number, q: number = 1) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = frequency;
      filter.Q.value = q;

      const gain = ctx.createGain();
      gain.gain.value = 0; // Start silent

      source.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      source.start();
      return gain;
    };

    // --- Low Layer (Roots/Earth) ---
    // Lowpass filter for deep rumble/wind
    lowLayerGainRef.current = createNoiseLayer('lowpass', 300);

    // --- Mid Layer (Forest/Wind) ---
    // Bandpass for "whooshing" wind
    midLayerGainRef.current = createNoiseLayer('bandpass', 600, 0.5);

    // --- High Layer (Thin Air) ---
    // Highpass for hissing wind
    highLayerGainRef.current = createNoiseLayer('highpass', 2000);

    // --- Summit Layer (Ethereal) ---
    // Sine waves for a "singing" bowl effect
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 220; // A3

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 222; // Slight detune for beating

    const summitGain = ctx.createGain();
    summitGain.gain.value = 0;

    osc1.connect(summitGain);
    osc2.connect(summitGain);
    summitGain.connect(masterGain);

    osc1.start();
    osc2.start();

    summitLayerGainRef.current = summitGain;

    return () => {
      ctx.close();
    };
  }, []);

  // Subscribe to altitude changes to update gains
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!isAudioStarted || !audioContextRef.current) return;

      const alt = state.altitude;

      // Calculate gains based on altitude zones with crossfades
      // Zones:
      // Cultivation: 800-1800 (Low dominant)
      // Rainforest: 1800-2800 (Low + Mid)
      // Moorland: 2800-4000 (Mid dominant)
      // Alpine: 4000-5000 (Mid + High)
      // Summit: 5000+ (High + Summit)

      let low = 0, mid = 0, high = 0, summit = 0;

      if (alt < 1800) {
        // 800 -> 1800: Low 1.0 -> 0.8
        low = MathUtils.mapLinear(alt, 800, 1800, 1.0, 0.8);
        mid = MathUtils.mapLinear(alt, 800, 1800, 0.0, 0.2);
      } else if (alt < 2800) {
        // 1800 -> 2800: Low fades out, Mid increases
        low = MathUtils.mapLinear(alt, 1800, 2800, 0.8, 0.2);
        mid = MathUtils.mapLinear(alt, 1800, 2800, 0.2, 0.8);
      } else if (alt < 4000) {
        // 2800 -> 4000: Mid dominant, High starts
        low = 0;
        mid = MathUtils.mapLinear(alt, 2800, 4000, 0.8, 0.6);
        high = MathUtils.mapLinear(alt, 2800, 4000, 0.0, 0.4);
      } else if (alt < 5000) {
        // 4000 -> 5000: High dominant, Summit starts
        mid = MathUtils.mapLinear(alt, 4000, 5000, 0.6, 0.0);
        high = MathUtils.mapLinear(alt, 4000, 5000, 0.4, 0.8);
        summit = MathUtils.mapLinear(alt, 4000, 5000, 0.0, 0.2);
      } else {
        // 5000+: Summit dominant
        high = MathUtils.mapLinear(alt, 5000, 6000, 0.8, 0.3);
        summit = MathUtils.mapLinear(alt, 5000, 6000, 0.2, 0.8);
      }

      // Smooth updates (simple here, Web Audio parameters handle ramping better but this runs on frame/update)
      // To be safe against clicks, we can use setTargetAtTime
      const time = audioContextRef.current?.currentTime || 0;
      const rampTime = 0.1;

      if (lowLayerGainRef.current) lowLayerGainRef.current.gain.setTargetAtTime(low * 0.5, time, rampTime);
      if (midLayerGainRef.current) midLayerGainRef.current.gain.setTargetAtTime(mid * 0.4, time, rampTime);
      if (highLayerGainRef.current) highLayerGainRef.current.gain.setTargetAtTime(high * 0.3, time, rampTime);
      if (summitLayerGainRef.current) summitLayerGainRef.current.gain.setTargetAtTime(summit * 0.15, time, rampTime);
    });

    return unsub;
  }, [isAudioStarted]);

  const handleStartAudio = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsAudioStarted(true);
  };

  if (isAudioStarted) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={handleStartAudio}
        className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
      >
        Enable Audio
      </button>
    </div>
  );
};
