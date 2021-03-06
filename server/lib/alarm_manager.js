// Generated by CoffeeScript 1.6.3
var AlarmManager, CozyAdapter, time,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

time = require('time');

CozyAdapter = require('jugglingdb-cozy-adapter');

module.exports = AlarmManager = (function() {
  AlarmManager.prototype.timeouts = {};

  function AlarmManager(timezone, Alarm, notificationhelper) {
    var _this = this;
    this.timezone = timezone;
    this.Alarm = Alarm;
    this.notificationhelper = notificationhelper;
    this.handleAlarm = __bind(this.handleAlarm, this);
    this.Alarm.all(function(err, alarms) {
      var alarm, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = alarms.length; _i < _len; _i++) {
        alarm = alarms[_i];
        _results.push(_this.addAlarmCounter(alarm));
      }
      return _results;
    });
  }

  AlarmManager.prototype.handleAlarm = function(event, msg) {
    var _this = this;
    if (event === "alarm.create") {
      return this.Alarm.find(msg, function(err, alarm) {
        return _this.addAlarmCounter(alarm);
      });
    } else if (event === "alarm.update") {
      return this.Alarm.find(msg, function(err, alarm) {
        return _this.updateAlarmCounter(alarm);
      });
    } else if (event === "alarm.delete") {
      return this.removeAlarmCounter(msg);
    }
  };

  AlarmManager.prototype.addAlarmCounter = function(alarm) {
    var delta, now, triggerDate,
      _this = this;
    triggerDate = new time.Date(alarm.trigg);
    triggerDate.setTimezone(this.timezone);
    now = new time.Date();
    now.setTimezone(this.timezone);
    delta = triggerDate.getTime() - now.getTime();
    if (delta > 0) {
      console.info("Notification in " + (delta / 1000) + " seconds.");
      return this.timeouts[alarm._id] = setTimeout((function() {
        var data, resource;
        if (alarm.action === "DISPLAY") {
          resource = alarm.related != null ? alarm.related : {
            app: 'agenda',
            url: "/"
          };
          return _this.notificationhelper.createTemporary({
            text: "Reminder: " + alarm.description,
            resource: resource
          });
        } else {
          data = {
            from: "Cozy Agenda <no-reply@cozycloud.cc>",
            subject: "[Cozy-Agenda] Reminder",
            content: "Reminder: " + alarm.description
          };
          return CozyAdapter.sendMailToUser(data, function(error, response) {
            if (error != null) {
              return console.info(error);
            }
          });
        }
      }), delta);
    }
  };

  AlarmManager.prototype.removeAlarmCounter = function(id) {
    if (this.timeouts[id] != null) {
      clearTimeout(this.timeouts[id]);
      return delete this.timeouts[id];
    }
  };

  AlarmManager.prototype.updateAlarmCounter = function(alarm) {
    if (this.timeouts[alarm._id] != null) {
      clearTimeout(this.timeouts[alarm._id]);
    }
    return this.addAlarmCounter(alarm);
  };

  return AlarmManager;

})();
