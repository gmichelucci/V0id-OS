import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { action, prompt, engine } = req.body;

  if (action === 'generate_image') {
    await new Promise(resolve => setTimeout(resolve, 2500));

    return res.status(200).json({
      success: true,
      asset: {
        title: `Asset: ${prompt.slice(0, 15)}...`,
        type: 'Imagem/Textura',
        engine: engine || 'FLUX.1',
        time: new Date().toLocaleTimeString(),
        file: 'mock_asset.png'
      },
      message: `Asset gerado usando ${engine || 'FLUX.1'}`
    });
  }

  if (action === 'generate_audio') {
    await new Promise(resolve => setTimeout(resolve, 3000));

    return res.status(200).json({
      success: true,
      asset: {
        title: `Áudio: ${prompt.slice(0, 15)}...`,
        type: 'Voz / Som',
        engine: engine || 'F5-TTS',
        time: new Date().toLocaleTimeString(),
        file: 'mock_audio.wav'
      },
      message: `Áudio sintetizado usando ${engine || 'F5-TTS'}`
    });
  }

  if (action === 'generate_video') {
    await new Promise(resolve => setTimeout(resolve, 4000));

    return res.status(200).json({
      success: true,
      asset: {
        title: 'Master Episódio Compilado',
        type: 'Vídeo 60fps',
        engine: 'Remotion / WhisperX',
        time: new Date().toLocaleTimeString(),
        file: 'episode_master.mp4'
      },
      message: 'Vídeo renderizado com legendas!'
    });
  }

  return res.status(400).json({ error: 'Ação não suportada' });
}
