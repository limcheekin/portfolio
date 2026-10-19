import type { ComponentType } from 'react';
import type { VisualKey, VisualProps } from '../types';
import ClaimVisual from './ClaimVisual';
import TradeVisual from './TradeVisual';
import WareVisual from './WareVisual';
import AgentVisual from './AgentVisual';
import ConcordVisual from './ConcordVisual';
import TalkVisual from './TalkVisual';
import RagVisual from './RagVisual';

/**
 * Card illustrations keyed by `WorkCard.visual`. Each component passes its timeline `build` to
 * `VizFrame` (which runs `useVisualTimeline`) and only plays while `active` is true. Every schema key
 * must have an entry (the Record type enforces it); cards without a `visual` get an empty panel.
 */
export const VISUALS: Record<VisualKey, ComponentType<VisualProps>> = {
  claim: ClaimVisual,
  trade: TradeVisual,
  ware: WareVisual,
  agent: AgentVisual,
  concord: ConcordVisual,
  talk: TalkVisual,
  rag: RagVisual,
};
