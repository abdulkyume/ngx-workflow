import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MarkdownLoaderService {
    private http = inject(HttpClient);

    load(path: string): Observable<string> {
        return this.http.get(path, { responseType: 'text' }).pipe(
            map(content => marked.parse(content) as string)
        );
    }
}
