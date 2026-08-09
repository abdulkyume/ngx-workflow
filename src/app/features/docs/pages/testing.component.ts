import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';

@Component({
  selector: 'app-doc-testing',
  standalone: true,
  imports: [RouterLink, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="prose">
      <span class="badge badge-accent">Testing</span>
      <h1>Unit testing ngx-workflow</h1>
      <p class="lead text-muted">
        Use the <code>ngx-workflow/testing</code> entrypoint for diagram mocks and custom-node DI stubs.
      </p>

      <h2 id="mocks">Component mocks</h2>
      <p>
        Override real imports with <code>NgxWorkflowMocks</code> (diagram + studio chrome) or the
        lighter <code>NgxWorkflowCoreMocks</code> so host components can be tested without mounting
        the full SVG canvas.
      </p>
      <app-code-block label="TypeScript" [code]="mocksSnippet" />

      <h2 id="fixtures">Graph fixtures</h2>
      <p>
        <code>mockNode</code>, <code>mockEdge</code>, and <code>mockGraph</code> build typed fixtures
        on top of <code>createNode</code> / <code>createEdge</code>.
      </p>
      <app-code-block label="TypeScript" [code]="fixturesSnippet" />

      <h2 id="custom-nodes">Testing custom nodes</h2>
      <p>
        <code>provideCustomNodeMocks()</code> (alias <code>provideNgxWorkflowTesting()</code>)
        registers lightweight providers including a <code>MockDiagramStateService</code> so node
        components that inject library services can be created in isolation.
      </p>
      <app-code-block label="TypeScript" [code]="customNodeSnippet" />

      <h2 id="factories">Factories in tests</h2>
      <app-code-block label="TypeScript" [code]="factorySnippet" />

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/docs/cookbook" class="btn btn-primary">← Cookbook</a>
        <a routerLink="/docs/api" class="btn btn-secondary">API Reference</a>
        <a class="btn btn-secondary" href="/compodoc/" target="_blank" rel="noopener">Compodoc</a>
      </div>
    </article>
  `,
})
export class DocTestingComponent {
  readonly mocksSnippet = `import { TestBed } from '@angular/core/testing';
import { NgxWorkflowMocks, NgxWorkflowCoreMocks } from 'ngx-workflow/testing';
import { NgxWorkflowModule } from 'ngx-workflow';

TestBed.configureTestingModule({
  imports: [YourHostComponent],
}).overrideComponent(YourHostComponent, {
  remove: { imports: [NgxWorkflowModule] },
  add: { imports: [...NgxWorkflowMocks] }, // or NgxWorkflowCoreMocks
});`;

  readonly fixturesSnippet = `import { mockGraph, mockNode, mockEdge } from 'ngx-workflow/testing';

const { nodes, edges } = mockGraph(3);
const selected = mockNode({ id: 'x', selected: true, position: { x: 40, y: 40 } });
const link = mockEdge({ source: nodes[0].id, target: selected.id });`;

  readonly customNodeSnippet = `import { TestBed } from '@angular/core/testing';
import { provideNgxWorkflowTesting, mockNode } from 'ngx-workflow/testing';
import { MyCustomNodeComponent } from './my-custom-node.component';

TestBed.configureTestingModule({
  imports: [MyCustomNodeComponent],
  providers: provideNgxWorkflowTesting(),
});

const fixture = TestBed.createComponent(MyCustomNodeComponent);
fixture.componentRef.setInput('node', mockNode({ id: '1', label: 'A' }));
fixture.detectChanges();`;

  readonly factorySnippet = `import { createNode, createEdge } from 'ngx-workflow';

const a = createNode({ label: 'A' });
const b = createNode({ label: 'B' });
const edge = createEdge({ source: a.id, target: b.id });`;
}
