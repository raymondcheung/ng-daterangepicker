import { Input, Inject, Injectable, Output, Component, EventEmitter, OnInit, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import * as _ from 'lodash';
import { DOCUMENT } from '@angular/common';
import { Subject, BehaviorSubject } from 'rxjs';
import * as moment_ from 'moment';
import { Moment } from 'moment';
import { Config, Locale, DefaultLocale, Calendar } from './core/types';

const moment = moment_;

export interface Side {
  timeSelected: Moment;
  calendar: Calendar;
  AMDisabledClass: string;
  PMDisabledClass: string;
  inMinYear?: boolean;
  inMaxYear?: boolean;
  selectedMonth?: string;
  selectedYear?: string;
}

export interface Selected {
  startDate?: Moment;
  endDate?: Moment;
}

@Component({
  selector: 'dp-daterange-picker',
  templateUrl: './daterange-picker.component.html',
  styleUrls: ['./daterange-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

@Injectable()
export class DaterangePickerComponent implements OnInit {
  public keys = Object.keys;
  public selected: Selected = {};

  public show() {
    this.isShowing$.next(true);
  }

  public hide() {
    if (!this.config.options.alwaysShowCalendars) {
      this.isShowing$.next(false);
    }
  }
  isShowing$ = new BehaviorSubject(false);
  @HostListener('document:click', ['$event'])
  public _documentClick(_e: MouseEvent) {
    // TODO:
    // This does not seem like the Angular way to figure out
    // if the click was on the daterange picker, but I couldn't
    // figure out a way to have the daterange picker listen for
    // all clicks in the window to determine if it was clicked on.
    let clickedOnDaterangePicker = false;
    if (this.eRef.nativeElement.contains(event.target)) {
      clickedOnDaterangePicker = true;
    }
    setTimeout(() => {
      if (clickedOnDaterangePicker) {
        this.show();
      } else {
        this.hide();
      }
    }, 0);
  }

  @Input()
  config: Config;

  @Input()
  inputId: string;

  @Input()
  reload: Subject<any>;

  @Input()
  inputChanged: Subject<any>;

  @Output()
  changed: EventEmitter<any> = new EventEmitter();

  @Output()
  showCalendar: EventEmitter<any> = new EventEmitter();

  public leftInputHasFocus: boolean;
  public rightInputHasFocus: boolean;

  public left: Side;
  public right: Side;
  public isInvalidDate: (x: Moment) => boolean;
  public isCustomDate: (x: Moment) => boolean;
  public ranges: {} = {};

  public hourRightValue = '12';
  public minuteRightValue = '0';
  public secondRightValue = '0';
  public ampmRightValue = 'AM';
  public hourLeftValue = '12';
  public minuteLeftValue = '0';
  public secondLeftValue = '0';
  public ampmLeftValue = 'AM';

  public activeRange: string;
  public arrow: {};

  public hourRange: number[];
  public outputHourDisabled: (i: number, side: string) => boolean;
  public minuteRange: number[];
  public outputMinuteDisabled: (i: number, side: string) => boolean;
  public secondRange: number[];
  public outputSecondDisabled: (i: number, side: string) => boolean;
  public outputAMPMDisabled: (i: string, side: string) => boolean;

  public locale: Locale;
  public daterangepickerStart: string;
  public daterangepickerEnd: string;
  public daterangeInputValue: string;
  public chosenLabel: string;

  constructor(@Inject(DOCUMENT) private document: any, private eRef: ElementRef) {}

  ngOnInit() {
    this.locale = !!this.config.locale ? this.config.locale : new DefaultLocale();

    const dr = this.config.dateRange;
    this.left = {
      timeSelected: null,
      calendar: {},
      AMDisabledClass: '',
      PMDisabledClass: ''
    };
    this.right = {
      timeSelected: null,
      calendar: {},
      AMDisabledClass: '',
      PMDisabledClass: ''
    };

    // default settings for options
    this.selected.startDate = (dr.startDate !== undefined) ? dr.startDate : moment().startOf('day');
    this.selected.endDate = (dr.endDate !== undefined) ? dr.endDate : moment().endOf('day');

    // some state information
    this.isShowing$.next(false);
    this.left.calendar = {};
    this.right.calendar = {};

    // sanity check for bad options
    if (dr.minDate && this.selected.startDate.isBefore(dr.minDate))
      this.selected.startDate = dr.minDate.clone();

    // sanity check for bad options
    if (dr.maxDate && this.selected.endDate.isAfter(dr.maxDate))
      this.selected.endDate = dr.maxDate.clone();

    this.ranges = {};
    if (this.config.ranges) {
      let start: Moment,
          end: Moment;
      for (let range in this.config.ranges) {
        if (typeof this.config.ranges[range][0] === 'string')
          start = moment(this.config.ranges[range][0], this.locale.format);
        else
          start = moment(this.config.ranges[range][0]);

        if (typeof this.config.ranges[range][1] === 'string')
          end = moment(this.config.ranges[range][1], this.locale.format);
        else
          end = moment(this.config.ranges[range][1]);

        // If the start or end date exceed those allowed by the minDate or dateLimit
        // options, shorten the range to the allowable period.
        if (dr.minDate && start.isBefore(dr.minDate))
          start = dr.minDate.clone();

        let maxDate = dr.maxDate;
        const dl = this.config.dateLimit;
        if (this.config.dateLimit && maxDate && start.clone().add(dl.amount, dl.unitOfTime).isAfter(maxDate))
          maxDate = start.clone().add(dl.amount, dl.unitOfTime);
        if (maxDate && end.isAfter(maxDate))
          end = maxDate.clone();

        // If the end of the range is before the minimum or the start of the range is
        // after the maximum, don't display this range option at all.
        if ((dr.minDate && end.isBefore(dr.minDate, this.config.timePicker.show ? 'minute' : 'day')) 
          || (maxDate && start.isAfter(maxDate, this.config.timePicker.show ? 'minute' : 'day')))
          continue;

        //Support unicode chars in the range names.
        let elem = document.createElement('textarea');
        elem.innerHTML = range;
        let rangeHtml = elem.value;

        this.ranges[rangeHtml] = [start, end];
      }
    }

    if (!this.config.timePicker.show) {
      this.selected.startDate = this.selected.startDate.startOf('day');
      this.selected.endDate = this.selected.endDate.endOf('day');
    }

    if (this.config.options.alwaysShowCalendars) {
      this.show();
    }

    if (this.reload) {
      this.reload.subscribe(() => {
        this.ngOnInit();
      });
    }

    if (this.inputChanged) {
      this.inputChanged.subscribe(this.initFormInputs);
    }

    this.updateView();
  }

  setStartDate(startDate: string|{}) {
    const selected = this.selected,
          dr = this.config.dateRange,
          showTime = this.config.timePicker.show,
          timePickerIncrement = this.config.timePicker.timePickerIncrement;
    if (typeof startDate === 'string')
      selected.startDate = moment(startDate, this.locale.format);
    if (typeof startDate === 'object')
      selected.startDate = moment(startDate);

    if (!showTime)
      selected.startDate = this.selected.startDate.startOf('day');

    if (showTime && timePickerIncrement)
      selected.startDate.minute(Math.round(this.selected.startDate.minute() / timePickerIncrement) * timePickerIncrement);

    if (dr.minDate && this.selected.startDate.isBefore(dr.minDate)) {
      selected.startDate = dr.minDate.clone();
      if (showTime && timePickerIncrement)
        selected.startDate.minute(Math.round(this.selected.startDate.minute() / timePickerIncrement) * timePickerIncrement);
    }

    if (dr.maxDate && this.selected.startDate.isAfter(dr.maxDate)) {
      selected.startDate = dr.maxDate.clone();
      if (showTime && timePickerIncrement)
        selected.startDate.minute(Math.floor(this.selected.startDate.minute() / timePickerIncrement) * timePickerIncrement);
    }

    if (!this.isShowing$.value) this.updateElement();

    this.updateMonthsInView();
  }


  setEndDate(endDate: string | {}) {
    const selected = this.selected,
          dr = this.config.dateRange,
          dl = this.config.dateLimit,
          showTime = this.config.timePicker.show,
          timePickerIncrement = this.config.timePicker.timePickerIncrement;
    if (typeof endDate === 'string')
      selected.endDate = moment(endDate, this.locale.format);

    if (typeof endDate === 'object')
      selected.endDate = moment(endDate);

    if (!this.config.timePicker.show)
      selected.endDate = selected.endDate.endOf('day');

    if (showTime&& timePickerIncrement)
      selected.endDate.minute(Math.round(selected.endDate.minute() / timePickerIncrement) * timePickerIncrement);

    if (selected.endDate.isBefore(this.selected.startDate))
      selected.endDate = this.selected.startDate.clone();

    if (dr.maxDate && selected.endDate.isAfter(dr.maxDate))
      selected.endDate = dr.maxDate.clone();

    if (this.config.dateLimit && this.selected.startDate.clone().add(dl.amount, dl.unitOfTime).isBefore(selected.endDate))
      selected.endDate = this.selected.startDate.clone().add(dl.amount, dl.unitOfTime);

    if (!this.isShowing$.value)
      this.updateElement();

    this.updateMonthsInView();
  }

  updateView() {
    if (this.config.timePicker.show) {
      this.renderTimePicker('left');
      this.renderTimePicker('right');
      if (!this.config.dateRange.endDate) {
        this.right.calendar.disabled = true;
      } else {
        this.right.calendar.disabled = false;
      }
    }
    this.updateMonthsInView();
    this.updateCalendars();
    this.initFormInputs();
  }

  updateMonthsInView() {
    const dr = this.config.dateRange,
          linkedCalendars = this.config.options.linkedCalendars;
    if (this.selected.endDate) {
      // if both dates are visible already, do nothing
      if (this.left.calendar.month && this.right.calendar.month &&
        (this.selected.startDate.format('YYYY-MM') === this.left.calendar.month.format('YYYY-MM') ||
          this.selected.startDate.format('YYYY-MM') === this.right.calendar.month.format('YYYY-MM')) &&
        (this.selected.endDate.format('YYYY-MM') === this.left.calendar.month.format('YYYY-MM') ||
          this.selected.endDate.format('YYYY-MM') === this.right.calendar.month.format('YYYY-MM'))
        ) {
        return;
      }

      this.left.calendar.month = this.selected.startDate.clone().date(2);
      if (!linkedCalendars && (this.selected.endDate.month() != this.selected.startDate.month() || this.selected.endDate.year() !== this.selected.startDate.year())) {
        this.right.calendar.month = this.selected.endDate.clone().date(2);
      } else {
        this.right.calendar.month = this.selected.startDate.clone().date(2).add(1, 'month');
      }

    } else {
      if (this.left.calendar.month.format('YYYY-MM') !== this.selected.startDate.format('YYYY-MM') &&
            this.right.calendar.month.format('YYYY-MM') !== this.selected.startDate.format('YYYY-MM')) {
        this.left.calendar.month = this.selected.startDate.clone().date(2);
        this.right.calendar.month = this.selected.startDate.clone().date(2).add(1, 'month');
      }
    }
    if (dr.maxDate && linkedCalendars && this.right.calendar.month > dr.maxDate) {
      this.right.calendar.month = dr.maxDate.clone().date(2);
      this.left.calendar.month = dr.maxDate.clone().date(2).subtract(1, 'month');
    }
  }

  updateCalendars() {
    if (this.config.timePicker.show) {
      let hour, minute, second;
      const timePickerSeconds = this.config.timePicker.timePickerSeconds,
            timePicker24Hour = this.config.timePicker.timePicker24Hour,
            start = timePicker24Hour ? 0 : 1,
            end = timePicker24Hour ? 23 : 12;

      if (this.config.dateRange.endDate) {
        hour = parseInt(this.hourLeftValue, 10);
        minute = parseInt(this.minuteLeftValue, 10);
        second = timePickerSeconds ? parseInt(this.secondLeftValue, 10) : 0;
        if (!timePicker24Hour) {
          const ampm = this.ampmLeftValue;
          if (ampm === 'PM' && hour < 12)
            hour += 12;
          if (ampm === 'AM' && hour === 12)
            hour = 0;
        }
      } else {
        hour = parseInt(this.hourRightValue, 10);
        minute = parseInt(this.minuteRightValue, 10);
        second = timePickerSeconds ? parseInt(this.secondRightValue, 10) : 0;
        if (!timePicker24Hour) {
          const ampm = this.ampmRightValue;
          if (ampm === 'PM' && hour < 12)
            hour += 12;
          if (ampm === 'AM' && hour === 12)
            hour = 0;
        }
      }
      this.left.calendar.month.hour(hour).minute(minute).second(second);
      this.right.calendar.month.hour(hour).minute(minute).second(second);
    }

    this.renderCalendar();

    // highlight any predefined range matching the current start and end dates
    for (let x in this.ranges) {
      this.ranges[x].active = false;
    }
    this.activeRange = null;
    if (this.config.dateRange.endDate == null) return;
  }

  public isPreviousButtonHidden(side) {
    if (side === 'right') {
      if (this.config.options.linkedCalendars) return true;
      if (this.right.calendar.firstDay.isBefore(this.left.calendar.lastDay.add(1, 'days'))) return true;
    } else if (side === 'left') {
      if (this.config.dateRange.minDate.isAfter(this.left.calendar.firstDay)) return true;
    }
    return false;
  }

  public isNextButtonHidden(side) {
    if (side === 'right') {
      if (this.config.dateRange.maxDate.isBefore(this.right.calendar.lastDay)) return true;
    } else if (side === 'left') {
      if (this.config.options.linkedCalendars) return true;
      if (!this.left.calendar.lastDay.add(1, 'days').isBefore(this.right.calendar.firstDay)) return true;
    }
    return false;
  }

  getArrayWithNumberOfElements(x: number) {
    return Array(x);
  }

  getArrayWithNumbersBetween(start: number, end: number) {
    const arr = [];
    for (let i = start + 1; i < end; i++) {
      arr.push(i);
    }
    return arr;
  }

  getClassesForDay(row: number, col: number, side: string) {
    const dr = this.config.dateRange;
    if (this[side] === undefined) return '';
    const calendar = this[side].calendar,
          classes = [];

    // highlight today's date
    if (calendar[row][col].date.isSame(new Date(), 'day'))
      classes.push('today');

    // highlight weekends
    if (calendar[row][col].date.isoWeekday() > 5)
      classes.push('weekend');

    // grey out the dates in other months displayed at beginning and end of this calendar
    if (calendar[row][col].date.month() !== calendar[1][1].date.month())
      classes.push('off');

    // don't allow selection of dates before the minimum date
    if (dr.minDate && calendar[row][col].date.isBefore(dr.minDate, 'day'))
      classes.push('off', 'disabled');

    // don't allow selection of dates after the maximum date
    if (dr.maxDate && calendar[row][col].date.isAfter(dr.maxDate, 'day'))
      classes.push('off', 'disabled');

    // don't allow selection of date if a custom function decides it's invalid
    if (this.config.isInvalidDate && this.config.isInvalidDate(calendar[row][col].date))
      classes.push('off', 'disabled');

    // highlight the currently selected start date
    if (calendar[row][col].date.format('YYYY-MM-DD') === this.selected.startDate.format('YYYY-MM-DD'))
      classes.push('active', 'start-date');

    // highlight the currently selected end date
    if (this.selected.endDate != null && calendar[row][col].date.format('YYYY-MM-DD') === this.selected.endDate.format('YYYY-MM-DD'))
      classes.push('active', 'end-date');

    // highlight dates in-between the selected dates
    if (this.selected.endDate != null && calendar[row][col].date > this.selected.startDate && calendar[row][col].date < this.selected.endDate)
      classes.push('in-range');

    // apply custom classes for this date
    const isCustom = this.config.isCustomDate && this.config.isCustomDate(calendar[row][col].date);
    if (isCustom !== false) {
      if (typeof isCustom === 'string')
        classes.push(isCustom);
      else
        Array.prototype.push.apply(classes, isCustom);
    }

    let cname = '', disabled = false;
    for (const cls of classes) {
      cname += cls + ' ';
      if (cls === 'disabled')
          disabled = true;
    }
    if (!disabled) {
      cname += 'available';
      this[side].calendar[row][col].available = true;
    } else {
      this[side].calendar[row][col].available = false;
    }
    return cname;
  }


  renderCalendar() {
    // Build the matrix of dates that will populate the calendar
    const dr = this.config.dateRange;
    // Data needed for left calendar
    const sides = ['left', 'right'];
    let curDate;

    for (const side of sides) {
      const month = this[side].calendar.month.month(),
            year = this[side].calendar.month.year(),
            hour = this[side].calendar.month.hour(),
            minute = this[side].calendar.month.minute(),
            second = this[side].calendar.month.second();
      this[side].selectedYear = year + '';
      this[side].selectedMonth = month + '';
      this[side].inMinYear = year === this.config.dateRange.minDate.year();
      this[side].inMaxYear = year === this.config.dateRange.maxDate.year();
      this[side].daysInMonth = moment([this[side].calendar.month.year(), this[side].calendar.month.month()]).daysInMonth();
      this[side].firstDay = moment([this[side].calendar.month.year(), this[side].calendar.month.month(), 1]);
      this[side].lastDay = moment([this[side].calendar.month.year(), this[side].calendar.month.month(), this[side].daysInMonth]);
      this[side].lastMonth = moment(this[side].firstDay).subtract(1, 'month').month();
      this[side].lastYear = moment(this[side].firstDay).subtract(1, 'month').year();
      this[side].daysInLastMonth = moment([this[side].lastYear, this[side].lastMonth]).daysInMonth();
      this[side].dayOfWeek = this[side].firstDay.day();
      this[side].calendar.firstDay = this[side].firstDay;
      this[side].calendar.lastDay = this[side].lastDay;
      for (let i = 0; i < 6; i++) {
          this[side].calendar[i] = [];
      }
      this[side].startDay = this[side].daysInLastMonth - this[side].dayOfWeek + this.locale.firstDay + 1;
      if (this[side].startDay > this[side].daysInLastMonth)
        this[side].startDay -= 7;
      if (this[side].dayOfWeek === this.locale.firstDay)
        this[side].startDay = this[side].daysInLastMonth - 6;

      curDate = moment([this[side].lastYear, this[side].lastMonth, this[side].startDay, 12, minute, second]);
      for (let i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = moment(curDate).add(24, 'hour')) {
        if (i > 0 && col % 7 === 0) {
          col = 0;
          row++;
        }
        this[side].calendar[row][col] = {};
        this[side].calendar[row][col].inRange = '';
        this[side].calendar[row][col].date = curDate.clone().hour(hour).minute(minute).second(second);
        curDate.hour(12);

        if (dr.minDate && this[side].calendar[row][col].date.format('YYYY-MM-DD') ===
              dr.minDate.format('YYYY-MM-DD') && this[side].calendar[row][col].date.isBefore(dr.minDate) && side === 'left') {
          this[side].calendar[row][col].date = dr.minDate.clone();
        }

        if (dr.maxDate && this[side].calendar[row][col].date.format('YYYY-MM-DD') ===
              dr.maxDate.format('YYYY-MM-DD') && this[side].calendar[row][col].date.isAfter(dr.maxDate) && side === 'right') {
          this[side].calendar[row][col].date = dr.maxDate.clone();
        }
      }
      this[side].minDate = side === 'left' ? dr.minDate : this.selected.startDate;
      dr.maxDate = dr.maxDate;
      this.arrow = this.locale.direction === 'ltr' ?
                    {left: 'chevron-left', right: 'chevron-right'} : {left: 'chevron-right', right: 'chevron-left'};
      if (this.selected.endDate == null && this.config.dateLimit) {
        const dl = this.config.dateLimit,
              maxLimit = this.selected.startDate.clone().add(dl.amount, dl.unitOfTime).endOf('day');
        if (!dr.maxDate || maxLimit.isBefore(dr.maxDate)) {
            dr.maxDate = maxLimit;
        }
      }
    }
  }

  renderTimePicker(side: string) {
    const dr = this.config.dateRange,
          dl = this.config.dateLimit;
    // Don't bother updating the time picker if it's currently disabled
    // because an end date hasn't been clicked yet
    if (side === 'right' && !this.selected.endDate) return;

    let minDate: Moment,
        maxDate = dr.maxDate;

    if (this.config.dateLimit && (!dr.maxDate || this.selected.startDate.clone().add(dl.amount, dl.unitOfTime).isAfter(dr.maxDate)))
      maxDate = this.selected.startDate.clone().add(dl.amount, dl.unitOfTime);
    if (side === 'left') {
      this[side].timeSelected = this.selected.startDate.clone();
      minDate = dr.minDate;
    } else if (side === 'right') {
      this[side].timeSelected = this.selected.endDate.clone();
      minDate = this.selected.startDate;
      // Preserve the time already selected
      if (!this.selected.endDate) {
        let x = false;
        if (this.hourRightValue) {
          x = true;
          this[side].timeSelected.hour(parseInt(this.hourRightValue, 10));
        }
        if (this.minuteRightValue) {
          x = true;
          this[side].timeSelected.minute(parseInt(this.minuteRightValue, 10));
        }
        if (this.secondRightValue) {
          x = true;
          this[side].timeSelected.second(parseInt(this.secondRightValue, 10));
        }
        if (x) {
          const ampm = this.ampmRightValue;
          if (ampm === 'PM' && this[side].timeSelected.hour() < 12)
            this[side].timeSelected.hour(this[side].timeSelected.hour() + 12);
          if (ampm === 'AM' && this[side].timeSelected.hour() === 12)
            this[side].timeSelected.hour(0);
        }
      }
      if (this[side].timeSelected.isBefore(this.selected.startDate))
        this[side].timeSelected = this.selected.startDate.clone();
      if (maxDate && this[side].timeSelected.isAfter(maxDate))
        this[side].timeSelected = maxDate.clone();
    }

    this.hourRange = ((timePicker24Hour: boolean) => {
      const hourStart = timePicker24Hour ? 0 : 1,
            hourEnd = timePicker24Hour ? 23 : 12,
            range = [];
      for (let i = hourStart; i <= hourEnd; i++) {
        range.push(i);
      }
      return range;
    })(this.config.timePicker.timePicker24Hour);


    this.outputHourDisabled = function(i: number, side: string) {
      let i_in_24 = i;
      if (!this.timePicker24Hour)
        i_in_24 = this[side].timeSelected.hour() >= 12 ? (i === 12 ? 12 : i + 12) : (i === 12 ? 0 : i);
      const time = this[side].timeSelected.clone().hour(i_in_24);
      if (minDate && time.minute(59).isBefore(minDate))
        return true;
      if (maxDate && time.minute(0).isAfter(maxDate))
        return true;
      return false;
    };

    this.minuteRange = ((timePickerIncrement: number) => {
      let padded;
      const range = [];
      for (let i = 0; i < 60; i += timePickerIncrement) {
        padded = i < 10 ? Number('0' + i) : i;
        range.push(padded);
      }
      return range;
    })(this.config.timePicker.timePickerIncrement);

    this.outputMinuteDisabled = function(m: number, side: string) {
      const time = this[side].timeSelected.clone().minute(m);
      if (minDate && time.second(59).isBefore(minDate))
        return true;
      if (maxDate && time.second(0).isAfter(maxDate))
        return true;
      return false;
    };

    this.secondRange = this.minuteRange;

    this.outputSecondDisabled = function(s: number, side: string) {
      const time = this[side].timeSelected.clone().second(s);
      if (minDate && time.isBefore(minDate))
        return true;
      if (maxDate && time.isAfter(maxDate))
        return true;
      return false;
    };

    this.outputAMPMDisabled = function(i: string, side: string) {
      if (i === 'am' && minDate && this[side].timeSelected.clone().hour(12).minute(0).second(0).isBefore(minDate)) {
        return true;
      } else if (i === 'pm' && maxDate && this[side].timeSelected.clone().hour(0).minute(0).second(0).isAfter(maxDate)) {
        return true;
      }
      return false;
    };


    if (minDate && this[side].timeSelected.clone().hour(12).minute(0).second(0).isBefore(minDate)) {
        this[side].AMDisabledClass = 'disabled';
    }
    if (maxDate && this[side].timeSelected.clone().hour(0).minute(0).second(0).isAfter(maxDate)) {
        this[side].PMDisabledClass = 'disabled';
    }
  }

  initFormInputs() {
    const dr = this.config.dateRange;
    this.daterangepickerStart = this.selected.startDate ? this.selected.startDate.format(this.locale.format) : null;
    this.daterangepickerEnd = this.selected.endDate ? this.selected.endDate.format(this.locale.format) : null;
    this.daterangeInputValue = this.daterangepickerStart + ' - ' + (this.daterangepickerEnd !== null ? this.daterangepickerEnd : '');
  }

  hoverDate(row: number, col: number, side: string) {
    const dr = this.config.dateRange,
          date = this[side].calendar[row][col].date;

    // We update the start/end inputs to match what the date being hovered on
    if (this.selected.endDate && this.leftInputHasFocus) {
      this.daterangepickerStart = date.format(this.locale.format);
    } else if (!this.selected.endDate && !this.rightInputHasFocus) {
      this.daterangepickerEnd = date.format(this.locale.format);
    }

    // Whenever a start date is hovered over, we check all days displayed and make days that
    // come after marked as in range.
    let day;
    if (!this.selected.endDate) {
      for (const r in this[side].calendar) {
        if (Number.isNaN(Number(r))) continue;
        for (const c in this[side].calendar[r]) {
          if (Number.isNaN(Number(c))) continue;
          day = this[side].calendar[r][c].date;
          if (day.isAfter(this.selected.startDate) && day.isBefore(date) || day.isSame(date, 'day')) {
            this[side].calendar[r][c].inRange = 'in-range';
          } else {
            this[side].calendar[r][c].inRange = '';
          }
        }
      }
    }
  }

  updateDateWithTimepicker(side: string) {
    // Update the start and end date values to whatever time is shown
    // in the time picker
    let date;
    let hour: number,
        minute: number,
        second: number,
        ampm: string;

    if (side === 'left') {
        date = this.config.dateRange.startDate;
        hour = parseInt(this.hourLeftValue, 10);
        minute = parseInt(this.minuteLeftValue, 10);
        second = parseInt(this.secondLeftValue, 10);
        ampm = this.ampmLeftValue;
    } else if (side === 'right') {
        date = this.config.dateRange.endDate;
        hour = parseInt(this.hourRightValue, 10);
        minute = parseInt(this.minuteRightValue, 10);
        second = parseInt(this.secondRightValue, 10);
        ampm = this.ampmRightValue;
    }
    if (!this.config.timePicker.timePicker24Hour) {
        if (side === 'left') {
            ampm = this.ampmLeftValue;
        } else {
            ampm = this.ampmRightValue;
        }
        if (ampm === 'PM' && hour < 12)
            hour += 12;
        if (ampm === 'AM' && hour === 12)
            hour = 0;
    }
    date = date.clone().hour(hour).minute(minute);
    if (this.config.timePicker.timePickerSeconds) {
        date.second(second);
    }
    if (side === 'left') {
        this.setStartDate(date.clone());
    } else if (side === 'right') {
        this.setEndDate(date.clone());
    }
    this.updateView();
  }

  clickDate(row: number, col: number, side: string) {
    const dr = this.config.dateRange;
    if (!this[side].calendar[row][col].available) return;

    const date = this[side].calendar[row][col].date;

    //
    // this function needs to do a few things:
    // * alternate between selecting a start and end date for the range,
    // * if the time picker is enabled, apply the hour/minute/second from the select boxes to the clicked date
    // * if autoapply is enabled, and an end date was chosen, apply the selection
    // * if single date picker mode, and time picker isn't enabled, apply the selection immediately
    // * if one of the inputs above the calendars was focused, cancel that manual input
    //

    if (this.selected.endDate || date.isBefore(this.selected.startDate, 'day')) { // picking start
      this.selected.endDate = null;
      this.setStartDate(date.clone());
    } else if (!this.selected.endDate && date.isBefore(this.selected.startDate)) {
      // special case: clicking the same date for start/end,
      // but the time of the end date is before the start date
      this.setEndDate(this.selected.startDate.clone());
    } else {
      this.setEndDate(date.clone());
    }

    this.updateView();
  }

  /**
   * Set the year using dropdown.  If linked calendar option is enabled,
   * then set other calendar side also.
   */
  clickDropdownYear(side: string, _year: string) {
    const year = parseInt(_year, 10);
    if (this.config.options.linkedCalendars) {
      if (side === 'left') {
        this.left.calendar.month.year(year);
        if (this.left.calendar.month.month() === 11) {
          this.right.calendar.month.year(year + 1);
        } else {
          this.right.calendar.month.year(year);
        }
      } else {
        this.right.calendar.month.year(year);
        if (this.right.calendar.month.month() === 0) {
          this.left.calendar.month.year(year-1);
        } else {
          this.left.calendar.month.year(year);
        }
      }
    } else {
      this[side].calendar.month.year(year);
    }
    this.updateCalendars();
  }


  /**
   * Set the month using dropdown.  If linked calendar option is enabled,
   * then set other calendar side also.
   */
  clickDropdownMonth(side: string, month: string) {
    if (this.config.options.linkedCalendars) {
      if (side === 'left') {
        this.left.calendar.month.month(month);
        this.right.calendar.month.month(month).add(1, 'month');
      } else {
        this.right.calendar.month.month(month);
        this.left.calendar.month.month(month).subtract(1, 'month');
      }
    } else {
      this[side].calendar.month.month(month);
    }
    this.updateCalendars();
  }

  clickPrev(side: string) {
    if (this.config.options.linkedCalendars) {
      this.left.calendar.month.subtract(1, 'month');
      this.right.calendar.month.subtract(1, 'month');
    } else {
      this[side].calendar.month.subtract(1, 'month');
    }
    this.updateCalendars();
  }

  clickNext(side: string) {
    if (this.config.options.linkedCalendars) {
      this.left.calendar.month.add(1, 'month');
      this.right.calendar.month.add(1, 'month');
    } else {
      this[side].calendar.month.add(1, 'month');
    }
    this.updateCalendars();
  }

  clickRange(label: string, range: Moment[]) {
    const dr = this.config.dateRange;
    this.chosenLabel = label;
    if (label === this.locale.customRangeLabel) {
      this.show();
    } else {
      this.selected.startDate = range[0];
      this.selected.endDate = range[1];
      if (!this.config.timePicker.show) {
        this.selected.startDate.startOf('day');
        this.selected.endDate.startOf('day');
      }
      this.updateView();
    }
  }

  updateElement() {
    this.daterangeInputValue = this.config.dateRange.startDate.format(this.locale.format) +
      this.locale.separator + this.config.dateRange.endDate.format(this.locale.format);
    this.changed.emit(null);
    this.daterangeInputValue = this.config.dateRange.startDate.format(this.locale.format);
  }
}
