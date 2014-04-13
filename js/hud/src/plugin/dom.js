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
