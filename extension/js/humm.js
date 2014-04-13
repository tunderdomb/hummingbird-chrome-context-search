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
}({}, window.chrome));
// ====================== API ======================
var humm = (function ( humm, chrome){

  function request( url ){
    return util.request(url).headers({
      Accept: "*/*",
      "X-Mashape-Authorization": "1KJZyuFLKKq09Hs0ToCOu7LtgrThO7tn"
    })
  }

  humm.status = {
    "currently-watching": "currently-watching",
    "plan-to-watch": "plan-to-watch",
    "completed": "completed",
    "on-hold": "on-hold",
    "dropped": "dropped"
  }
  humm.privacy = {
    "private": "private",
    "public": "public"
  }

  humm.getToken = function ( done ){
    window.chrome.storage.sync.get("authToken", function( values ){
      if ( done ) {done(values ? values.authToken : null)
      }
      else {
        console.log(values)
      }
    })
  }

  humm.saveToken = function ( tokenString, done ){
    window.chrome.storage.sync.set({
      authToken: tokenString
    }, function( resp ){
      if ( done ) {
        done.apply(this, arguments)
      }
      else {
        console.log(resp)
      }
    })
  }

  humm.removeToken = function ( done ){
    window.chrome.storage.sync.remove("authToken", function( resp ){
      if ( done ) {
        done.apply(this, arguments)
      }
      else {
        console.log(resp)
      }
    })
  }

  humm.anime = function ( id, done ){
    return request("https://hummingbirdv1.p.mashape.com/anime/" + id)
      .json()
      .get(function( err, resp ){
        err = err || resp ? resp.error || resp.message : null
        if( err ) {
          console.warn(err)
        }
        done(err, resp)
      })
  }

  humm.search = function( query, done ){
    humm.anime(humm.normalize(query), done)
  }

  humm.authenticate = function ( user, pass, done ){
    var data = {
      password: pass
    }
    if ( user && ~user.indexOf("@") ) {
      data.email = user
    }
    else {
      data.username = user
    }
    request("https://hummingbirdv1.p.mashape.com/users/authenticate")
      .json()
      .done(function( err, resp ){

        err = err || resp ? resp.error || resp.message : null
        if( err ) {
          console.warn(err)
          done(err)
          return
        }
        humm.saveToken(resp, done)
      })
      .post(data)
  }

  humm.library = {}

  humm.library.getAnime = function ( user, status, done ){
    humm.getToken(function ( token ){
      var url = "https://hummingbirdv1.p.mashape.com/users/" + user + "/library?" +
        (status ? "status=" + status + "&" : "") +
        "auth_token=" + token
      request(url).urlEncode().get(done)
    })
  }
  humm.library.removeAnime = function ( id, done ){
    humm.getToken(function ( token ){
      var url = "https://hummingbirdv1.p.mashape.com/libraries/" + id + "/remove"
      request(url).done(done).json().post({
        "auth_token": token
      })
    })

  }

  /**
   *
   "auth_token": token,
   "status": currently-watching / plan-to-watch / completed / on-hold / dropped,
   "privacy": "private",
   "rating": undefined,
   "rewatched_times": undefined,
   "notes": "I love environmental theme in this show.",
   "episodes_watched": undefined,
   "increment_episodes": "false"
   * */
  humm.library.update = function ( name, options, done ){
    humm.getToken(function( token ){
      if ( !token ) {
        done("Not logged in!")
        return
      }
      humm.search(name, function( err ){
        if ( err ) {
          done(err)
          return
        }
        options.auth_token = token
        request("https://hummingbirdv1.p.mashape.com/libraries/"+name)
          .done(done)
          .json()
          .post(options)
      })
    })
  }
  humm.library.planToWatch = function( name, done ){
    humm.library.update(name, {
      status: "plan-to-watch"
    }, done)
  }
  humm.library.currentlyWatching = function( name, done ){
    humm.library.update(name, {
      status: "currently-watching"
    }, done)
  }
  humm.library.completed = function( name, done ){
    humm.library.update(name, {
      status: "completed"
    }, done)
  }
  humm.library.onHold = function( name, done ){
    humm.library.update(name, {
      status: "on-hold"
    }, done)
  }
  humm.library.dropped = function( name, done ){
    humm.library.update(name, {
      status: "dropped"
    }, done)
  }

  /**
   * Attempt to format a string to an anime id
   * like: Steins Gate to 'steins-gate'
   * Steins;Gate will become steinsgate which is wrong
   * but that's all we can do..
   * */
  humm.normalize = function( query ){
    return query
      .replace(/\s+/g, "-")
      .replace(/\W/g, function( match ){
        return match == "-" ? "-" : ""
      })
      .toLocaleLowerCase()
  }

  return humm
}({}, window.chrome));
// ====================== SEARCH ======================
!function ( f ){
  f(window, window.chrome)
}(function ( win, chrome ){

  chrome.contextMenus.onClicked.addListener(function( info, tab ){
    var query = info.selectionText

    switch( info.menuItemId ){
      case "search":
        humm.search(query, function( err, resp ){
          if ( err ) {
            query = query.replace(/(^[#\s]*)|([#\s]*$)/, "")
            util.open("http://hummingbird.me/search?query="+encodeURIComponent(query))
          }
          else {
            util.open("http://hummingbird.me/anime/"+humm.normalize(query))
          }
        })
        break
      case "plan-to-watch":
        humm.library.planToWatch(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Plan to watch "+query)
          }
        })
        break
      case "currently-watching":
        humm.library.currentlyWatching(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Currently watching "+query)
          }
        })
        break
      case "completed":
        humm.library.completed(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Completed "+query)
          }
        })
        break
      case "on-hold":
        humm.library.onHold(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success(query+" on hold")
          }
        })
        break
      case "dropped":
        humm.library.dropped(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Dropped "+query)
          }
        })
        break
      case "remove":
        humm.library.removeAnime(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Removed "+query+" from library")
          }
        })
        break
    }
  })

  humm.contextMenu = {}
  humm.contextMenu.createSimple = function(  ){
    chrome.contextMenus.create({
      id: "search",
      title: "Search on Hummingbird",
      contexts: ["selection"]
    })
  }
  humm.contextMenu.createComplex = function(  ){
    var parentId = chrome.contextMenus.create({
      title: "Hummingbird",
      contexts: ["selection"]
    })
    console.log(parentId)
    chrome.contextMenus.create({
      parentId: parentId,
      title: "%s",
      enabled: false,
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      type: "separator",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "search",
      title: "Search",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "plan-to-watch",
      title: "Plan to watch",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "currently-watching",
      title: "Currently watching",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "completed",
      title: "Completed",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "on-hold",
      title: "On hold",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "dropped",
      title: "Dropped",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "remove",
      title: "Remove from library",
      contexts: ["selection"]
    })
  }

  humm.contextMenu.init = function(  ){
    humm.getToken(function( token ){
      chrome.contextMenus.removeAll(function(  ){
        if( token ) humm.contextMenu.createComplex()
        else humm.contextMenu.createSimple()
      })
    })
  }

  humm.contextMenu.init()

})