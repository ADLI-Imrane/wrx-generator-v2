import { createPortal } from 'react-dom';
import type { BusinessCardDocument } from '@wrx/shared';
import { BusinessCardArtwork } from './BusinessCardPreview';

export function BusinessCardPrintDocument({
  card,
  frontRef,
  backRef,
}: {
  card: BusinessCardDocument;
  frontRef: React.Ref<HTMLDivElement>;
  backRef: React.Ref<HTMLDivElement>;
}) {
  return createPortal(
    <div className="bc-print-document" data-print-document aria-hidden="true">
      <div className="bc-print-page" data-print-side="front">
        <BusinessCardArtwork document={card} side="front" exportRef={frontRef} />
      </div>
      {card.sides.back.enabled && (
        <div className="bc-print-page" data-print-side="back">
          <BusinessCardArtwork document={card} side="back" exportRef={backRef} />
        </div>
      )}
    </div>,
    window.document.body,
  );
}
