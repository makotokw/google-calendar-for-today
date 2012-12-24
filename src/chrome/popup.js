(function($){
  var background = chrome.extension.getBackgroundPage(),
    Blz = background.Blz, w = Blz.Widget, app = background.MyGoogleCal
    ;
  /*$('#cal_close').attr({title:w.getResourceString('CLOSE_MENU')}).click(function(){
    window.close();
  });*/
  $('#header_title')
    .html(w.getResourceString('WINDOW_CAPTION'))
    .attr({title:w.getResourceString('GO_TO_CALENDAR')})
    .click(function(e){
    calendar = app.getCalendarUrl();
    chrome.tabs.getAllInWindow(undefined, function(tabs) {
      for (var i = 0, tab; tab = tabs[i]; i++) {
        if (tab.url && tab.url.indexOf(calendar) === 0) {
          chrome.tabs.update(tab.id, {selected: true});
          window.close();
          return;
        }
      }
      chrome.tabs.create({url:calendar});
    });
    return false;
  });
  $('#prev').attr({title:w.getResourceString('JUMP_BACKWORD')}).click(function(e){background.showDay(app._offset-1); return false;});
  $('#home').attr({title:w.getResourceString('JUMP_TODAY')}).click(function(e){background.showDay(0); return false;});
  $('#next').attr({title:w.getResourceString('JUMP_FORWARD')}).click(function(e){background.showDay(app._offset+1); return false;});
  $('#refresh').attr({title:w.getResourceString('REFRESH_MENU')}).click(function(e){background.update(true); return false;});
  
  chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.update) update();
  });
  
  $.fn.extend({
    _msg: function(message, loading) {
      $(this).append($('<span/>').addClass((loading) ? 'indicator' : 'message').html(message));
      return this;
    }
  });
  function update() {
    var $cal = $('#events').empty();
    
    if (app.isLoginRequesting()) {
      $cal._msg(w.getResourceString('NOW_LOGIN'),true);
      return;
    }
    if (!app.isLogin()) {
      if (app.isGoogleApps()) {
        // required client login, go to option
        $cal._msg(w.getResourceString('SESSION_ERROR_ALERT', [chrome.extension.getURL("options.html")]));
      }
      else {
        // In Google account, extension will work with browser session.
        $cal._msg(w.getResourceString('SESSION_ERROR_ALERT', [app.getCalendarUrl()]));
      }
      return;
    }
    if (app.isCalendarListRequesting()) {
      $cal._msg(w.getResourceString('LOADING_CALENDARLIST'),true);
      return;
    }
    if (!app.gcal.cacheCalendars.length){
      $cal._msg(w.getResourceString('NOTHING_CALENDARLIST'));
      return;
    }

    var now = new Date();
    var displayDayCount = w.getPref('displayDayCount'), showPast = (w.getPref('showPast') == '1');
    for (var index = 0, showDays = (!isNaN(displayDayCount)) ? displayDayCount : 2; index < showDays; index++) {
      var offset = app._offset + index;
      var cStart = new Blz.GData.Date().addDays(offset).resetHours(), cEnd = cStart.clone().addDays(1);
      var events = [], cache = app.getAppointments(cStart); // copy the array to add repeaters
      for (var calid in cache.items) {
        var cal = app.findCalendarById(calid);
        if (cal && cal.selected) {
          events = events.concat(cache.items[calid]);
        } else {
          //w.print('"'+cal.title+'" calendar is not selected.');
        }
      }
      var header = app.getHeaderDateString(cStart);
      if (offset === 0) header += ' - ' + w.getResourceString('TODAY');
      else if (offset == 1) header += ' - ' + w.getResourceString('TOMORROW');
      else if (offset == -1) header += ' - ' + w.getResourceString('YESTERDAY');
      $cal.append($('<div/>').addClass('day_header').html(header));
      
      var eventCount = 0, displayEventWithoutAllDayCount = 0, displayEventCount = 0, nextEventIndex = -1;
      if (events.length > 0) {
        events.sort(app.appointmentCompare);
        var $list = $('<ul/>').addClass('event_list');
        if (offset === 0) $list.addClass('today');
        var $nowListItem = $('<li/>').addClass('nowmarker').attr({title:now.toLocaleTimeString()}).html(now.toLocaleTimeString()), isAppendedNow = false;
        for (var i=0, len=events.length; i<len; i++) {
          var event = events[i];
          if (event.allDay) {
            // hack! filter event for time zone problem
            if (event.end<=cStart.date||event.start>=cEnd.date) continue;
          }
          eventCount++;
          
          var location = (event.location && event.location.length > 0) ? '( ' + event.location + ' )' : '';
          var time = (event.allDay) ? w.getResourceString('ALL_DAY_EVENT') : w.getResourceString('TIME_FROM_TO',[app.getTimeString(event.start),app.getTimeString(event.end)]);
          var color = event.color;
          var remain = (now < event.start) ? app.getRemainTimeString(event.start) : '';
          var tooltip = [event.title,time,remain,location].join(' ');
          
          var $li = $('<li/>').css({'background-color':color});
          $li.addClass((i%2 === 0) ? 'even' : 'odd');
          if (i === 0) {
            $li.addClass('first');
          }
          if (i == len-1) {
            $li.addClass('last');
          }
          if (offset === 0) { // Today
            if (!event.allDay) {
              //w.print("now = " + now);
              //w.print("event.start = " + event.start);
              //w.print("event.end = " + event.end)
              if (now > event.end) { // finished event
                if (!showPast) continue;
                $li.addClass('past');
              } else if (now >= event.start && now <= event.end) { // current event
                $li.addClass('current');
                isAppendedNow = true;
              } else {
                if (event.start - now < 30 * 60 * 1000) { // before 30 minutes to event.start
                  $li.addClass('just_before');
                } else {
                  $li.addClass('before');
                }
                if (-1 == nextEventIndex) { // check Just Before Event?
                  nextEventIndex = i;
                }
              }
              displayEventWithoutAllDayCount++;
              if (!isAppendedNow && now < event.start) {
                $list.append($nowListItem);
                isAppendedNow = true;
              }
            }
          } else if (offset < 0) { // past
            $li.addClass('past');
          }
          
          $li.append($('<a/>').attr({href:event.link,target:'_blank'}).addClass('event_title').html(event.title));
          $li.append($('<span/>').addClass((event.allDay) ? 'event_allday' : 'event_fromto').html(time));
          if (location != '') $li.append($('<span/>').addClass('event_location').html(location));
          if (nextEventIndex==i) $li.append($('<span/>').addClass('event_timer').html(remain));
          $list.append($li.attr({title:tooltip}));
          displayEventCount++;
        }
        if (offset === 0 && !isAppendedNow && displayEventWithoutAllDayCount >0) { // Today
          $list.append($nowListItem);
        }
        $cal.append($list);
      }
      if (cache.loading) {
        $cal._msg(w.getResourceString('LOADING_EVENT'),true);
      } else if (eventCount === 0) {
        $cal._msg(w.getResourceString('NOTHING_EVENT'));
      } else if (displayEventCount === 0) {
        $cal._msg(w.getResourceString('NOTHING_DISPLAY_EVENT'));
      }
      //$('li.just_before',$list).effect("highlight",{},1000);
    }
  }
  update();
})(jQuery);