(function($){
  $(document).ready(function() {
    var background = chrome.extension.getBackgroundPage(),
      Blz = background.Blz, 
      w = Blz.Widget, 
      app = background.MyGoogleCal
      ;
    
    // localize
    var messages = {
      'logo':'WINDOW_CAPTION',
      'account':'PREF_GROUP_ACCOUNT',
      'use_google_apps_label':'PREF_GOOGLE_APPS_TITLE',
      'mail_label':'PREF_MAIL_TITLE',
      'password_label':'PREF_PASSWORD_TITLE',
      'appearance':'PREF_GROUP_APPEARANCE',
      'display_day_count_label':'PREF_DAYCOUNT_TITLE',
      'display_day_count_help':'PREF_DAYCOUNT_DESC',
      'use24_hour_time_label':'PREF_24TIME_TITLE',
      'use24_hour_time_help':'PREF_24TIME_DESC',
      'show_past_label':'PREF_SHOWPAST_TITLE',
      'show_past_help':'PREF_SHOWPAST_DESC'
    };    
    $.each(messages,function(key,value){
      $('#' + key).html(w.getResourceString(value));
    });
    
    var $mail = $('#mail'), $password = $('#password');
    if (w.getPref('useGoogleApps')=='1') $('#use_google_apps').attr('checked',true);
    $mail.val(w.getPref('mail'));
    $password.val(w.getPref('password'));
    $('#use_google_apps').change(function(){
      var checked = $(this).attr('checked');
      $mail.attr({'disabled':!checked});
      $password.attr({'disabled':!checked});
    }).change();
    
    var displayDayCount = w.getPref('displayDayCount');
    $('#display_day_count').val(!isNaN(displayDayCount) ? displayDayCount : 2);
    if (w.getPref('use24HourTime')=='1') $('#use24_hour_time').attr('checked',true);
    if (w.getPref('showPast')=='1') $('#show_past').attr('checked',true);
    
    $('#save').html(w.getResourceString('SAVE_BUTTON')).click(function(){
      var useGoogleApps = $('#use_google_apps').attr('checked'),
        mail = $('#mail').val(), 
        pass = $('#password').val();
      var displayDayCount = $('#display_day_count').val(),
        use24HourTime = $('#use24_hour_time').attr('checked'),
        showPast = $('#show_past').attr('checked');
      w.setPref('useGoogleApps',(useGoogleApps) ? 1 : 0);
      w.setPref('mail',mail);
      w.setPref('password',pass);
      if (!isNaN(displayDayCount)) w.setPref('displayDayCount',displayDayCount);
      w.setPref('use24HourTime',(use24HourTime) ? 1 : 0);
      w.setPref('showPast',(showPast) ? 1 : 0);
      if (useGoogleApps) {
        app.gcal.useGoogleLogin = true;
        app.login(mail,pass);
      } else {
        app.gcal.useGoogleLogin = false;
        app.logout();
        app.session();
      }
      background.update();
      window.close();
      return;
    });
    $('#cancel').html(w.getResourceString('CANCEL_BUTTON')).click(function(){
      window.close();
      return;
    });
  });
})(jQuery);