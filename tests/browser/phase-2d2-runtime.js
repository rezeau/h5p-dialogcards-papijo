(function installPhase2D2Runtime(window, $) {
  'use strict';

  const H5P = window.H5P = {};
  const jqueryLoad = $.fn.load;
  $.fn.load = function load(callback) {
    if (typeof callback === 'function') return this.on('load', callback);
    return jqueryLoad.apply(this, arguments);
  };
  H5P.instances = [];
  H5P.jQuery = $;
  H5P.$ = $;
  H5P.getLibraryPath = (library) => `/libraries/${library}`;
  H5P.getPath = (path) => path;
  H5P.shuffleArray = (items) => items;
  H5P.createTitle = (title) => String(title || '');
  H5P.isFullscreen = false;
  H5P.externalDispatcher = { trigger() {}, on() {} };

  H5P.Event = function Event(type, data, extras = {}) {
    let bubbles = extras.bubbles === true;
    this.type = type;
    this.data = data;
    this.getBubbles = () => bubbles;
    this.preventBubbling = () => { bubbles = false; };
    this.scheduleForExternal = () => false;
  };

  H5P.EventDispatcher = function EventDispatcher() {
    if (!Object.hasOwn(this, '__listeners')) this.__listeners = new Map();
  };
  H5P.EventDispatcher.prototype.on = function on(type, listener, thisArg) {
    const listeners = this.__listeners.get(type) || [];
    listeners.push({ listener, thisArg });
    this.__listeners.set(type, listeners);
    return this;
  };
  H5P.EventDispatcher.prototype.off = function off(type, listener) {
    if (!this.__listeners.has(type)) return this;
    if (!listener) this.__listeners.delete(type);
    else this.__listeners.set(type, this.__listeners.get(type).filter((item) => item.listener !== listener));
    return this;
  };
  H5P.EventDispatcher.prototype.trigger = function trigger(event, data, extras) {
    if (typeof event === 'string') event = new H5P.Event(event, data, extras);
    const listeners = [...(this.__listeners.get(event.type) || [])];
    listeners.forEach(({ listener, thisArg }) => listener.call(thisArg || this, event));
    if (event.getBubbles?.() && this.parent && typeof this.parent.trigger === 'function') this.parent.trigger(event);
    return this;
  };
  H5P.EventDispatcher.prototype.triggerXAPI = function triggerXAPI() {};
  H5P.EventDispatcher.prototype.triggerXAPIScored = function triggerXAPIScored() {};
  H5P.EventDispatcher.prototype.setActivityStarted = function setActivityStarted() {};
  H5P.EventDispatcher.prototype.createXAPIEventTemplate = function createXAPIEventTemplate() {
    return {
      data: { statement: { object: { definition: { extensions: {} } } } },
      getVerifiedStatementValue(parts) {
        return parts.reduce((value, key) => (value[key] ||= {}), this.data.statement);
      },
      setScoredResult() {},
    };
  };

  H5P.ContentType = function ContentType(isRoot) {
    function Type() {}
    Type.prototype = Object.create(H5P.EventDispatcher.prototype);
    Type.prototype.isRoot = () => Boolean(isRoot);
    Type.prototype.getLibraryFilePath = function getLibraryFilePath(path) {
      return `${H5P.getLibraryPath(this.libraryInfo.versionedNameNoSpaces)}/${path}`;
    };
    return Type;
  };

  H5P.Components = {
    Button(options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = options.classes || options.class || '';
      button.innerHTML = options.html || options.label || '';
      if (options.ariaLabel !== undefined) button.setAttribute('aria-label', options.ariaLabel);
      if (options.disabled) button.disabled = true;
      if (options.onClick) button.addEventListener('click', options.onClick);
      return button;
    },
    ResultScreen() { return document.createElement('div'); },
    Navigation(options = {}) {
      const navigation = document.createElement('nav');
      const previous = document.createElement('button');
      previous.type = 'button';
      previous.className = 'h5p-theme-nav-button h5p-theme-previous';
      previous.textContent = options.texts?.previousButton || 'Previous';
      if (options.handlePrevious) previous.addEventListener('click', options.handlePrevious);
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'h5p-theme-nav-button h5p-theme-next';
      next.textContent = options.texts?.nextButton || 'Next';
      if (options.handleNext) next.addEventListener('click', options.handleNext);
      navigation.append(previous, next);
      return navigation;
    },
  };
  H5P.ConfirmationDialog = function ConfirmationDialog() {
    H5P.EventDispatcher.call(this);
    this.element = document.createElement('div');
  };
  H5P.ConfirmationDialog.prototype = Object.create(H5P.EventDispatcher.prototype);
  H5P.ConfirmationDialog.prototype.appendTo = function appendTo(container) { container.append(this.element); };
  H5P.ConfirmationDialog.prototype.show = function show() {};
  H5P.JoubelUI = {
    createTip(tip) { return $('<span class="joubel-tip-container"></span>').attr('data-tip', tip); },
    createScoreBar() { const bar = $('<div></div>'); bar.setScore = () => bar; return bar; },
  };
  H5P.Audio = function Audio() {
    this.$audio = $('<div class="h5p-audio-inner"></div>');
    this.audio = { preload: 'auto' };
    this.attach = ($container) => this.$audio.appendTo($container);
    this.play = this.pause = this.stop = this.seekTo = () => {};
  };
  H5P.Question = function Question() {};
  H5P.Transition = { onTransitionEnd(element, callback) { setTimeout(callback, 0); } };
  H5P.on = (instance, type, listener) => instance.on(type, listener);
  H5P.trigger = (instance, ...args) => instance.trigger(...args);

  H5P.newRunnable = function newRunnable(library, contentId, $attachTo, skipResize, extras = {}) {
    const [machineName, version] = library.library.split(' ', 2);
    const [majorVersion, minorVersion] = version.split('.', 2);
    let Constructor = window;
    machineName.split('.').forEach((part) => { Constructor = Constructor[part]; });
    Constructor.prototype = $.extend({}, H5P.ContentType(Boolean(extras.standalone)).prototype, Constructor.prototype);
    const instance = new Constructor(library.params, contentId, extras);
    instance.contentId = contentId;
    instance.subContentId = library.subContentId;
    instance.parent = extras.parent;
    instance.libraryInfo = {
      machineName,
      majorVersion,
      minorVersion,
      versionedName: library.library,
      versionedNameNoSpaces: `${machineName}-${majorVersion}.${minorVersion}`,
    };
    window.__phase2d2InstrumentInstance?.(instance);
    H5P.instances.push(instance);
    if ($attachTo) {
      instance.attach($attachTo);
      if (!skipResize) instance.trigger('resize');
    }
    return instance;
  };
}(window, window.jQuery));
