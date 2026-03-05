import { config } from 'dotenv';
import { resolve } from 'path';
import { getDatabase } from './client';
import { voices } from './schema/voices';

config({ path: resolve(__dirname, '../../.env') });

// All Kokoro voices available for TTS
const kokoroVoices = [
    { name: 'af_alloy', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Alloy — warm and confident American female voice' },
    { name: 'af_aoede', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Aoede — clear and articulate American female voice' },
    { name: 'af_bella', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Bella — friendly and approachable American female voice' },
    { name: 'af_heart', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Heart — passionate and expressive American female voice' },
    { name: 'af_jessica', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Jessica — professional and smooth American female voice' },
    { name: 'af_kore', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Kore — youthful and energetic American female voice' },
    { name: 'af_nicole', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Nicole — soothing and calm American female voice' },
    { name: 'af_nova', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Nova — bright and dynamic American female voice' },
    { name: 'af_river', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'River — flowing and natural American female voice' },
    { name: 'af_sarah', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Sarah — warm and storytelling American female voice' },
    { name: 'af_sky', gender: 'female' as const, language: 'en-us', accent: 'American', description: 'Sky — airy and light American female voice' },
    { name: 'am_adam', gender: 'male' as const, language: 'en-us', accent: 'American', description: 'Adam — deep and authoritative American male voice' },
    { name: 'am_echo', gender: 'male' as const, language: 'en-us', accent: 'American', description: 'Echo — resonant and clear American male voice' },
    { name: 'am_eric', gender: 'male' as const, language: 'en-us', accent: 'American', description: 'Eric — professional and confident American male voice' },
    { name: 'am_liam', gender: 'male' as const, language: 'en-us', accent: 'American', description: 'Liam — warm and relatable American male voice' },
    { name: 'am_michael', gender: 'male' as const, language: 'en-us', accent: 'American', description: 'Michael — strong and versatile American male voice' },
    { name: 'am_onyx', gender: 'male' as const, language: 'en-us', accent: 'American', description: 'Onyx — rich and powerful American male voice' },
    { name: 'bf_alice', gender: 'female' as const, language: 'en-gb', accent: 'British', description: 'Alice — elegant British female voice' },
    { name: 'bf_emma', gender: 'female' as const, language: 'en-gb', accent: 'British', description: 'Emma — refined and polished British female voice' },
    { name: 'bf_lily', gender: 'female' as const, language: 'en-gb', accent: 'British', description: 'Lily — gentle and soft British female voice' },
    { name: 'bm_daniel', gender: 'male' as const, language: 'en-gb', accent: 'British', description: 'Daniel — sophisticated British male voice' },
    { name: 'bm_fable', gender: 'male' as const, language: 'en-gb', accent: 'British', description: 'Fable — storytelling British male voice' },
    { name: 'bm_george', gender: 'male' as const, language: 'en-gb', accent: 'British', description: 'George — classic and distinguished British male voice' },
    { name: 'bm_lewis', gender: 'male' as const, language: 'en-gb', accent: 'British', description: 'Lewis — modern and conversational British male voice' },
];

async function seed() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL is required');
    }

    console.log('Seeding voices...');
    const db = getDatabase(url);

    for (const voice of kokoroVoices) {
        await db
            .insert(voices)
            .values({
                name: voice.name,
                description: voice.description,
                category: 'premade',
                language: voice.language,
                gender: voice.gender,
                accent: voice.accent,
                isPublic: true,
            })
            .onConflictDoNothing();
    }

    console.log(`Seeding completed! ${kokoroVoices.length} voices inserted.`);
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
