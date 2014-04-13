hud.Role.extend({
  /**
   * returns a single property value, or an object for a property list
   * @param {String|String[]} prop - value(s) to return
   * */
  getData: function( prop ){
    if( typeof prop == "string" ){
      return this.element.getAttribute("data-"+prop)
    }
    else {
      var props = {}
        , element = this.element
      hud.util.each(prop, function( name ){
        props[name] = element.getAttribute("data-"+name)
      })
      return props
    }
  },
  /**
   * @param {String|Object} prop - value(s) to set
   * @param {*} [val] - value of this property if prop is a string
   * */
  setData: function( prop, val ){
    if( val != undefined && typeof prop == "string" ){
      this.element.setAttribute("data-"+prop, val)
    }
    else for( var name in prop ){
      this.element.setAttribute("data-"+name, prop[name])
    }
  },
  /**
   * delete values from the data attribute space
   * @param {String|String[]} prop - data value(s) to remove
   * */
  removeData: function( prop ){
    if( typeof prop == "string" ){
      this.element.removeAttribute("data-"+prop)
    }
    else {
      var element = this.element
      hud.util.each(prop, function( name ){
        element.removeAttribute("data-"+name)
      })
    }
  }
})