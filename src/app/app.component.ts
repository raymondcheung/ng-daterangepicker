import { Component } from '@angular/core';
import { Config, DateLimit, Locale } from 'src/lib/daterange-picker/core/types';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public name = 'Daterange Picker Demo';
  public setDateLimit: boolean;
  public setRanges: boolean;
  public setLocale: boolean;

  public dateLimit: DateLimit = {
    amount: 2,
    unitOfTime: 'years'
  };
  public ranges = {
    "Today": [
      moment("2019-04-12T06:19:34.749Z"),
      moment("2019-04-12T06:19:34.749Z")
    ],
    "Yesterday": [
      moment("2019-04-11T06:19:34.749Z"),
      moment("2019-04-11T06:19:34.750Z")
    ],
    "Last 7 Days": [
      moment("2019-04-06T06:19:34.750Z"),
      moment("2019-04-12T06:19:34.750Z")
    ],
    "Last 30 Days": [
      moment("2019-03-14T06:19:34.750Z"),
      moment("2019-04-12T06:19:34.751Z")
    ],
    "This Month": [
      moment("2019-04-01T07:00:00.000Z"),
      moment("2019-05-01T06:59:59.999Z")
    ],
    "Last Month": [
      moment("2019-03-01T08:00:00.000Z"),
      moment("2019-04-01T06:59:59.999Z")
    ]
  };
  public locale: Locale = {
    format: '',
    direction: 'ltr',
    separator: '',
    weekLabel: '',
    customRangeLabel: '',
    daysOfWeek: moment.weekdaysMin(),
    monthNames: moment.monthsShort(),
    firstDay: moment.localeData().firstDayOfWeek(),
  };

  public config: Config = {
    dateRange: {
      startDate: moment('11/08/2016').startOf('day'),
      endDate: moment('11/25/2016').startOf('day'),
      minDate: moment('09/01/2015'),
      maxDate: moment('09/01/2017'),
    },
    options: {
      singleDatePicker: false,
      showDropdowns: false,
      showISOWeekNumbers: false,
      showWeekNumbers: false,
      rangesEnabled: true,
      linkedCalendars: true,
      alwaysShowCalendar: false
    },
    timePicker: {   
      show: true,
      timePicker24Hour: false,
      timePickerIncrement: 1,
      timePickerSeconds: true,
    },
    dateLimit: null,
    applyClass: null,
    cancelClass: null
  };

  buildConfig() {
    this.config = {
      ...this.config,
      dateLimit: this.setDateLimit ? this.dateLimit : null,
      ranges: this.setRanges ? this.ranges : null,
      locale: this.setLocale ? this.locale : null
    };
  }

  constructor() { }
}