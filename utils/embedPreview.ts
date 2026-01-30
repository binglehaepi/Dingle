export const EMBED_PREVIEW_EVENT = 'embed-preview:open';

export type EmbedPreviewOpenDetail = {
  url: string;
  title?: string;
  trigger?: 'click' | 'dblclick';
};

export function requestEmbedPreview(detail: EmbedPreviewOpenDetail): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent<EmbedPreviewOpenDetail>(EMBED_PREVIEW_EVENT, { detail }));
  } catch {
    // ignore
  }
}


