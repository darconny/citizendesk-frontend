'use strict';

// check http://www.cl.cam.ac.uk/~mgk25/iso-time.html for info about
// the standard

angular.module('citizendeskFrontendApp')
  .factory('superdeskDate', function () {
    function padTwo(maybeString) {
      var s = String(maybeString);
      return s.length === 1 ? '0'+s : s;
    }
    return {
      render: function(d) {
        if (d instanceof Date) {
          var year = d.getUTCFullYear(),
              month = padTwo(d.getUTCMonth() + 1),
              day = padTwo(d.getUTCDate()),
              hour = padTwo(d.getUTCHours()),
              minute = padTwo(d.getUTCMinutes()),
              second = padTwo(d.getUTCSeconds());

          var datePart = year + '-' + month + '-' + day,
              timePart = hour + ':' + minute + ':' + second + '+0000';

          return datePart + 'T' + timePart;
        } else {
          var tryToRender = JSON.stringify(d);
          throw Error('superdeskDate parsing '+tryToRender);
        }
      },
      parse: function(s) {
        var split = s.split('T'),
            dateString = split[0],
            rest = split[1];
        var dateSplit = dateString.split('-'),
            restSplit = rest.split('+'),
            timeString = restSplit[0],
            timeSplit = timeString.split(':');
        if (restSplit[1] !== '0000') {
          throw new Error('Date ' + s + ' is probably not in UTC time, or not in the expected format');
        }
        function p(s) {
          return parseInt(s, 10);
        }
        dateSplit = dateSplit.map(p);
        timeSplit = timeSplit.map(p);
        var year = dateSplit[0],
            month = dateSplit[1] - 1, // input starts from 1, output from 0
            day = dateSplit[2],
            hour = timeSplit[0],
            minute = timeSplit[1],
            second = timeSplit[2];

        // i love you Javascript, luckily we have got tests
        var UTC = Date.UTC(year, month, day, hour, minute, second);
        return new Date(UTC);
      }
    };
  });
