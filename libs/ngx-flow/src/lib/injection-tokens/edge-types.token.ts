import { InjectionToken } from '@angular/core';
import { EdgeComponentType } from '../types/component-types';

export const NGX_FLOW_EDGE_TYPES = new InjectionToken<Record<string, EdgeComponentType>>('NGX_FLOW_EDGE_TYPES');