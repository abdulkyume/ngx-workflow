import { InjectionToken } from '@angular/core';
import { NodeComponentType } from '../types/component-types';

export const NGX_FLOW_NODE_TYPES = new InjectionToken<Record<string, NodeComponentType>>('NGX_FLOW_NODE_TYPES');