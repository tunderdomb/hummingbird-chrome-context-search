hud.Role.extend((function(  ){

  function splice( str, start, end, value ){
    return str.substr(0, start) + value + str.substr(start + end)
  }

  function Prop( node, attr, start, end ){
    this.node = node
    this.attr = attr
    this.start = start
    this.end = end
    this.value = ""
    this.next = null
    this.clear()
  }

  Prop.prototype = {
    set: function ( value ){
      if ( this.node.hasAttribute && this.node.hasAttribute(this.attr) ) {
        this.node.setAttribute(this.attr, splice(this.node.getAttribute(this.attr), this.start, this.end, ""))
        this.node.setAttribute(this.attr, splice(this.node.getAttribute(this.attr), this.start, this.start, value))
      }
      else if ( this.attr in this.node ) {
        this.node[this.attr] = splice(this.node[this.attr], this.start, this.end, "")
        this.node[this.attr] = splice(this.node[this.attr], this.start, this.start, value)
      }
      else {
        throw new Error("Invalid attribute '" + this.attr + "' on Element.")
      }
      this.end = this.start + value.length
      this.shift(value.length - this.value)
      this.value = value
    },
    /**
     * Shifting the start and end offset ensures that changing a value
     * before this on in the same node updates and maintains the integrity of offsets
     * */
    shift: function ( offset ){
      if ( !offset || !this.next ) return
      this.next.start += offset
      this.next.end += offset
      this.next.shift(offset)
    },
    clear: function (){
      if ( this.node.hasAttribute && this.node.hasAttribute(this.attr) ) {
        this.node.setAttribute(this.attr, splice(this.node.getAttribute(this.attr), this.start, this.end, ""))
      }
      else if ( this.attr in this.node ) {
        this.node[this.attr] = splice(this.node[this.attr], this.start, this.end, "")
      }
      else {
        throw new Error("Invalid attribute '" + this.attr + "' on Element.")
      }
      this.end = this.start
      this.shift(-this.value.length)
      this.value = ""
    }
  }

  /**
   * Collect template properties from a node attribute
   * This builds a chain of properties whose values will maintain
   * offset integrity among themselves.
   * */
  function matchProps( values, node, attr ){
    var match = true
      , prop
      , lastProp = null
    while ( match ) {
      match = node[attr].match(/{{(.+?)}}/)
      if ( match ) {
        prop = match[1]
        prop = values[prop] = new Prop(node, attr, match.index, match[0].length)
        if ( lastProp ) lastProp.next = prop
        lastProp = prop
      }
    }
  }

  return {
    initReactor: function(  ){
      var values = this.reactors = {}
      hud.util.each(this.findAllSub("reactor", true), function( reactor ){
        hud.util.each(reactor.attributes, function ( attr ){
          matchProps(values, attr, "value")
        })
        matchProps(values, reactor, "textContent")
      })
    },
    setReactor: function ( prop, value ){
      if ( this.reactors && this.reactors[prop] ) this.reactors[prop].set(value)
      return this
    },
    getReactor: function ( prop ){
      if ( this.reactors && this.reactors[prop] ) return this.reactors[prop].value
      return null
    },
    hasReactor: function ( prop ){
      return !!this.reactors && !!this.reactors[prop]
    },
    clearReactor: function ( prop ){
      if ( this.reactors && this.reactors[prop] ) this.reactors[prop].clear()
      return this
    }
  }
}()))