import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DiagramState } from '../models';
import { VersionSnapshot } from '../models/version.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class AutoSaveService {
    private readonly STORAGE_KEY_PREFIX = 'ngx-workflow';
    private readonly CURRENT_STATE_KEY = 'current';
    private readonly HISTORY_KEY = 'history';
    private readonly MAX_VERSIONS = 10;

    private saveSubject = new Subject<DiagramState>();
    private saveSubscription?: Subscription;

    constructor() {
        // Debounce saves to avoid excessive writes
        this.saveSubscription = this.saveSubject
            .pipe(debounceTime(1000))
            .subscribe(state => this.saveToStorage(state));
    }

    // Queue a save (debounced)
    queueSave(state: DiagramState): void {
        this.saveSubject.next(state);
    }

    // Save current state immediately
    private saveToStorage(state: DiagramState): void {
        try {
            const key = `${this.STORAGE_KEY_PREFIX}:${this.CURRENT_STATE_KEY}`;
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    // Load current state
    loadCurrentState(): DiagramState | null {
        try {
            const key = `${this.STORAGE_KEY_PREFIX}:${this.CURRENT_STATE_KEY}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }

    // Save version to history
    saveVersion(state: DiagramState, description?: string): void {
        try {
            const version: VersionSnapshot = {
                id: uuidv4(),
                timestamp: Date.now(),
                state,
                metadata: {
                    nodeCount: state.nodes.length,
                    edgeCount: state.edges.length,
                    description
                }
            };

            const history = this.getHistory();
            history.unshift(version);

            // Keep only MAX_VERSIONS
            if (history.length > this.MAX_VERSIONS) {
                history.splice(this.MAX_VERSIONS);
            }

            const key = `${this.STORAGE_KEY_PREFIX}:${this.HISTORY_KEY}`;
            localStorage.setItem(key, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save version:', error);
        }
    }

    // Get version history
    getHistory(): VersionSnapshot[] {
        try {
            const key = `${this.STORAGE_KEY_PREFIX}:${this.HISTORY_KEY}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    }

    // Restore a version
    restoreVersion(versionId: string): DiagramState | null {
        const history = this.getHistory();
        const version = history.find(v => v.id === versionId);
        return version ? version.state : null;
    }

    // Delete a version
    deleteVersion(versionId: string): void {
        try {
            const history = this.getHistory();
            const filtered = history.filter(v => v.id !== versionId);
            const key = `${this.STORAGE_KEY_PREFIX}:${this.HISTORY_KEY}`;
            localStorage.setItem(key, JSON.stringify(filtered));
        } catch (error) {
            console.error('Failed to delete version:', error);
        }
    }

    // Clear all history
    clearHistory(): void {
        try {
            const key = `${this.STORAGE_KEY_PREFIX}:${this.HISTORY_KEY}`;
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }

    // Clear everything
    clearAll(): void {
        try {
            const currentKey = `${this.STORAGE_KEY_PREFIX}:${this.CURRENT_STATE_KEY}`;
            const historyKey = `${this.STORAGE_KEY_PREFIX}:${this.HISTORY_KEY}`;
            localStorage.removeItem(currentKey);
            localStorage.removeItem(historyKey);
        } catch (error) {
            console.error('Failed to clear all:', error);
        }
    }

    ngOnDestroy(): void {
        this.saveSubscription?.unsubscribe();
    }
}
