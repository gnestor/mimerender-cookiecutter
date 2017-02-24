import { Widget } from '@phosphor/widgets';
import { ABCWidgetFactory } from '@jupyterlab/docregistry';
import { ActivityMonitor } from '@jupyterlab/coreutils';
import { runMode } from '@jupyterlab/codemirror';
import React from 'react';
import ReactDOM from 'react-dom';
import {{cookiecutter.mime_short_name}}Component from '{{cookiecutter.extension_name}}_react';

const CLASS_NAME = 'jp-DocWidget{{cookiecutter.mime_short_name}}';
const RENDER_TIMEOUT = 1000;

/**
 * A widget for rendering {{cookiecutter.extension_name}} files
 */
export class DocWidget extends Widget {
  constructor(context) {
    super();
    this._context = context;
    this._onPathChanged();
    this.addClass(CLASS_NAME);
    context.ready.then(() => {
      this.update();
      /* Re-render when the document content changes */
      context.model.contentChanged.connect(this.update, this);
      /* Re-render when the document path changes */
      context.fileChanged.connect(this.update, this);
    });
    /* Update title when path changes */
    context.pathChanged.connect(this._onPathChanged, this);
    /* Throttle re-renders until changes have stopped */
    this._monitor = new ActivityMonitor({
      signal: context.model.contentChanged,
      timeout: RENDER_TIMEOUT
    });
    this._monitor.activityStopped.connect(this.update, this);
    /* Track widget width and height */
    this._width = this.node.offsetWidth;
    this._height = this.node.offsetHeight;
    this.addClass(CLASS_NAME);
  }

  /**
   * The widget's context
   */
  get context() {
    return this._context;
  }

  /**
   * Dispose of the resources used by the widget
   */
  dispose() {
    if (!this.isDisposed) {
      this._context = null;
      ReactDOM.unmountComponentAtNode(this.node);
      this._monitor.dispose();
      super.dispose();
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message
   */
  onAfterAttach(msg) {
    /* Render initial data */
    this.update();
  }

  /**
   * A message handler invoked on an `'before-detach'` message
   */
  onBeforeDetach(msg) {
    /* Dispose of resources used by  widget */
    // renderLibrary.dispose(this.node);
  }

  /**
   * A message handler invoked on a `'resize'` message
   */
  onResize(msg) {
    /* Re-render on resize */
    this.update();
  }

  /**
   * A message handler invoked on an `'update-request'` message
   */
  onUpdateRequest(msg) {
    if (this.isAttached && this._context.isReady) this._render();
  }

  _render() {
    const content = this._context.model.toString();
    try {
      const props = {
        data: JSON.parse(content),
        width: this.node.offsetWidth,
        height: this.node.offsetHeight
      };
      const text = document.createTextNode(JSON.stringify(props));
      this.node.appendChild(text);
    } catch (error) {
      const container = document.createElement('div');
      container.setAttribute('class', 'jp-RenderedText jp-mod-error');
      container.style.cssText = `width: 100%; text-align: center; padding: 10px; box-sizing: border-box;`;
      const titleContainer = document.createElement('span');
      titleContainer.style.cssText = `font-size: 18px; font-weight: 500; padding-bottom: 10px;`;
      const titleText = document.createTextNode('Invalid JSON');
      titleContainer.appendChild(titleText);
      container.appendChild(titleContainer);
      const contentContainer = document.createElement('pre');
      contentContainer.className = 'CodeMirror cm-s-jupyter CodeMirror-wrap';
      contentContainer.style.cssText = `text-align: left; padding: 10px; overflow: hidden;`;
      runMode(content, { name: 'javscript', json: true }, contentContainer);
      container.appendChild(contentContainer);
      this.node.innerHTML = '';
      this.node.appendChild(container);
    }
  }

  _onPathChanged() {
    this.title.label = this._context.path.split('/').pop();
  }
}

/**
 * A widget factory for DocWidget
 */
export class DocWidgetFactory extends ABCWidgetFactory {
  /**
   * Create a new widget instance
   */
  createNewWidget(context) {
    return new DocWidget(context);
  }
}
