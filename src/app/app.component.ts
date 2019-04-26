import { Component } from '@angular/core';
import { Config, DateLimit, Locale } from 'src/lib/daterange-picker/core/types';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public name = 'Daterange Picker Demo';
  public setDateLimit: boolean;
  public setRanges: boolean;
  public localeEnabled: boolean = true;

  public dateLimit: DateLimit = {
    amount: 2,
    unitOfTime: 'years'
  };
  public ranges = {
    "Today": [
      moment().startOf('day'),
      moment().endOf('day')
    ],
    "Yesterday": [
      moment().subtract(1, 'days'),
      moment().subtract(1, 'days').endOf('day')
    ],
    "Last 7 Days": [
      moment().subtract(7, 'days'),
      moment().endOf('day')
    ],
    "Last 30 Days": [
      moment().subtract(30, 'days'),
      moment().endOf('day')
    ],
    "This Month": [
      moment().startOf('month'),
      moment().endOf('month').endOf('day')
    ],
    "Last Month": [
      moment().subtract(1, 'months').startOf('month'),
      moment().subtract(1, 'months').endOf('month').endOf('day')
    ]
  };

  public config = {
    dateRange: {
      startDate: moment().subtract(1, 'weeks').startOf('day'),
      endDate: moment().add(1, 'weeks').startOf('day'),
      minDate: moment().subtract(2, 'years').startOf('day'),
      maxDate: moment().add(2, 'years').startOf('day'),
    },
    options: {
      showDropdowns: false,
      showISOWeekNumbers: false,
      showWeekNumbers: false,
      rangesEnabled: true,
      linkedCalendars: false,
      alwaysShowCalendars: false
    },
    timePicker: {   
      show: true,
      timePicker24Hour: false,
      timePickerIncrement: 1,
      timePickerSeconds: true,
    },
    locale: {
      format: '',
      direction: 'ltr',
      separator: '',
      weekLabel: '',
      customRangeLabel: '',
      daysOfWeek: moment.weekdaysMin(),
      monthNames: moment.monthsShort(),
      firstDay: moment.localeData().firstDayOfWeek(),
    },
    dateLimit: null
  };

  public config$ = new BehaviorSubject(this.config);

  public setDate(key, value) {
    this.config.dateRange[key] = moment(value)
  }

  buildConfig() {
    let format = '';
    if (this.config.timePicker.show) {
      if (this.config.timePicker.timePickerSeconds) {
        format = 'MM/DD/YYYY HH:mm:ss';
      } else {
        format = 'MM/DD/YYYY HH:mm';
      }
    } else {
      format = moment.localeData().longDateFormat('L');
    }
    // update day names order to firstDay
    let daysOfWeek;
    if (this.config.locale.firstDay !== 0) {
      let iterator = this.config.locale.firstDay;
      while (iterator > 0) {
        daysOfWeek.push(this.config.locale.daysOfWeek.shift());
        iterator--;
      }
    } else {
      daysOfWeek = this.config.locale.daysOfWeek;
    }
    const config = {
      ...this.config,
      dateLimit: this.setDateLimit ? this.dateLimit : null,
      ranges: this.setRanges ? this.ranges : null,
      locale: this.localeEnabled ? {
        ...this.config.locale,
        format,
        daysOfWeek
      } : null
    };

    this.config$.next(config);
  }

  constructor() {
    this.buildConfig();
  }
}