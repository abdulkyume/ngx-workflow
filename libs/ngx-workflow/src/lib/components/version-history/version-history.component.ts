import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramComponent } from '../diagram/diagram.component';
import { VersionSnapshot } from '../../models/version.model';

@Component({
    selector: 'ngx-workflow-version-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './version-history.component.html',
    styleUrls: ['./version-history.component.scss']
})
export class VersionHistoryComponent implements OnInit {
    @Input() diagram!: DiagramComponent;
    @Input() visible: boolean = true;

    versions: VersionSnapshot[] = [];
    newVersionDescription: string = '';
    showSaveInput: boolean = false;

    constructor(private cdRef: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.loadVersions();
    }

    loadVersions(): void {
        if (this.diagram) {
            this.versions = this.diagram.getVersionHistory();
            this.cdRef.detectChanges();
        }
    }

    formatTimestamp(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (days < 7) {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return new Date(timestamp).toLocaleDateString();
        }
    }

    formatFullDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    restoreVersion(versionId: string): void {
        if (confirm('Restore this version? Current unsaved changes will be lost.')) {
            this.diagram.restoreVersion(versionId);
            this.loadVersions();
        }
    }

    deleteVersion(versionId: string): void {
        if (confirm('Delete this version?')) {
            this.diagram.getVersionHistory(); // Get current versions
            // Delete via the service through diagram component
            const service = (this.diagram as any).autoSaveService;
            if (service) {
                service.deleteVersion(versionId);
                this.loadVersions();
            }
        }
    }

    clearAll(): void {
        if (confirm('Clear all version history? This cannot be undone.')) {
            this.diagram.clearVersionHistory();
            this.loadVersions();
        }
    }

    toggleSaveInput(): void {
        this.showSaveInput = !this.showSaveInput;
        if (!this.showSaveInput) {
            this.newVersionDescription = '';
        }
    }

    saveVersion(): void {
        this.diagram.saveVersion(this.newVersionDescription || undefined);
        this.newVersionDescription = '';
        this.showSaveInput = false;
        this.loadVersions();
    }

    refresh(): void {
        this.loadVersions();
    }
}
