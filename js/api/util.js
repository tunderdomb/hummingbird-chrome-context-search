// ====================== UTIL ======================
var util = (function ( util, chrome ){

  function Request( url ){
    this.url = url
    this.http = new XMLHttpRequest()
    var error
    this.http.addEventListener("error", function ( e ){
      error = e
    }.bind(this), false)
    this.http.addEventListener("load", function (){
      var response = this.http.response
      if ( this.isJSON && response ) {
        try {
          response = JSON.parse(response)
        }
        catch ( e ) {
          error = e
          response = null
        }
      }
      this.onDone(error, response)
    }.bind(this), false)
  }

  Request.prototype = {
    method: "GET",
    json: function (){
      this.isJSON = true
      this.headers({
        "Content-Type": "application/json; charset=utf-8"
      })
      return this
    },
    urlEncode: function (){
      this.isUrlEncodeed = true
      this.headers({
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      })
      return this
    },
    onDone: function ( err, resp ){},
    headers: function ( headers ){
      this.headersToSet = this.headersToSet || {}
      for ( var header in headers ) {
        this.headersToSet[header] = headers[header]
      }
      return this
    },
    post: function ( data, done ){
      this.done(done)
      var sendData = []
      if ( this.isUrlEncodeed ) {
        for ( var name in data ) {
          sendData.push(name + "=" + data[name])
        }
        sendData = sendData.join("&")
      }
      else if ( this.isJSON ) {
        try {
          sendData = JSON.stringify(data)
        }
        catch ( e ) {
          console.warn(e)
          this.onDone(e)
          return this
        }
      }
      return this.send("POST", sendData)
    },
    get: function ( done ){
      this.done(done)
      return this.send("GET")
    },
    send: function ( method, data ){
      this.http.open(method, this.url, true)
      for ( var header in this.headersToSet ) {
        this.http.setRequestHeader(header, this.headersToSet[header])
      }
      this.http.send(data)
      return this
    },
    done: function ( onDone ){
      this.onDone = onDone || this.onDone
      return this
    }
  }

  function currentTab( done ){
    window.chrome.tabs.query({
      active: true, lastFocusedWindow: true
    }, function ( tabs ){
      done(tabs[0])
    })
  }

  util.request = function ( url ){
    return new Request(url)
  }

  util.open = function ( url, active ){
    currentTab(function( tab ){
      window.chrome.tabs.create({
        url: url,
        index: tab.index + 1,
        active: active == undefined || active
      })
    })
  }

  util.render = function ( template, context ){
    dust.render(template, context, function ( errm, out ){
      var div = document.createElement("div")
      div.innerHTML = out
      template = hud[template](div.firstElementChild)
    })
    return template
  }

  util.message = function ( message, callback ){
    currentTab(function( tab ){
      chrome.tabs.sendMessage(tab.id, message, callback)
    })
  }
  util.message.error = function( content, query, callback ){
    util.message({
      type: "error",
      content: content,
      query: query
    }, callback)
  }
  util.message.success = function( content, callback ){
    util.message({
      type: "success",
      content: content
    }, callback)
  }

  util.execute = function( details, done ){
    currentTab(function( tab ){
      chrome.tabs.executeScript(tab.id, details, done)
    })
  }

  return util
}({}, window.chrome))