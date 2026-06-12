import JSZip from 'jszip';
import type { CharacterCardV3, Asset } from '../types';

function getAssetSubdir(ext: string): string {
  const image = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg'];
  const audio = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
  const video = ['mp4', 'webm', 'mkv', 'avi', 'mov'];
  const l2d = ['model3.json', 'moc3', 'motion3.json', 'physics3.json'];
  const model3d = ['mmd', 'obj', 'fbx', 'gltf', 'glb'];
  const ai = ['safetensors', 'ckpt', 'onnx', 'pt', 'pth'];
  const font = ['otf', 'ttf', 'woff', 'woff2'];
  const code = ['lua', 'js', 'py', 'ts', 'css', 'html'];

  const e = ext.toLowerCase();
  if (image.includes(e)) return 'images';
  if (audio.includes(e)) return 'audio';
  if (video.includes(e)) return 'video';
  if (l2d.includes(e)) return 'l2d';
  if (model3d.includes(e)) return '3d';
  if (ai.includes(e)) return 'ai';
  if (font.includes(e)) return 'fonts';
  if (code.includes(e)) return 'code';
  return 'other';
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
    otf: 'font/otf',
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

export async function exportAsCharx(cardJson: CharacterCardV3, assets?: Asset[]): Promise<Blob> {
  const zip = new JSZip();
  const cloned = JSON.parse(JSON.stringify(cardJson)) as CharacterCardV3;

  if (assets) {
    cloned.data.assets = [];
    for (const asset of assets) {
      const clonedAsset = { ...asset };
      if (clonedAsset.uri.startsWith('data:')) {
        const subdir = getAssetSubdir(clonedAsset.ext);
        const zipPath = `assets/${clonedAsset.type}/${subdir}/${clonedAsset.name}.${clonedAsset.ext}`;
        const base64Data = clonedAsset.uri.split(',')[1];
        zip.file(zipPath, base64Data, { base64: true });
        clonedAsset.uri = `embeded://${zipPath}`;
      }
      cloned.data.assets.push(clonedAsset);
    }
  }

  zip.file('card.json', JSON.stringify(cloned, null, 2));
  return await zip.generateAsync({ type: 'blob' });
}

export async function importCharx(buf: ArrayBuffer): Promise<{ json: CharacterCardV3; assets: Asset[] }> {
  const zip = await JSZip.loadAsync(buf);

  const cardFile = zip.file('card.json');
  if (!cardFile) {
    throw new Error('CHARX file missing card.json');
  }

  const cardText = await cardFile.async('string');
  const json = JSON.parse(cardText) as CharacterCardV3;

  const assets: Asset[] = [];
  const rawAssets = json.data.assets;
  if (rawAssets) {
    for (const asset of rawAssets) {
      if (asset.uri.startsWith('embeded://')) {
        const path = asset.uri.slice('embeded://'.length);
        const entry = zip.file(path);
        if (entry) {
          const base64 = await entry.async('base64');
          const mime = getMimeType(asset.ext);
          assets.push({ ...asset, uri: `data:${mime};base64,${base64}` });
        } else {
          assets.push({ ...asset });
        }
      } else {
        assets.push({ ...asset });
      }
    }
    json.data.assets = assets;
  }

  return { json, assets };
}
