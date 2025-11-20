import { Type } from '@angular/core';
import { Node } from '../models/node.model';
import { Edge } from '../models/edge.model';

export type NodeComponentType = Type<{ node: Node }>;
export type EdgeComponentType = Type<{ edge: Edge }>;