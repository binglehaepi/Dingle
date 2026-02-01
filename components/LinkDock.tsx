import React, { useMemo, useRef, useState } from 'react';
import { LinkDockItem } from '../types';

function extractUrlsFromText(raw: string): string[] {
  if (!raw) return [];
  const matches = raw.match(/https?:\/\/[^\s<>"']+/g) || [];
  const cleaned = matches
    .map((u) => u.trim().replace(/[)\],.]+$/g, '')) // 흔한 trailing punctuation 제거
    .filter(Boolean);
  // 중복 제거(순서 유지)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const u of cleaned) {
    if (seen.has(u)) continue;
    seen.add(u);
    unique.push(u);
  }
  return unique;
}

function getDefaultDateKeyForMonth(viewDate: Date): string {
  const today = new Date();
  const isSameMonth =
    today.getFullYear() === viewDate.getFullYear() && today.getMonth() === viewDate.getMonth();
  const d = isSameMonth ? today : new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface LinkDockProps {
  viewDate: Date;
  items: LinkDockItem[];
  setItems: React.Dispatch<React.SetStateAction<LinkDockItem[]>>;
  onInsertLinksToDate: (dateKey: string, urls: string[]) => Promise<(string | null)[]>;
  onAddPhotoToDate?: (dateKey: string, file: File) => Promise<string | null> | string | null | void;
}

const LinkDock: React.FC<LinkDockProps> = ({ viewDate, items, setItems, onInsertLinksToDate, onAddPhotoToDate }) => {
  const [input, setInput] = useState('');
  const [dateKey, setDateKey] = useState(() => getDefaultDateKeyForMonth(viewDate));
  const [isInserting, setIsInserting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // viewDate가 바뀌면, 사용자가 아직 손대지 않은 경우에만 기본값 갱신
  // (MVP: 단순히 월이 달라질 때 dateKey가 그 달에 없으면 1일로 보정)
  React.useEffect(() => {
    const yyyy = viewDate.getFullYear();
    const mm = String(viewDate.getMonth() + 1).padStart(2, '0');
    if (!dateKey.startsWith(`${yyyy}-${mm}-`)) {
      setDateKey(getDefaultDateKeyForMonth(viewDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]);

  const pending = useMemo(() => items.filter((it) => !it.insertedItemId), [items]);

  const handleAddAndInsert = async () => {
    const urlsFromInput = extractUrlsFromText(input);
    const existingPending = pending.map((it) => ({ id: it.id, url: it.url }));

    const newTargets = urlsFromInput.map((url) => ({
      id: crypto.randomUUID(),
      url,
    }));

    const targets = [...existingPending, ...newTargets];
    if (targets.length === 0) return;

    // 입력은 즉시 비우고, UI는 한 줄 바로 유지
    setInput('');

    // 새 URL은 도크에 먼저 저장(데이터 모델 유지)
    if (newTargets.length > 0) {
      setItems((prev) => [
        ...prev,
        ...newTargets.map((t) => ({
          id: t.id,
          url: t.url,
          assignedDate: dateKey,
          createdAt: Date.now(),
        })),
      ]);
    }

    setIsInserting(true);
    try {
      const insertedIds = await onInsertLinksToDate(dateKey, targets.map((t) => t.url));

      setItems((prev) =>
        prev.map((it) => {
          const idx = targets.findIndex((t) => t.id === it.id);
          if (idx === -1) return it;
          const insertedItemId = insertedIds[idx] || undefined;
          return {
            ...it,
            assignedDate: dateKey,
            insertedItemId,
          };
        })
      );
    } finally {
      setIsInserting(false);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData('text');
    const urls = extractUrlsFromText(text);
    if (urls.length > 0) {
      e.preventDefault();
      // 붙여넣기는 input에 넣지 말고 즉시 추가/삽입 흐름으로
      setInput(urls.join('\n'));
      // 아래에서 Enter/추가 버튼으로 실행되도록 한다(최소회귀, 예측가능)
    }
  };

  const handleDrop: React.DragEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = e.dataTransfer.getData('text');
    const urls = extractUrlsFromText(text);
    if (urls.length > 0) {
      setInput(urls.join('\n'));
    }
  };

  return (
    <div
      data-ui="link-dock"
      className="w-full"
    >
      <div
        className="flex items-center gap-2 flex-nowrap border rounded-lg bg-white/80 shadow-sm px-3 h-[52px]"
        style={{
          borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
          backgroundColor: 'var(--widget-surface-background, #ffffff)',
        }}
      >
        <input
          type="date"
          className="shrink-0 border rounded px-2 h-8 text-[11px] outline-none"
          style={{
            width: 132,
            backgroundColor: 'var(--widget-input-background, #f8fafc)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          value={dateKey}
          onChange={(e) => setDateKey(e.target.value)}
        />

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          placeholder="여기 링크를 넣어주세요"
          className="flex-1 min-w-0 border rounded-[4px] px-2 h-8 text-[12px] outline-none"
          style={{
            backgroundColor: 'var(--widget-input-background, #f8fafc)',
            borderColor: 'var(--widget-border-color, var(--ui-stroke-color, rgba(148, 163, 184, 0.6)))',
            color: 'inherit',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddAndInsert();
            }
          }}
        />

        <button
          className="shrink-0 h-8 px-3 rounded text-[12px] font-bold disabled:opacity-50 active:scale-95 transition-all"
          style={{
            minWidth: 64,
            backgroundColor: 'var(--widget-surface-background, #ffffff)',
            border: 'var(--ui-stroke-width, 1px) solid var(--ui-stroke-color)',
            color: 'inherit',
          }}
          onClick={handleAddAndInsert}
          disabled={isInserting || (extractUrlsFromText(input).length === 0 && pending.length === 0)}
          title="추가"
        >
          {isInserting ? '추가…' : '추가'}
        </button>

        {/* 📸 사진 추가 (선택된 dateKey로 명시 추가) */}
        {onAddPhotoToDate && (
          <>
            <input
              ref={photoInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await onAddPhotoToDate(dateKey, file);
                } finally {
                  // 동일 파일 재선택 가능하도록 reset
                  if (photoInputRef.current) photoInputRef.current.value = '';
                }
              }}
            />
            <button
              className="shrink-0 h-8 w-8 rounded disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center"
              style={{
                backgroundColor: 'var(--widget-surface-background, #ffffff)',
                border: 'var(--ui-stroke-width, 1px) solid var(--ui-stroke-color)',
                color: 'inherit',
              }}
              onClick={() => photoInputRef.current?.click()}
              disabled={isInserting}
              title="사진 추가"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default LinkDock;


