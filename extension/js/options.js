var hud = (function ( f ){
  return f({})
}(function ( hud ){

  function each( arr, f, context ){
    for ( var i = -1, l = arr.length; ++i < l; ) {
      f.call(context, arr[i], i, arr)
    }
  }

  function some( arr, f, context ){
    for ( var i = -1, l = arr.length; ++i < l; ) {
      if ( f.call(context, arr[i], i, arr) === true ) return true
    }
    return false
  }

  function extend( obj, extension ){
    for ( var prop in extension ) {
      obj[prop] = extension[prop]
    }
    return obj
  }

  hud.util = {}
  hud.util.each = each
  hud.util.some = some
  hud.util.extend = extend

  // constants used by the filter function
  var FILTER_PICK = hud.FILTER_PICK = 1
    , FILTER_SKIP = hud.FILTER_SKIP = 2
    , FILTER_IGNORE = hud.FILTER_STOP = hud.FILTER_IGNORE = 3
    , FILTER_STOP = 4
  // the event api, also a hash for custom events
    , events

  /**
   * @constructor
   * @param {Element} element - the element of the role controller
   * @param {Function} [def] - the definition function of the constructor
   * @param {Function|Object} setup - an additional function or object passed to each call of the controller
   *                                  can be an options object, which will be merged with the Role instance
   * */
  function Role( element ){
    this.element = element
    this.events = {}
    this.channels = {}
  }

  hud.Role = Role

  Role.extend = function ( proto ){
    extend(Role.prototype, proto)
  }

  Role.prototype = {
    /**
     * Collect values from the data attribute space where
     * attribute names are starting with `name`.
     * @param {String} name - data attribute name chunk
     * @param {Object} [defaults] - default values for the options.
     * */
    options: function ( name, defaults ){
      var options = defaults || {}
        , regexp = defaults
          ? new RegExp("^data-" + name + "-(.+?)$")
          : new RegExp("^data-(.+?)$")

      each(this.element.attributes, function ( attr ){
        var name = (attr.name.match(regexp) || [])[1]
        if ( name ) {
          name = name.replace(/-(.)/g, function ( match, group ){
            return group.toUpperCase()
          })
          switch ( true ) {
            case attr.value == "true":
            case attr.value == "false":
              options[name] = Boolean(attr.value)
              break
            case /^(\d*[\.,])?\d+?$/.test(attr.value):
              options[name] = Number(attr.value)
              break
            default:
              options[name] = attr.value
          }
        }
      })
      return options
    },
    extend: function ( extension ){
      return extend(this, extension)
    },
    filter: function ( filter, deep ){
      return hud.filter(this.element, filter, deep)
    },
    find: function ( name, deep ){
      return hud.find(this.element, name, deep)
    },
    findSub: function ( name, deep ){
      return hud.findSub(this.element, name, deep)
    },
    findAll: function ( name, deep ){
      return hud.findAll(this.element, name, deep)
    },
    findAllSub: function ( name, deep ){
      return hud.findAllSub(this.element, name, deep)
    },
    role: function ( name, def, setup ){
      var element = this.find(name, true)
      if ( !element ) return null
      return hud.create(element, def, setup)
    },
    subRole: function ( name, def, setup ){
      var element = this.findSub(name, true)
      if ( !element ) return null
      return hud.create(element, def, setup)
    },
    allRole: function ( name, def, setup ){
      var elements = this.findAll(name, true)
      each(elements, function ( el, i ){
        elements[i] = hud.create(el, def, setup)
      })
      return elements
    },
    allSubRole: function ( name, def, setup ){
      var elements = this.findAllSub(name, true)
      each(elements, function ( el, i ){
        elements[i] = hud.create(el, def, setup)
      })
      return elements
    },
    render: function ( name, setup ){
      return hud.render(name, this.element, setup)
    },
    renderAll: function ( name, setup ){
      return hud.renderAll(name, setup)
    },

    listen: function ( channel, listener ){
      if ( this.channels )
        (this.channels[channel] || (this.channels[channel] = [])).push(listener)
      return this
    },
    unlisten: function ( channel, listener ){
      if ( this.channels == undefined ) return this
      channel = this.channels[channel]
      if ( !channel ) return this
      var i = this.channels[channel].indexOf(listener)
      if ( !!~i ) channel.splice(i, 1)
      return this
    },
    broadcast: function ( channel, message ){
      if ( this.channels == undefined ) return this
      channel = this.channels[channel]
      if ( !channel ) return this
      message = [].slice.call(arguments, 1)
      each(channel, function ( listener ){
        listener.apply(this, message)
      }, this)
      return this
    },

    on: function ( event, listener, capture ){
      function hook(){
        listener.apply(role, arguments)
      }
      var args = [this.element, hook].concat([].slice.call(arguments, 2))
      var role = this
      if ( events[event] ) {
        var removeEventListener = events[event].apply(null, args)
          ;(this.events[event] || (this.events[event] = [])).push([listener, removeEventListener, hook])
      }
      else {
        // on the hook
        (this.events[event] || (this.events[event] = [])).push([listener, hook])
        this.element.addEventListener(event, hook, !!capture)
      }
      return this
    },
    off: function ( event, listener, capture ){
      var role = this
      if ( !this.events[event] || !this.events[event].length ) return this

      some(this.events[event], function ( l ){
        if ( l[0] == listener ) {
          if ( events[event] ) {
            // removeEventListener(hook, capture)
            l[1](l[2], !!capture)
          }
          else {
            // off the hook
            role.element.removeEventListener(event, l[1], !!capture)
          }
          return true
        }
        return false
      })
      return this
    },
    once: function ( event, listener, capture ){
      function once(){
        listener.apply(this, arguments)
        this.off(event, once, capture)
      }
      var args = [event, once].concat([].slice.call(arguments, 2))
      return this.on.apply(this, args)
    }
  }

  // ====================== API ======================

  hud.create = function ( element, def, setup ){
    var role = new Role(element)
    if( def ) def.call(role, setup)
    return role
  }
  hud.define = function ( def, proto, base ){
    base = hud[base] ? hud[base] : base || Role
    function R( element, setup ){
      base.call(this, element, setup)
      if ( def ) {
        def.call(this, element, setup || {})
      }
    }
    extend(R.prototype, base.prototype)
    if ( proto ) extend(R.prototype, proto)
    function create( element, setup ){
      return new R(element, setup)
    }
    create.extend = function( def, proto ){
      return hud.define(def, proto, R)
    }
    create.register = function( name, def, proto ){
      return hud.register(name, def, proto, R)
    }
    return create
  }
  hud.register = function ( name, def, proto, base ){
    hud[name] = hud[name] || hud.define(def, proto, base)
  }
  hud.render = function ( name, root, setup ){
    if ( !hud[name] ) return null
    if ( !setup ) {
      setup = root
      root = null
    }
    var el = hud.find(root, name)
    if ( !el ) return null
    return hud[name](el, setup)
  }
  hud.renderAll = function ( name, root, setup ){
    if ( !hud[name] ) return null
    if ( !setup ) {
      setup = root
      root = null
    }
    var elements = hud.findAll(root, name)
    var i = -1, l = elements.length
    while ( ++i < l ) {
      elements[i] = hud[name](elements[i], setup)
    }
    return elements
  }

  /**
   * Register a custom event definition by name.
   * The definition is a function that, when called,
   * should handle custom logic, event registration, etc..
   * and return a function that tears down the controllers.
   *
   * Returns a function which calls the unregister returned by the definition,
   * but only if the arguments match with the original ones.
   *
   * @example
   *
   * var clickProxy = hud.event("clickproxy", function( element, listener, capture ){
   *   element.addEventListener("click", listener, capture)
   *   return function( element, listener, capture ){
   *     // these arguments are the same as in the closure
   *     // this function body is executed if the listener and the capture values match
   *     element.removeEventListener("click", listener, capture)
   *   }
   * })
   * var unregister = clickProxy(someElement, someFunction, true)
   * unregister(someFunction, true)
   *
   * @param {String} name - a name for this event
   * @param {Function} def - the definition of this event
   * */
  hud.event = events = function registerEvent( name, def ){
    // register a definition function
    return events[name] = function addEventListener( element, listener, capture ){
      // normalize capture value for convenience
      capture = !!capture
      // when called, execute the custom logic and save the listener remover
      var doRemoveListener = def.apply(element, arguments)
      // and return a function that will call that remover
      return function removeEventListener( sameListener, sameCapture ){
        // but only if the same arguments are passed as before
        if ( sameListener === listener && sameCapture === capture ) {
          // execute custom tearing logic
          doRemoveListener(element, listener, capture)
        }
      }
    }
  }

  /**
   * Call custom event listener just once
   * */
  hud.event.once = function( element, event, listener, capture ){
    function once(  ){
      listener.apply(this, arguments)
      removeListener(once, capture)
    }
    var args = [element, once].concat([].slice.call(arguments, 3))
      , removeListener
    return removeListener = events[event].apply(null, args)
  }

  /**
   * Iterates over every child node, and according to the filter function's
   * return value, it picks, skips, or ignores a node.
   * Picked nodes will be part of the return array.
   * skipped nodes not, but their child nodes will still be checked.
   * Ignored nodes won't have their child nodes iterated recursively.
   * The root element will not be checked with the filter, only its child nodes.
   * */
  hud.filter = function ( element, filter, deep, childTypes ){
    deep = deep == undefined ? true : deep
    var children = element[childTypes] || element
      , i = -1
      , l = children.length
      , ret = []
      , stack = []
    if ( !l ) return ret
    while ( ++i < l ) {
      switch ( filter(children[i]) ) {
        case FILTER_PICK:
          ret.push(children[i])
          if ( deep && i < l && children[i][childTypes].length ) {
            stack.push([children, i, l])
            children = children[i][childTypes]
            i = -1
            l = children.length
          }
          break
        case FILTER_SKIP:
          if ( deep && i < l && children[i][childTypes].length ) {
            stack.push([children, i, l])
            children = children[i][childTypes]
            i = -1
            l = children.length
          }
          break
        case FILTER_IGNORE:
          break
        case FILTER_STOP:
          return ret
      }
      while ( stack.length && i + 1 >= l ) {
        children = stack.pop()
        i = children[1]
        l = children[2]
        children = children[0]
      }
    }
    return ret
  }
  hud.filterElements = function ( root, filter, deep ){
    return hud.filter(root, filter, deep, "children")
  }
  hud.filterChildNodes = function ( root, filter, deep ){
    return hud.filter(root, filter, deep, "childNode")
  }
  hud.find = function ( root, name, deep ){
    var element = null
    root = root || document.body
    hud.filterElements(root, function ( el ){
      if ( el.getAttribute("role") == name ) {
        element = el
        return FILTER_STOP
      }
      return FILTER_SKIP
    }, deep)
    return element
  }
  hud.findSub = function ( root, name, deep ){
    var element = null
    root = root || document.body
    name = new RegExp("^" + name + "(:\\w+)*$")
    hud.filterElements(root, function ( el ){
      if ( name.test(el.getAttribute("role")) ) {
        element = el
        return FILTER_STOP
      }
      return FILTER_SKIP
    }, deep)
    return element
  }
  hud.findAll = function ( root, name, deep ){
    root = root || document.body
    return hud.filterElements(root, function ( el ){
      return el.getAttribute("role") == name
        ? FILTER_PICK
        : FILTER_SKIP
    }, deep)
  }
  hud.findAllSub = function ( root, name, deep ){
    root = root || document.body
    name = new RegExp("^" + name + "(:\\w+)*$")
    return hud.filterElements(root, function ( el ){
      return name.test(el.getAttribute("role"))
        ? FILTER_PICK
        : FILTER_SKIP
    }, deep)
  }

  return hud
}));
hud.Role.extend({
  appendChild: function ( element ){
    this.element.appendChild(element)
    return this
  },
  appendTo: function ( element ){
    element.appendChild(this.element)
    return this
  },
  prependChild: function ( element ){
    if ( this.element.firstChild ) {
      this.element.insertBefore(element, this.element.firstChild)
    }
    else {
      this.element.appendChild(element)
    }
    return this
  },
  prependTo: function ( element ){
    if ( element.firstChild ) {
      element.insertBefore(this.element, element.firstChild)
    }
    else {
      element.appendChild(this.element)
    }
    return this
  },
  replaceChild: function ( newElement, refElement ){
    this.element.replaceChild(newElement, refElement)
    return this
  },
  replaceTo: function ( child ){
    child.parentNode.replaceChild(this.element, child)
    return this
  },
  insertAfter: function ( newElement, refElement ){
    if ( refElement.nextSibling ) {
      this.element.insertBefore(newElement, refElement.nextSibling)
    }
    else {
      this.element.appendChild(newElement)
    }
    return this
  },
  insertElementAfter: function ( element ){
    if ( element.nextSibling ) {
      element.parentNode.insertBefore(this.element, element.nextSibling)
    }
    else {
      element.parentNode.appendChild(this.element)
    }
    return this
  },
  insertBefore: function ( newElement, refElement ){
    this.element.insertBefore(newElement, refElement)
    return this
  },
  insertElementBefore: function ( element ){
    element.parentNode.insertBefore(this.element, element)
    return this
  },
  removeElement: function (){
    this.element.parentNode.removeChild(this.element)
    return this
  },
  removeChild: function ( childNode ){
    this.element.removeChild(childNode)
    return this
  },
  swapChildren: function ( child1, child2 ){
    var nextSibling = child1.nextSibling
    child2.parentNode.replaceChild(child1, child2)
    if ( nextSibling ) {
      nextSibling.parentNode.insertBefore(child2, nextSibling)
    }
    else {
      nextSibling.parentNode.appendChild(child2)
    }
  },
  swapElement: function ( anotherElement ){
    var nextSibling = this.element.nextSibling
    anotherElement.parentNode.replaceChild(this.element, anotherElement)
    if ( nextSibling ) {
      nextSibling.parentNode.insertBefore(anotherElement, nextSibling)
    }
    else {
      nextSibling.parentNode.appendChild(anotherElement)
    }
  },
  setAttribute: function ( name, value ){
    this.element.setAttribute(name, value)
    return this
  },
  removeAttribute: function ( name ){
    this.element.removeAttribute(name)
    return this
  },
  getAttribute: function ( name ){
    this.element.getAttribute(name)
    return this
  },
  textContent: function ( string ){
    if ( string === undefined ) {
      return this.element.textContent
    }
    else {
      return this.element.textContent = string
    }
  },
  value: function ( value ){
    if ( value === undefined ) {
      return this.element.value
    }
    else {
      return this.element.value = value
    }
  },
  innerHTML: function ( html ){
    if ( html === undefined ) {
      return this.element.innerHTML
    }
    else {
      return this.element.innerHTML = html
    }
  },
  style: (function(  ){
    function getStyle( el, prop ){
      var value = ""
      if ( window.getComputedStyle ) {
        value = getComputedStyle(el).getPropertyValue(prop)
      }
      else if ( el.currentStyle ) {
        try {
          value = el.currentStyle[prop]
        }
        catch ( e ) {}
      }
      return value;
    }
    return function ( prop, value ){
      if ( value === undefined ) {
        if ( typeof prop === "string" ) {
          return getStyle(this.element, prop)
        }
        else for ( var name in prop ) {
          this.element.style[name] = prop[name]
        }
      }
      else {
        this.element.style[prop] = value
      }
      return this
    }
  }(  ))
})
;
/*! Dust - Asynchronous Templating - v2.3.4
* http://linkedin.github.io/dustjs/
* Copyright (c) 2014 Aleksander Williams; Released under the MIT License */
!function(root){function Context(a,b,c,d){this.stack=a,this.global=b,this.blocks=c,this.templateName=d}function Stack(a,b,c,d){this.tail=b,this.isObject=a&&"object"==typeof a,this.head=a,this.index=c,this.of=d}function Stub(a){this.head=new Chunk(this),this.callback=a,this.out=""}function Stream(){this.head=new Chunk(this)}function Chunk(a,b,c){this.root=a,this.next=b,this.data=[],this.flushable=!1,this.taps=c}function Tap(a,b){this.head=a,this.tail=b}var dust={},NONE="NONE",ERROR="ERROR",WARN="WARN",INFO="INFO",DEBUG="DEBUG",loggingLevels=[DEBUG,INFO,WARN,ERROR,NONE],EMPTY_FUNC=function(){},logger={},originalLog,loggerContext;dust.debugLevel=NONE,dust.silenceErrors=!1,root&&root.console&&root.console.log&&(loggerContext=root.console,originalLog=root.console.log),logger.log=loggerContext?function(){logger.log="function"==typeof originalLog?function(){originalLog.apply(loggerContext,arguments)}:function(){var a=Array.prototype.slice.apply(arguments).join(" ");originalLog(a)},logger.log.apply(this,arguments)}:function(){},dust.log=function(a,b){if(dust.isDebug&&dust.debugLevel===NONE&&(logger.log('[!!!DEPRECATION WARNING!!!]: dust.isDebug is deprecated.  Set dust.debugLevel instead to the level of logging you want ["debug","info","warn","error","none"]'),dust.debugLevel=INFO),b=b||INFO,dust.indexInArray(loggingLevels,b)>=dust.indexInArray(loggingLevels,dust.debugLevel)&&(dust.logQueue||(dust.logQueue=[]),dust.logQueue.push({message:a,type:b}),logger.log("[DUST "+b+"]: "+a)),!dust.silenceErrors&&b===ERROR)throw"string"==typeof a?new Error(a):a},dust.onError=function(a,b){if(logger.log("[!!!DEPRECATION WARNING!!!]: dust.onError will no longer return a chunk object."),dust.log(a.message||a,ERROR),dust.silenceErrors)return b;throw a},dust.helpers={},dust.cache={},dust.register=function(a,b){a&&(dust.cache[a]=b)},dust.render=function(a,b,c){var d=new Stub(c).head;try{dust.load(a,d,Context.wrap(b,a)).end()}catch(e){dust.log(e,ERROR)}},dust.stream=function(a,b){var c=new Stream;return dust.nextTick(function(){try{dust.load(a,c.head,Context.wrap(b,a)).end()}catch(d){dust.log(d,ERROR)}}),c},dust.renderSource=function(a,b,c){return dust.compileFn(a)(b,c)},dust.compileFn=function(a,b){b=b||null;var c=dust.loadSource(dust.compile(a,b));return function(a,d){var e=d?new Stub(d):new Stream;return dust.nextTick(function(){"function"==typeof c?c(e.head,Context.wrap(a,b)).end():dust.log(new Error("Template ["+b+"] cannot be resolved to a Dust function"),ERROR)}),e}},dust.load=function(a,b,c){var d=dust.cache[a];return d?d(b,c):dust.onLoad?b.map(function(b){dust.onLoad(a,function(d,e){return d?b.setError(d):(dust.cache[a]||dust.loadSource(dust.compile(e,a)),void dust.cache[a](b,c).end())})}):b.setError(new Error("Template Not Found: "+a))},dust.loadSource=function(source,path){return eval(source)},dust.isArray=Array.isArray?Array.isArray:function(a){return"[object Array]"===Object.prototype.toString.call(a)},dust.indexInArray=function(a,b,c){if(c=+c||0,Array.prototype.indexOf)return a.indexOf(b,c);if(void 0===a||null===a)throw new TypeError('cannot call method "indexOf" of null');var d=a.length;for(1/0===Math.abs(c)&&(c=0),0>c&&(c+=d,0>c&&(c=0));d>c;c++)if(a[c]===b)return c;return-1},dust.nextTick=function(){return function(a){setTimeout(a,0)}}(),dust.isEmpty=function(a){return dust.isArray(a)&&!a.length?!0:0===a?!1:!a},dust.filter=function(a,b,c){if(c)for(var d=0,e=c.length;e>d;d++){var f=c[d];"s"===f?(b=null,dust.log("Using unescape filter on ["+a+"]",DEBUG)):"function"==typeof dust.filters[f]?a=dust.filters[f](a):dust.log("Invalid filter ["+f+"]",WARN)}return b&&(a=dust.filters[b](a)),a},dust.filters={h:function(a){return dust.escapeHtml(a)},j:function(a){return dust.escapeJs(a)},u:encodeURI,uc:encodeURIComponent,js:function(a){return JSON?JSON.stringify(a):(dust.log("JSON is undefined.  JSON stringify has not been used on ["+a+"]",WARN),a)},jp:function(a){return JSON?JSON.parse(a):(dust.log("JSON is undefined.  JSON parse has not been used on ["+a+"]",WARN),a)}},dust.makeBase=function(a){return new Context(new Stack,a)},Context.wrap=function(a,b){return a instanceof Context?a:new Context(new Stack(a),{},null,b)},Context.prototype.get=function(a,b){return"string"==typeof a&&("."===a[0]&&(b=!0,a=a.substr(1)),a=a.split(".")),this._get(b,a)},Context.prototype._get=function(a,b){var c,d,e,f,g=this.stack,h=1;if(dust.log("Searching for reference [{"+b.join(".")+"}] in template ["+this.getTemplateName()+"]",DEBUG),d=b[0],e=b.length,a&&0===e)f=g,g=g.head;else{if(a)g&&(g=g.head?g.head[d]:void 0);else{for(;g&&(!g.isObject||(f=g.head,c=g.head[d],void 0===c));)g=g.tail;g=void 0!==c?c:this.global?this.global[d]:void 0}for(;g&&e>h;)f=g,g=g[b[h]],h++}if("function"==typeof g){var i=function(){try{return g.apply(f,arguments)}catch(a){return dust.log(a,ERROR)}};return i.isFunction=!0,i}return void 0===g&&dust.log("Cannot find the value for reference [{"+b.join(".")+"}] in template ["+this.getTemplateName()+"]"),g},Context.prototype.getPath=function(a,b){return this._get(a,b)},Context.prototype.push=function(a,b,c){return new Context(new Stack(a,this.stack,b,c),this.global,this.blocks,this.getTemplateName())},Context.prototype.rebase=function(a){return new Context(new Stack(a),this.global,this.blocks,this.getTemplateName())},Context.prototype.current=function(){return this.stack.head},Context.prototype.getBlock=function(a){if("function"==typeof a){var b=new Chunk;a=a(b,this).data.join("")}var c=this.blocks;if(!c)return void dust.log("No blocks for context[{"+a+"}] in template ["+this.getTemplateName()+"]",DEBUG);for(var d,e=c.length;e--;)if(d=c[e][a])return d},Context.prototype.shiftBlocks=function(a){var b,c=this.blocks;return a?(b=c?c.concat([a]):[a],new Context(this.stack,this.global,b,this.getTemplateName())):this},Context.prototype.getTemplateName=function(){return this.templateName},Stub.prototype.flush=function(){for(var a=this.head;a;){if(!a.flushable)return a.error?(this.callback(a.error),dust.log("Chunk error ["+a.error+"] thrown. Ceasing to render this template.",WARN),void(this.flush=EMPTY_FUNC)):void 0;this.out+=a.data.join(""),a=a.next,this.head=a}this.callback(null,this.out)},Stream.prototype.flush=function(){for(var a=this.head;a;){if(!a.flushable)return a.error?(this.emit("error",a.error),dust.log("Chunk error ["+a.error+"] thrown. Ceasing to render this template.",WARN),void(this.flush=EMPTY_FUNC)):void 0;this.emit("data",a.data.join("")),a=a.next,this.head=a}this.emit("end")},Stream.prototype.emit=function(a,b){if(!this.events)return dust.log("No events to emit",INFO),!1;var c=this.events[a];if(!c)return dust.log("Event type ["+a+"] does not exist",WARN),!1;if("function"==typeof c)c(b);else if(dust.isArray(c))for(var d=c.slice(0),e=0,f=d.length;f>e;e++)d[e](b);else dust.log("Event Handler ["+c+"] is not of a type that is handled by emit",WARN)},Stream.prototype.on=function(a,b){return this.events||(this.events={}),this.events[a]?"function"==typeof this.events[a]?this.events[a]=[this.events[a],b]:this.events[a].push(b):(dust.log("Event type ["+a+"] does not exist. Using just the specified callback.",WARN),b?this.events[a]=b:dust.log("Callback for type ["+a+"] does not exist. Listener not registered.",WARN)),this},Stream.prototype.pipe=function(a){return this.on("data",function(b){try{a.write(b,"utf8")}catch(c){dust.log(c,ERROR)}}).on("end",function(){try{return a.end()}catch(b){dust.log(b,ERROR)}}).on("error",function(b){a.error(b)}),this},Chunk.prototype.write=function(a){var b=this.taps;return b&&(a=b.go(a)),this.data.push(a),this},Chunk.prototype.end=function(a){return a&&this.write(a),this.flushable=!0,this.root.flush(),this},Chunk.prototype.map=function(a){var b=new Chunk(this.root,this.next,this.taps),c=new Chunk(this.root,b,this.taps);return this.next=c,this.flushable=!0,a(c),b},Chunk.prototype.tap=function(a){var b=this.taps;return this.taps=b?b.push(a):new Tap(a),this},Chunk.prototype.untap=function(){return this.taps=this.taps.tail,this},Chunk.prototype.render=function(a,b){return a(this,b)},Chunk.prototype.reference=function(a,b,c,d){return"function"==typeof a&&(a.isFunction=!0,a=a.apply(b.current(),[this,b,null,{auto:c,filters:d}]),a instanceof Chunk)?a:dust.isEmpty(a)?this:this.write(dust.filter(a,c,d))},Chunk.prototype.section=function(a,b,c,d){if("function"==typeof a&&(a=a.apply(b.current(),[this,b,c,d]),a instanceof Chunk))return a;var e=c.block,f=c["else"];if(d&&(b=b.push(d)),dust.isArray(a)){if(e){var g=a.length,h=this;if(g>0){b.stack.head&&(b.stack.head.$len=g);for(var i=0;g>i;i++)b.stack.head&&(b.stack.head.$idx=i),h=e(h,b.push(a[i],i,g));return b.stack.head&&(b.stack.head.$idx=void 0,b.stack.head.$len=void 0),h}if(f)return f(this,b)}}else if(a===!0){if(e)return e(this,b)}else if(a||0===a){if(e)return e(this,b.push(a))}else if(f)return f(this,b);return dust.log("Not rendering section (#) block in template ["+b.getTemplateName()+"], because above key was not found",DEBUG),this},Chunk.prototype.exists=function(a,b,c){var d=c.block,e=c["else"];if(dust.isEmpty(a)){if(e)return e(this,b)}else if(d)return d(this,b);return dust.log("Not rendering exists (?) block in template ["+b.getTemplateName()+"], because above key was not found",DEBUG),this},Chunk.prototype.notexists=function(a,b,c){var d=c.block,e=c["else"];if(dust.isEmpty(a)){if(d)return d(this,b)}else if(e)return e(this,b);return dust.log("Not rendering not exists (^) block check in template ["+b.getTemplateName()+"], because above key was found",DEBUG),this},Chunk.prototype.block=function(a,b,c){var d=c.block;return a&&(d=a),d?d(this,b):this},Chunk.prototype.partial=function(a,b,c){var d;d=dust.makeBase(b.global),d.blocks=b.blocks,b.stack&&b.stack.tail&&(d.stack=b.stack.tail),c&&(d=d.push(c)),"string"==typeof a&&(d.templateName=a),d=d.push(b.stack.head);var e;return e="function"==typeof a?this.capture(a,d,function(a,b){d.templateName=d.templateName||a,dust.load(a,b,d).end()}):dust.load(a,this,d)},Chunk.prototype.helper=function(a,b,c,d){var e=this;try{return dust.helpers[a]?dust.helpers[a](e,b,c,d):(dust.log("Invalid helper ["+a+"]",WARN),e)}catch(f){return dust.log(f,ERROR),e}},Chunk.prototype.capture=function(a,b,c){return this.map(function(d){var e=new Stub(function(a,b){a?d.setError(a):c(b,d)});a(e.head,b).end()})},Chunk.prototype.setError=function(a){return this.error=a,this.root.flush(),this},Tap.prototype.push=function(a){return new Tap(a,this)},Tap.prototype.go=function(a){for(var b=this;b;)a=b.head(a),b=b.tail;return a};var HCHARS=new RegExp(/[&<>\"\']/),AMP=/&/g,LT=/</g,GT=/>/g,QUOT=/\"/g,SQUOT=/\'/g;dust.escapeHtml=function(a){return"string"==typeof a?HCHARS.test(a)?a.replace(AMP,"&amp;").replace(LT,"&lt;").replace(GT,"&gt;").replace(QUOT,"&quot;").replace(SQUOT,"&#39;"):a:a};var BS=/\\/g,FS=/\//g,CR=/\r/g,LS=/\u2028/g,PS=/\u2029/g,NL=/\n/g,LF=/\f/g,SQ=/'/g,DQ=/"/g,TB=/\t/g;dust.escapeJs=function(a){return"string"==typeof a?a.replace(BS,"\\\\").replace(FS,"\\/").replace(DQ,'\\"').replace(SQ,"\\'").replace(CR,"\\r").replace(LS,"\\u2028").replace(PS,"\\u2029").replace(NL,"\\n").replace(LF,"\\f").replace(TB,"\\t"):a},"object"==typeof exports?module.exports=dust:root.dust=dust}(this);;
(function(){dust.register("login",body_0);function body_0(chk,ctx){return chk.write("<section role=\"login\"><h2>Login</h2><label class=\"label\"><input role=\"login:user\" class=\"field\" type=\"text\" placeholder=\"Hummingbird username\"/></label><label class=\"label\"><input role=\"login:password\" class=\"field\" type=\"password\" placeholder=\"Hummingbird password\"/></label><button role=\"login:submit\">Log in</button><div role=\"login:error\" class=\"error\"></div></section>");}return body_0;})();;
(function(){dust.register("user",body_0);function body_0(chk,ctx){return chk.write("<section role=\"user\"><h2 role=\"user:name\"></h2><button role=\"user:logout\">Log out</button></section>");}return body_0;})();;
// ====================== OPTIONS ======================
(function ( chrome ){

  hud.register("login", function ( login ){
    var user = this.find("login:user")
      , password = this.find("login:password")
      , error = this.find("login:error")

    this.role("login:submit").on("click", function (){
      error.textContent = ""
      humm.authenticate(user.value, password.value, function ( err, resp ){
        if ( err ) {
          error.textContent = err.toString()
        }
        else {
          chrome.storage.sync.set({
            user: user.value
          }, function ( err, resp ){
            location.reload()
          })
        }
      })
    })
  })

  hud.register("user", function ( login ){
    var user = this.find("user:name")
    chrome.storage.sync.get("user", function ( values ){
      user.textContent = values.user
    })
    this.role("user:logout").on("click", function (){
      humm.removeToken(function (){
        location.reload()
      })
    })
  })

  hud.create(hud.find(document.body, "setting:user"), function ( element ){
    var setting = this
    humm.getToken(function ( value ){
      if ( value ) {
        util.render("user").appendTo(setting.element)
      }
      else {
        util.render("login").appendTo(setting.element)
      }
      humm.contextMenu.init()
    })
  })

}(window.chrome))