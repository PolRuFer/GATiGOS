// Ejemplo mínimo de Higgsfield + Seedance 2.5 (texto a vídeo).
// Uso: cd dev/higgsfield && npm run example
// Las credenciales se leen en tiempo de ejecución de HF_CREDENTIALS
// (.env.local, ignorado por Git); nunca se imprimen.
import { createHiggsfieldClient } from '@higgsfield/client/v2';

const credentials = process.env.HF_CREDENTIALS;
if (!credentials) {
  console.error('Falta HF_CREDENTIALS en dev/higgsfield/.env.local (formato key-id:key-secret).');
  process.exit(1);
}

const client = createHiggsfieldClient({ credentials, maxPollTime: 15 * 60 * 1000 });

try {
  const jobSet = await client.subscribe('bytedance/seedance-2.5/text-to-video', {
    input: {
      prompt: 'A cinematic scene at sunset',
      duration: 5,
      resolution: '720p',
      aspect_ratio: '16:9',
    },
    withPolling: true,
  });

  if (jobSet.isCompleted) {
    const url = jobSet.jobs[0]?.results?.raw?.url;
    if (!url) {
      console.error(`Solicitud ${jobSet.id} completada pero sin URL de vídeo.`);
      process.exit(1);
    }
    console.log('Vídeo:', url);
  } else {
    const state = jobSet.isNsfw ? 'rechazada por moderación' : jobSet.isFailed ? 'fallida' : jobSet.isCanceled ? 'cancelada' : 'sin terminar';
    console.error(`Solicitud ${jobSet.id} ${state}. No se ha generado ningún vídeo.`);
    process.exit(1);
  }
} catch (error) {
  console.error('Error de Higgsfield:', error instanceof Error ? error.message : error);
  process.exit(1);
}
