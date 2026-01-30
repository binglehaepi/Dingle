import { ScrapItem, ScrapType } from '../types';

/**
 * Link/Embed 아이템 decoration/frameDecoration 마이그레이션
 * - decoration이 없으면 { presetId: 'none' } 기본값 보강
 * - decoration이 있지만 presetId가 없으면 presetId만 'none'으로 보강
 *
 * (2026-01) 경로 통일:
 * - 링크/임베드 프레임/프리셋은 item.metadata.decoration 하나만 사용한다.
 * - legacy frameDecoration이 남아있으면 decoration으로 흡수 후 제거한다.
 *
 * 주의:
 * - borderColor/borderWidth/borderRadius/outlineStyle/shadow 등은 undefined 허용(= CSS 기본값)
 * - "앱이 기존 데이터를 읽는 지점"에서 1회 적용되도록, 로드 경로에서만 호출한다.
 */
export function migrateScrapItemDecoration(item: ScrapItem): ScrapItem {
  const meta: any = item?.metadata || {};

  // Link/Embed 대상 판별:
  // - V2 플랫폼이 있는 경우(= 링크/임베드 카드 계열)
  // - 또는 구버전에서 type만 남아있는 SNS/링크 계열
  const isLinkEmbedLike =
    !!meta.platform ||
    item.type === ScrapType.TWITTER ||
    item.type === ScrapType.INSTAGRAM ||
    item.type === ScrapType.PINTEREST ||
    item.type === ScrapType.YOUTUBE ||
    item.type === ScrapType.SPOTIFY ||
    item.type === ScrapType.TIKTOK ||
    item.type === ScrapType.VIMEO;

  if (!isLinkEmbedLike) return item;

  const deco = meta.decoration;
  const decoPresetId = deco?.presetId;

  const frame = meta.frameDecoration;
  const hasLegacyFrame = !!frame && (frame.presetId || frame.customFrameUrl || frame.padding !== undefined || frame.opacity !== undefined);

  const needsDecoPreset = !decoPresetId;
  if (!needsDecoPreset && !hasLegacyFrame) return item;

  const mapLegacyFramePresetToDecoration = (p: string | undefined): string => {
    if (!p || p === 'none') return 'none';
    if (p === 'pearl') return 'pearl_thin';
    if (p === 'lace') return 'scallop_lace_clean';
    if (p === 'ribbon') return 'ribbon_top_thin';
    return p;
  };

  const nextMeta = {
    ...meta,
    ...(needsDecoPreset
      ? {
          decoration: {
            ...(typeof deco === 'object' && deco ? deco : {}),
            presetId: 'none',
          },
        }
      : {}),
  };

  // legacy frameDecoration 흡수
  if (hasLegacyFrame) {
    const currentDeco = (nextMeta as any).decoration || deco || { presetId: 'none' };
    const mappedPreset = mapLegacyFramePresetToDecoration(frame?.presetId);
    (nextMeta as any).decoration = {
      ...(typeof currentDeco === 'object' && currentDeco ? currentDeco : { presetId: 'none' }),
      presetId: (currentDeco?.presetId && currentDeco.presetId !== 'none') ? currentDeco.presetId : mappedPreset,
      padding: currentDeco?.padding ?? frame?.padding,
      // opacity/custom url은 MVP schema에 없음/업로드 범위 아님 → 무시
    };
    delete (nextMeta as any).frameDecoration;
  }

  return { ...item, metadata: nextMeta };
}

export function migrateScrapItemsDecoration(items: ScrapItem[]): ScrapItem[] {
  return (items || []).map(migrateScrapItemDecoration);
}


