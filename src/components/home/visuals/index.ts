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
 * `VizFrame` (which runs `useVisualTimeline`) and only plays while `active` is true. Cards whose
 * key is missing here render an empty 170px panel.
 */
export const VISUALS: Partial<Record<VisualKey, ComponentType<VisualProps>>> = {
  claim: ClaimVisual,
  trade: TradeVisual,
  ware: WareVisual,
  agent: AgentVisual,
  concord: ConcordVisual,
  talk: TalkVisual,
  rag: RagVisual,
};
