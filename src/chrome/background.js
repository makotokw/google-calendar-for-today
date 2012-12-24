(function($){
  $(document).ready(function() {
    var w = Blz.Widget,
      gcal = Blz.Google.Calendar,
      app = MyGoogleCal.Application;
      
    var defaultTitle = w.getResourceString('WINDOW_CAPTION');
    var canvas = document.getElementById('canvas'), canvasContext = canvas.getContext('2d'), icon = document.getElementById('icon');
    
    w.initialize();
    gcal.source = 'makoto_kw-MyGoogleCal-1';
    gcal.useGoogleLogin = (w.getPref('useGoogleApps')!='1') ? false : true;
    app._offset = 0;
    app.initialize();
    
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    function onTabUpdated(tabId, changeInfo) {
      var url = changeInfo.url;
      if (!url) return;
      if ((url.indexOf('//www.google.com/calendar/') != -1) ||
        ((url.indexOf('//www.google.com/a/') != -1) && (url.lastIndexOf('/acs') == url.length - 4)) ||
        (url.indexOf('//www.google.com/accounts/') != -1))
      {
        // The login screen isn't helpful
        if (url.indexOf('https://www.google.com/accounts/ServiceLogin?') === 0) {
          return;
        }
        //w.print("background.onTabUpdated: loginStatusChanged");
        update(true);
      }
    }
    
    function showDay(offset) {
      if (offset != app._offset) {
        app._offset = offset;
        update();
      }
    }
    
    var badgeText = '';
    function updateBadge() {
      var ba = chrome.browserAction;
      if (app.isLogin()) {
        var event = app.findFocusEvent();
        ba.setIcon({path:'icon.png'});
        if (!event) {
          badgeText = '';
          ba.setBadgeText({text:badgeText});
          ba.setTitle({'title':defaultTitle});
        } else {
          var now = new Date();
          var location = (event.location && event.location.length > 0) ? '( ' + event.location + ' )' : '';
          var time = (event.allDay) ? w.getResourceString('ALL_DAY_EVENT') : w.getResourceString('TIME_FROM_TO',[app.getTimeString(event.start),app.getTimeString(event.end)]);
          var remain = (now < event.start) ? app.getRemainTimeString(event.start) : '';
          var shortRemain = (now < event.start) ? app.getRemainTimeShortString(event.start) : '';
          var tooltip = [event.title,time,remain,location].join(' ');
          if (badgeText != shortRemain) {
            badgeText = shortRemain;
            ba.setBadgeText({text:badgeText});
            animateIcon();
            // notification(event);
          }
          ba.setTitle({'title':tooltip});
        }
        if (/[0-9]+m/.test(badgeText)) { // within 60min
          ba.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
        } else {
          ba.setBadgeBackgroundColor({color:[0, 24, 208, 255]});
        }
        
      } else {
        ba.setIcon({path:'icon_glay.png'});
        ba.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
        badgeText = '?';
        ba.setBadgeText({text:badgeText});
        ba.setTitle({'title':defaultTitle});
      }
    }
    
    var notified = {};
    function notification(event) {
      return; // TODO: test notification
      // try {
      //   var interval = 300 * 1000; // 5min
      //   var now = (new Date()).getTime(), start = event.start.getTime(), lastNotifiedAt = notified[event.id];
      //   if ((!lastNotifiedAt && now <= start && now + interval >= start) || lastNotifiedAt - now > interval) {
      //     var nc = window.notifications || window.webkitNotifications;
      //     var location = (event.location && event.location.length > 0) ? '( ' + event.location + ' )' : '';
      //     var time = (event.allDay) ? w.getResourceString('ALL_DAY_EVENT') : w.getResourceString('TIME_FROM_TO',[app.getTimeString(event.start),app.getTimeString(event.end)]);
      //     var body = time + " " +  location;
      //     var notification = nc.createNotification('icon_128.png', event.title, body);
      //     notification.show();
      //     setTimeout(function(){notification.cancel();},15000);
      //     notified[event.id] = now;
      //   }
      // }
      // catch (e) {}
    }
    
    function animateIcon(speed, frames) {
      var rotation = 0;
      speed = speed || 10,
      frames = frames || 36;
      var timerId = setInterval(function(){animateFlip();},speed);
      function animateFlip() {
        rotation += 1/frames;
        if (rotation <= 1) {
          drawIconAtRotation(rotation);
        } else {
          drawIconAtRotation(0);
          clearTimeout(timerId);
        }
      }
    }
    
    function ease(x) {
      return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
    }
    function drawIconAtRotation(rotation) {
      canvasContext.save();
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      canvasContext.translate(Math.ceil(canvas.width/2), Math.ceil(canvas.height/2));
      canvasContext.rotate(2*Math.PI*ease(rotation));
      canvasContext.drawImage(icon,-Math.ceil(canvas.width/2),-Math.ceil(canvas.height/2));
      canvasContext.restore();
      chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0,canvas.width,canvas.height)});
    }
    
    function update(force) {
      if (force) {
        w.print("background.update: crear cache");
        app.retrieveAllCalendar();
      }
      updateBadge();
      try {
        // update popup
        chrome.extension.sendRequest({update:true});
      } catch (e) {}
    }
    
    function getHeaderDateString(date) {
      var monthNames = w.getResourceString('SHORTMONTH_NAMES').split(',');
      var dayNames = w.getResourceString('SHORTDAY_NAMES').split(',');
      return w.getResourceString('HEADER_DATE',[monthNames[date.getMonth()-1],date.getDate(),dayNames[date.getDay()]]);
    }
    
    function getTimeString(date) {
      if (date) {
        var use24 = w.getPref('use24HourTime');
        var partOne = date.getHours(), partTwo = date.getMinutes(), amPM = '';
        if (!use24) {
          if (partOne > 12) {
            partOne = partOne - 12;
            amPM = ' PM';
          } else {
            amPM = (partOne == 12) ? ' PM' : ' AM';
          }
          if (!partOne) {
            partOne = 12;
          }
        }
        if (partTwo < 10) partTwo = '0' + partTwo;
        return partOne + ':' + partTwo + amPM;
      }
      return '';
    }
    function getRemainTimeString(date) {
      var now = new Date();
      var remain = '', minutes = Math.ceil((date - now) / (60 * 1000));
      if (minutes == 1) {
        remain =  w.getResourceString('TO_GO_MINUTE',[1]); // TBD
      } else if (minutes < 60) {
        remain = (minutes > 1) ? w.getResourceString('TO_GO_MINUTES',[minutes]) : w.getResourceString('TO_GO_MINUTE',[minutes]);
      } else if (minutes >= 60) {
        var hours = Math.floor(Number(minutes) / 60);
        minutes = minutes - 60 * hours;
        if (hours > 1) {
          remain = (minutes > 1) ? w.getResourceString('TO_GO_HOURS_MINUTES',[hours,minutes]) : w.getResourceString('TO_GO_HOURS_MINUTE',[hours,minutes]);
        } else {
          remain = (minutes > 1) ? w.getResourceString('TO_GO_HOUR_MINUTES',[hours,minutes]) : w.getResourceString('TO_GO_HOUR_MINUTE',[hours,minutes]);
        }
      }
      return remain;
    }
    function getRemainTimeShortString(date) {
      var now = new Date();
      var remain = '', minutes = Math.ceil((date - now) / (60 * 1000));
      if (minutes < 60) {
        remain = minutes+'m';
      } else if (minutes >= 60) {
        var hours = Math.floor(Number(minutes) / 60);
        //minutes = minutes - 60 * hours;
        //remain = hours+'h'+minutes+'m';
        remain = hours+'h';
      }
      return remain;
    }
    var observer = {
      onMyGoogleCalLoginCompleted: function(sender, event) {
        w.print("background.onMyGoogleCalLoginCompleted:"+event.success);
        if (event.success) {
          app.retrieveAllCalendar();
        }
        update();
      },
      onMyGoogleCalCalendarLoaded: function(sender, event) {
        w.print("background.onMyGoogleCalCalendarLoaded:"+event.items.length);
        update();
      },
      onMyGoogleCalEventLoaded: function(sender, event) {
        w.print("background.onMyGoogleCalEventLoaded:"+event.key);
        update();
      }
    };
    
    // update for timer
    setInterval(function(){update();},45*1000);
    // update for modified events via 5 min
    setInterval(function(){update(true);},300*1000);
    
    // extends Utils
    app.getHeaderDateString = getHeaderDateString;
    app.getTimeString = getTimeString;
    app.getRemainTimeString = getRemainTimeString;
    app.getRemainTimeShortString = getRemainTimeShortString;
    
    app.addObserver(observer);
    window.Blz = Blz;
    window.MyGoogleCal = app;
    window.showDay = showDay;
    window.update = update;
  });
})(jQuery);