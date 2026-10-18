import type { ComponentType } from 'react';
import type { VisualKey, VisualProps } from '../types';

/**
 * Card illustrations keyed by `WorkCard.visual`. Each component drives its own timeline through
 * `useVisualTimeline` and only plays while `active` is true. Cards whose key is missing here render
 * an empty 170px panel.
 */
export const VISUALS: Partial<Record<VisualKey, ComponentType<VisualProps>>> = {};
