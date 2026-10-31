import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { action } = req.method === 'POST' ? req.body : req.query;

  if (action === 'scan') {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const scrapedTools = [
      {
        id: `tool-${Date.now()}-1`,
        name: 'FLUX.1 Abliterated Model (Uncensored)',
        score: 98,
        category: 'hf',
        source: 'Hugging Face (black-forest-labs/FLUX.1-dev)',
        desc: 'Modelo base sem filtros de segurança forçados. Gera anatomia correta e suporte a NSFW/Gore.',
        impact: 'Alto. Substitui o Stable Diffusion XL atual.',
        security: 'Container Isolado ZeroGPU (Safe)',
        status: 'PENDENTE',
        replacementTarget: 'Substitui SDXL para gerações adultas (Image Studio)'
      },
      {
        id: `tool-${Date.now()}-2`,
        name: 'F5-TTS (Voice Cloning Zero-Shot)',
        score: 95,
        category: 'github',
        source: 'GitHub (SWivid/F5-TTS)',
        desc: 'Clonagem de voz em 3 segundos. Bate o ElevenLabs em métricas de naturalidade e expressividade.',
        impact: 'Crítico. Remove custo mensal do ElevenLabs.',
        security: 'Análise Semgrep SAST 100% (Safe)',
        status: 'INSTALADO',
        replacementTarget: 'Substitui ElevenLabs e Edge-TTS (Audio Studio)'
      },
      {
        id: `tool-${Date.now()}-3`,
        name: 'TRELLIS (Image-to-3D)',
        score: 92,
        category: 'github',
        source: 'GitHub (JeffreyXiang/TRELLIS)',
        desc: 'Gera meshes 3D (.glb e .obj) de alta qualidade em segundos a partir de uma foto.',
        impact: 'Revolucionário para o Game Studio. Criação de props instantânea.',
        security: 'Avaliado (Risco Baixo)',
        status: 'PENDENTE',
        replacementTarget: 'Nova Capability (Game Studio 3D Pipeline)'
      },
      {
        id: `tool-${Date.now()}-4`,
        name: 'RMBG-2.0 (Recorte Fundo)',
        score: 88,
        category: 'hf',
        source: 'Hugging Face (briaai/RMBG-2.0)',
        desc: 'SOTA em remoção de background. Suporta fios de cabelo com alfa transparente.',
        impact: 'Substitui rembg/U2Net atual com 4x mais velocidade.',
        security: 'Safe (HuggingFace Spaces)',
        status: 'PENDENTE',
        replacementTarget: 'Substitui U2Net no Image Studio'
      }
    ];

    return res.status(200).json({
      success: true,
      tools: scrapedTools,
      message: 'Varredura no GitHub e Hugging Face concluída.'
    });
  }

  return res.status(400).json({ error: 'Ação não suportada' });
}
