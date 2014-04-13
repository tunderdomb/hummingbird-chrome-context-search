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
}({}, window.chrome))