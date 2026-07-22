import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import jqueryFactory from 'jquery';
import { JSDOM } from 'jsdom';

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIRECTORY, '..', '..');
const BUNDLE_PATH = path.join(PROJECT_ROOT, 'dist', 'h5p-dialogcards.js');

/**
 * Create the narrow H5P browser contract needed by DialogcardsPapiJo.
 *
 * Event, EventDispatcher, ContentType and the prototype-composition portion of
 * newRunnable intentionally mirror H5P Core 1.28's h5p-event-dispatcher.js,
 * h5p-content-type.js and h5p.js. Peripheral platform services are small stubs
 * because loading all of h5p.js would initialize unrelated browser, AJAX and
 * integration services.
 *
 * @returns {object} Test runtime and DOM handles.
 */
export function createH5PRuntime() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only',
    url: 'https://example.test/',
  });
  const { window } = dom;
  const $ = jqueryFactory(window);
  const H5P = window.H5P = {};

  window.structuredClone = globalThis.structuredClone.bind(globalThis);
  H5P.jQuery = $;
  H5P.externalDispatcher = { trigger() {} };

  H5P.Event = function (type, data, extras = {}) {
    let bubbles = extras.bubbles === true;
    const external = extras.external === true;
    let scheduledForExternal = false;

    this.type = type;
    this.data = data;
    this.preventBubbling = function () {
      bubbles = false;
    };
    this.getBubbles = function () {
      return bubbles;
    };
    this.scheduleForExternal = function () {
      if (external && !scheduledForExternal) {
        scheduledForExternal = true;
        return true;
      }
      return false;
    };
  };

  H5P.EventDispatcher = function EventDispatcher() {
    const self = this;
    const triggers = {};

    this.on = function (type, listener, thisArg) {
      if (typeof listener !== 'function') {
        throw new TypeError('listener must be a function');
      }
      self.trigger('newListener', { type, listener });
      const trigger = { listener, thisArg };
      if (!triggers[type]) {
        triggers[type] = [trigger];
      }
      else {
        triggers[type].push(trigger);
      }
    };

    this.once = function (type, listener, thisArg) {
      if (!(listener instanceof Function)) {
        throw new TypeError('listener must be a function');
      }
      const once = function (event) {
        self.off(event.type, once);
        listener.call(this, event);
      };
      self.on(type, once, thisArg);
    };

    this.off = function (type, listener) {
      if (listener !== undefined && !(listener instanceof Function)) {
        throw new TypeError('listener must be a function');
      }
      if (triggers[type] === undefined) {
        return;
      }
      if (listener === undefined) {
        delete triggers[type];
        self.trigger('removeListener', type);
        return;
      }
      for (let index = 0; index < triggers[type].length; index++) {
        if (triggers[type][index].listener === listener) {
          triggers[type].splice(index, 1);
          self.trigger('removeListener', type, { listener });
          break;
        }
      }
      if (!triggers[type].length) {
        delete triggers[type];
      }
    };

    const call = function (type, event) {
      if (triggers[type] === undefined) {
        return;
      }
      const handlers = triggers[type].slice();
      for (let index = 0; index < handlers.length; index++) {
        const trigger = handlers[index];
        const thisArg = trigger.thisArg ? trigger.thisArg : this;
        trigger.listener.call(thisArg, event);
      }
    };

    this.trigger = function (event, eventData, extras) {
      if (event === undefined) {
        return;
      }
      if (event instanceof String || typeof event === 'string') {
        event = new H5P.Event(event, eventData, extras);
      }
      else if (eventData !== undefined) {
        event.data = eventData;
      }
      const scheduledForExternal = event.scheduleForExternal();
      call.call(this, event.type, event);
      call.call(this, '*', event);
      if (
        event.getBubbles() &&
        self.parent instanceof H5P.EventDispatcher &&
        typeof self.parent.trigger === 'function'
      ) {
        self.parent.trigger(event);
      }
      if (scheduledForExternal) {
        H5P.externalDispatcher.trigger.call(this, event);
      }
    };
  };

  H5P.XAPIEvent = function XAPIEvent() {
    this.data = { statement: {} };
    this.setActor = function () {
      this.data.statement.actor = { objectType: 'Agent' };
    };
    this.setVerb = function (verb) {
      this.data.statement.verb = { id: verb };
    };
    this.setObject = function (contentType) {
      this.data.statement.object = { id: `content-${contentType.contentId}` };
    };
    this.setContext = function () {
      this.data.statement.context = {};
    };
    this.getVerifiedStatementValue = function (pathParts) {
      return pathParts.reduce(
        (value, key) => value === undefined ? undefined : value[key],
        this.data.statement,
      );
    };
    this.setScoredResult = function () {};
  };
  H5P.XAPIEvent.prototype = new H5P.Event('xAPI');

  H5P.EventDispatcher.prototype.triggerXAPI = function (verb, extra) {
    this.trigger(this.createXAPIEventTemplate(verb, extra));
  };
  H5P.EventDispatcher.prototype.createXAPIEventTemplate = function (verb, extra) {
    const event = new H5P.XAPIEvent();
    event.setActor();
    event.setVerb(verb);
    if (extra !== undefined) {
      for (const key in extra) {
        event.data.statement[key] = extra[key];
      }
    }
    if (!('object' in event.data.statement)) {
      event.setObject(this);
    }
    if (!('context' in event.data.statement)) {
      event.setContext(this);
    }
    return event;
  };

  H5P.ContentType = function (isRootLibrary) {
    function ContentType() {}
    ContentType.prototype = new H5P.EventDispatcher();
    ContentType.prototype.isRoot = function () {
      return isRootLibrary;
    };
    ContentType.prototype.getLibraryFilePath = function (filePath) {
      return `${H5P.getLibraryPath(this.libraryInfo.versionedNameNoSpaces)}/${filePath}`;
    };
    return ContentType;
  };

  H5P.getLibraryPath = (library) => `/libraries/${library}`;
  H5P.getPath = (filePath) => filePath;
  H5P.shuffleArray = (items) => items;
  H5P.trigger = (instance, ...args) => instance.trigger(...args);
  H5P.Components = {
    Button(options) {
      const button = window.document.createElement('button');
      button.type = 'button';
      button.className = options.classes || options.class || '';
      button.innerHTML = options.html || options.label || '';
      return button;
    },
  };
  H5P.Audio = function Audio() {
    this.$audio = $('<div class="h5p-audio-inner"></div>');
    this.attach = ($container) => this.$audio.appendTo($container);
    this.pause = function () {};
    this.stop = function () {};
  };
  H5P.JoubelUI = {
    createTip(tip) {
      return $('<span class="joubel-tip-container"></span>').attr('data-tip', tip);
    },
    createScoreBar() {
      return $('<div class="h5p-joubelui-score-bar"></div>');
    },
  };
  H5P.Question = function Question() {};

  H5P.newRunnable = function (library, contentId, $attachTo, skipResize, extras = {}) {
    const [versionedMachineName, version] = library.library.split(' ', 2);
    const [majorVersion, minorVersion] = version.split('.', 2);
    const machineNameParts = versionedMachineName.split('.');
    let Constructor = window;
    for (const machineNamePart of machineNameParts) {
      Constructor = Constructor[machineNamePart];
    }

    const standalone = extras.standalone || false;
    Constructor.prototype = H5P.jQuery.extend(
      {},
      H5P.ContentType(standalone).prototype,
      Constructor.prototype,
    );
    const instance = new Constructor(library.params, contentId, extras);
    instance.$ ??= H5P.jQuery(instance);
    instance.contentId ??= contentId;
    instance.libraryInfo ??= {
      versionedName: library.library,
      versionedNameNoSpaces: `${versionedMachineName}-${majorVersion}.${minorVersion}`,
      machineName: versionedMachineName,
      majorVersion,
      minorVersion,
    };

    if ($attachTo !== undefined) {
      $attachTo.toggleClass('h5p-standalone', standalone);
      instance.attach($attachTo);
      H5P.trigger(instance, 'domChanged', {
        $target: $attachTo,
        library: versionedMachineName,
        key: 'newLibrary',
      }, { bubbles: true, external: true });
      if (skipResize === undefined || !skipResize) {
        H5P.trigger(instance, 'resize');
      }
    }
    return instance;
  };

  const bundle = fs.readFileSync(BUNDLE_PATH, 'utf8');
  window.eval(bundle);

  return {
    $, H5P, close: () => dom.window.close(), dom, window,
  };
}
