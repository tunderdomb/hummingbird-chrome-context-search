/**
 * Tabset
 *
 * NOTE: insertions assume that tabs and panels are direct descendants of
 * a tablist and a tabpool,
 * */
hud.register("tabset", function(  ){
  var tabset = this

  tabset.extend(this.options("tabset", {
    maxTabs: 100,
    drawer: false,
    onClose: "next" // "prev"
  }))
  tabset.tablist = this.role("tablist")
  tabset.tabs = this.allRole("tab", function(  ){
    var tab = this
    this.on("click", function(  ){
      tabset.select(tabset.tabs.indexOf(tab))
    })
    var closeButton = this.role("tab:close")
    if( closeButton ) closeButton.on("click", function(  ){
      tabset.close(tabset.tabs.indexOf(tab))
    })
  })
  tabset.tabpool = this.role("tabpool")
  tabset.panels = this.allRole("tabpanel")
  tabset.length = tabset.tabs.length
  this.checkIntegrity()
}, {

  length: 0,
  current: -1,
  currentTab: null,
  currentPanel: null,
  isBusy: false,

  busy: function( bool ){
    this.isBusy = !!bool
  },
  checkIntegrity: function( silent ){
    if( this.tabs.length === this.panels.length ) return true
    if( silent ) return false
    throw new Error("Unbalanced tabset: tabs("+this.tabs.length+") panels("+this.panels.length+")")
  },
  at: function( index, f ){
    f.call(this, this.tabs[index], this.panels[index])
  },
  next: function( index, f ){
    if( !this.length || !this.checkIntegrity() ) return -1
    if ( ++index >= this.length ) index = 0
    f && this.at(index, f)
    return index
  },
  prev: function( index, f ){
    if( !this.length || !this.checkIntegrity() ) return -1
    if ( --index < 0  ) index = this.length-1
    f && this.at(index, f)
    return index
  },
  select: function( index ){
    if( this.isBusy ) return this
    this.at(index, function( tab, panel ){
      if( !tab || !panel ) return
      if ( this.currentTab && this.currentPanel ) {
        this.broadcast("hide", this.currentTab, this.currentPanel)
      }
      if ( tab && panel ) {
        this.broadcast("show", tab, panel)
        this.currentTab = tab
        this.currentPanel = panel
        this.current = index
      }
    })
    return this
  },
  selectNext: function(  ){
    this.select(this.next(this.current))
  },
  selectPrev: function(  ){
    this.select(this.prev(this.current))
  },
  close: function( index ){
    if( this.isBusy ) return this
    this.at(index, function( tab, panel ){
      if( !tab || !panel ) return
      this.broadcast("close", tab, panel)
      this.tabs.splice(index, 1)
      this.panels.splice(index, 1)
      switch( true ){
        case this.onClose == "prev":
        case this.onclose == "next" && this.length-1 == this.current:
          this.selectPrev()
          break
        case "next":
        default:
          this.selectNext()
      }
    })
    return this
  },
  insertBefore: function( index, newTab, newPanel ){
    this.at(index, function( tab, panel ){
      if ( !tab && !panel ) {
        this.tablist.element.appendChild(newTab)
        this.tabpool.element.appendChild(newPanel)
      }
      else {
        this.tablist.element.insertBefore(newTab, tab.element)
        this.tabpool.element.insertBefore(newPanel, panel.element)
      }
    })
  },
  insertAfter: function( index, newTab, newPanel ){
    this.at(index, function( tab, panel ){
      if ( !tab && !panel ) {
        this.tablist.element.appendChild(newTab)
        this.tabpool.element.appendChild(newPanel)
      }
      else {
        if ( tab.element.nextSibling ) {
          this.tablist.element.insertBefore(newTab, tab.element.nextSibling)
        }
        else {
          this.tablist.element.appendChild(newTab)
        }
        if ( panel.element.nextSibling ) {
          this.tabpool.element.insertBefore(newPanel, panel.element.nextSibling)
        }
        else {
          this.tabpool.element.appendChild(newPanel)
        }
      }
    })
  },
  create: function( tabElement, panelElement, f ){
    f.call(this, hud.create(tabElement), hud.create(panelElement))
    return this
  },
  push: function( tabElement, panelElement ){
    return this.addAt(this.length-1, tabElement, panelElement)
  },
  unshift: function( tabElement, panelElement ){
    return this.addAt(-1, tabElement, panelElement)
  },
  addAt: function( index, tabElement, panelElement ){
    if( !tabElement || !panelElement ) return this
    this.create(tabElement, panelElement, function( newTab, newPanel ){
      if ( index == -1 ) {
        this.tabs.unshift(newTab)
        this.panels.unshift(newPanel)
        this.insertBefore(0, tabElement, panelElement)
      }
      else {
        this.tabs.splice(index, 0, newTab)
        this.panels.splice(index, 0, newPanel)
        this.insertAfter(index, tabElement, panelElement)
      }
      ++this.length
    })
    return this
  },
  swap: function( index1, index2 ){
    return this.at(index1, function( tab1, panel1 ){
      if( tab1 && panel1 ) this.at(index2, function( tab2, panel2 ){
        if( !tab2 || !panel2 ) return
        this.tabs.splice(index1, 1, tab2)
        this.tabs.splice(index2, 1, tab1)
        this.panels.splice(index1, 1, panel2)
        this.panels.splice(index2, 1, panel1)
      })
    })
  }
})