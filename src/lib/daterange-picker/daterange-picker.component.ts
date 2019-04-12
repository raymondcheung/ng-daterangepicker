import { Input, Inject, Injectable, Output, Component, EventEmitter, OnInit, HostListener, OnChanges, ElementRef } from '@angular/core';
import * as _ from 'lodash';
import { DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { Daterange } from './daterange';
import { Config } from './core/types';

@Component({
  selector: 'dp-daterange-picker',
  templateUrl: './daterange-picker.component.html',
  styleUrls: ['./daterange-picker.component.scss']
})

@Injectable()
export class DaterangePickerComponent implements OnInit {
  public keys = Object.keys;

  @HostListener('document:click', ['$event'])
  private _documentClick(e: MouseEvent) {
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
        this.isShowing = true;
      } else {
        this.isShowing = false;
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
  public daterange: Daterange = new Daterange();

  private leftInputHasFocus: boolean;
  public rightInputHasFocus: boolean;

  public locale: any;
  public left: any;
  public right: any;
  public showCustomRangeLabel: boolean;
  public timePicker: boolean;
  public timePicker24Hour: boolean;
  public timePickerIncrement: number;
  public timePickerSeconds: boolean;
  public linkedCalendars: boolean;
  public isShowing: boolean;
  public applyClass: string;
  public cancelClass: string;
  public buttonClasses: string;
  public isInvalidDate: (x: moment.Moment) => boolean;
  public isCustomDate: (x: moment.Moment) => boolean;
  public ranges: {} = {};
  public showCalendarClass: string;

  public hourRightValue: string;
  public minuteRightValue: string;
  public secondRightValue: string;
  public ampmRightValue: string;
  public hourLeftValue: string;
  public minuteLeftValue: string;
  public secondLeftValue: string;
  public ampmLeftValue: string;

  public activeRange: string;
  public selected: moment.Moment;
  public arrow: {};

  public hourRange: number[];
  public outputHourDisabled: (i: number, side: string) => boolean;
  public minuteRange: number[];
  public outputMinuteDisabled: (i: number, side: string) => boolean;
  public secondRange: number[];
  public outputSecondDisabled: (i: number, side: string) => boolean;
  public outputAMPMDisabled: (i: string, side: string) => boolean;

  public daterangepickerStart: string;
  public daterangepickerEnd: string;
  public showCalendarsClass: string;
  public daterangeInputValue: string;
  public chosenLabel: string;

  constructor(@Inject(DOCUMENT) private document: any, private eRef: ElementRef) {}

  makeCalendarVisible() {
    this.isShowing = true;
  }

  getDaterangepickerClasses(): string[] {
    const classes = [];
    if (this.config.options.singleDatePicker || this.config.options.alwaysShowCalendar) {
      classes.push('single');
    } else {
      classes.push('show-calendar');
    }
    return classes;
  }

  ngOnInit() {
    const dr = this.config.dateRange;
    this.left = {};
    this.right = {};

    const [hourLeftValue, minuteLeftValue, secondLeftValue] = [12, 0, 0];
    const [hourRightValue, minuteRightValue, secondRightValue] = [12, 0, 0];

    // default settings for options
    dr.startDate = (dr.startDate !== undefined) ? dr.startDate : moment().startOf('day');
    dr.endDate = (dr.endDate !== undefined) ? dr.endDate : moment().endOf('day');

    this.locale = {};
    this.locale.direction = 'ltr';
    this.locale.separator = '';
    this.locale.weekLabel = '';
    this.locale.customRangeLabel = '';
    this.locale.daysOfWeek = moment.weekdaysMin();
    this.locale.monthNames = moment.monthsShort();
    this.locale.firstDay = moment.localeData().firstDayOfWeek();
    if (this.timePicker) {
      if (this.timePickerSeconds) {
        this.locale.format = 'MM/DD/YYYY HH:mm:ss';
      } else {
        this.locale.format = 'MM/DD/YYYY HH:mm';
      }
    } else {
      this.locale.format = moment.localeData().longDateFormat('L');
    }

    // some state information
    this.isShowing = false;
    this.left.calendar = {};
    this.right.calendar = {};

    // sanity check for bad options
    if (dr.minDate && dr.startDate.isBefore(dr.minDate))
      dr.startDate = dr.minDate.clone();

    // sanity check for bad options
    if (dr.maxDate && dr.endDate.isAfter(dr.maxDate))
      dr.endDate = dr.maxDate.clone();

    // update day names order to firstDay
    if (this.locale.firstDay !== 0) {
      let iterator = this.locale.firstDay;
      while (iterator > 0) {
        this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
        iterator--;
      }
    }

    if (this.config.ranges) {
      let start: moment.Moment,
          end: moment.Moment;
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
        if ((dr.minDate && end.isBefore(dr.minDate, this.timePicker ? 'minute' : 'day')) 
          || (maxDate && start.isAfter(maxDate, this.timePicker ? 'minute' : 'day')))
          continue;

        //Support unicode chars in the range names.
        let elem = document.createElement('textarea');
        elem.innerHTML = range;
        let rangeHtml = elem.value;

        this.ranges[rangeHtml] = [start, end];
      }
    }

    if (!this.timePicker) {
      dr.startDate = dr.startDate.startOf('day');
      dr.endDate = dr.endDate.endOf('day');
    }

    if (this.config.options.singleDatePicker) {
      // TODO:
      // The div.daterangepicker width:auto problem needs to be fixed
      // before singleDatePicker can be worked on because the width
      // needs to be 'auto' to readjust the div.daterangepicker width
      // to be smaller because of only one calendar appearing.

      // this.container.addClass('single');
      // this.container.find('.calendar.left').addClass('single');
      // this.container.find('.calendar.left').show();
      // this.container.find('.calendar.right').hide();
      // this.container.find('.daterangepicker_input input, .daterangepicker_input > i').hide();
      // if (this.timePicker) {
      //     this.container.find('.ranges ul').hide();
      // } else {
      //     this.container.find('.ranges').hide();
      // }
    }

    if ((typeof this.config.ranges === 'undefined' && !this.config.options.singleDatePicker) || this.config.options.alwaysShowCalendar) {
      this.showCalendarClass = 'show-calendar';
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

  // ngOnChanges() {
  //   this.ngOnInit();
  // }

  setStartDate(startDate: string|{}) {
    const dr = this.config.dateRange;
    if (typeof startDate === 'string')
      dr.startDate = moment(startDate, this.locale.format);
    if (typeof startDate === 'object')
      dr.startDate = moment(startDate);

    if (!this.timePicker)
      dr.startDate = dr.startDate.startOf('day');

    if (this.timePicker && this.timePickerIncrement)
      dr.startDate.minute(Math.round(dr.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

    if (dr.minDate && dr.startDate.isBefore(dr.minDate)) {
      dr.startDate = dr.minDate.clone();
      if (this.timePicker && this.timePickerIncrement)
        dr.startDate.minute(Math.round(dr.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
    }

    if (dr.maxDate && dr.startDate.isAfter(dr.maxDate)) {
      dr.startDate = dr.maxDate.clone();
      if (this.timePicker && this.timePickerIncrement)
        dr.startDate.minute(Math.floor(dr.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
    }

    if (!this.isShowing)
      this.updateElement();

    this.updateMonthsInView();
  }


  setEndDate(endDate: string | {}) {
    const dr = this.config.dateRange,
          dl = this.config.dateLimit;
    if (typeof endDate === 'string')
      dr.endDate = moment(endDate, this.locale.format);

    if (typeof endDate === 'object')
      dr.endDate = moment(endDate);

    if (!this.timePicker)
      dr.endDate = dr.endDate.endOf('day');

    if (this.timePicker && this.timePickerIncrement)
      dr.endDate.minute(Math.round(dr.endDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

    if (dr.endDate.isBefore(dr.startDate))
      dr.endDate = dr.startDate.clone();

    if (dr.maxDate && dr.endDate.isAfter(dr.maxDate))
      dr.endDate = dr.maxDate.clone();

    if (this.config.dateLimit && dr.startDate.clone().add(dl.amount, dl.unitOfTime).isBefore(dr.endDate))
      dr.endDate = dr.startDate.clone().add(dl.amount, dl.unitOfTime);

    if (!this.isShowing)
      this.updateElement();

    this.updateMonthsInView();
  }

  updateView() {
    if (this.timePicker) {
      this.renderTimePicker('left');
      this.renderTimePicker('right');
      if (!this.daterange.endDate) {
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
    const dr = this.config.dateRange;
    if (dr.endDate) {
      // if both dates are visible already, do nothing
      if (!this.config.options.singleDatePicker && this.left.calendar.month && this.right.calendar.month &&
        (dr.startDate.format('YYYY-MM') === this.left.calendar.month.format('YYYY-MM') ||
          dr.startDate.format('YYYY-MM') === this.right.calendar.month.format('YYYY-MM')) &&
        (dr.endDate.format('YYYY-MM') === this.left.calendar.month.format('YYYY-MM') ||
          dr.endDate.format('YYYY-MM') === this.right.calendar.month.format('YYYY-MM'))
        ) {
        return;
      }

      this.left.calendar.month = dr.startDate.clone().date(2);
      if (!this.linkedCalendars && (dr.endDate.month() != dr.startDate.month() || dr.endDate.year() !== dr.startDate.year())) {
        this.right.calendar.month = dr.endDate.clone().date(2);
      } else {
        this.right.calendar.month = dr.startDate.clone().date(2).add(1, 'month');
      }

    } else {
      if (this.left.calendar.month.format('YYYY-MM') !== dr.startDate.format('YYYY-MM') &&
            this.right.calendar.month.format('YYYY-MM') !== dr.startDate.format('YYYY-MM')) {
        this.left.calendar.month = dr.startDate.clone().date(2);
        this.right.calendar.month = dr.startDate.clone().date(2).add(1, 'month');
      }
    }
    if (dr.maxDate && this.linkedCalendars && !this.config.options.singleDatePicker && this.right.calendar.month > dr.maxDate) {
      this.right.calendar.month = dr.maxDate.clone().date(2);
      this.left.calendar.month = dr.maxDate.clone().date(2).subtract(1, 'month');
    }
  }

  updateCalendars() {
    if (this.timePicker) {
      let hour, minute, second;
      let start = this.timePicker24Hour ? 0 : 1;
      let end = this.timePicker24Hour ? 23 : 12;

      if (this.daterange.endDate) {
      hour = parseInt(this.hourLeftValue, 10);
      minute = parseInt(this.minuteLeftValue, 10);
      second = this.timePickerSeconds ? parseInt(this.secondLeftValue, 10) : 0;
      if (!this.timePicker24Hour) {
        const ampm = this.ampmLeftValue;
        if (ampm === 'PM' && hour < 12)
          hour += 12;
        if (ampm === 'AM' && hour === 12)
          hour = 0;
      }
      } else {
        hour = parseInt(this.hourRightValue, 10);
        minute = parseInt(this.minuteRightValue, 10);
        second = this.timePickerSeconds ? parseInt(this.secondRightValue, 10) : 0;
        if (!this.timePicker24Hour) {
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
    if (this.daterange.endDate == null) return;
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
    if (calendar[row][col].date.format('YYYY-MM-DD') === dr.startDate.format('YYYY-MM-DD'))
      classes.push('active', 'start-date');

    // highlight the currently selected end date
    if (dr.endDate != null && calendar[row][col].date.format('YYYY-MM-DD') === dr.endDate.format('YYYY-MM-DD'))
      classes.push('active', 'end-date');

    // highlight dates in-between the selected dates
    if (dr.endDate != null && calendar[row][col].date > dr.startDate && calendar[row][col].date < dr.endDate)
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
      this[side].minDate = side === 'left' ? dr.minDate : dr.startDate;
      dr.maxDate = dr.maxDate;
      this.selected = side === 'left' ? dr.startDate : dr.endDate;
      this.arrow = this.locale.direction === 'ltr' ?
                    {left: 'chevron-left', right: 'chevron-right'} : {left: 'chevron-right', right: 'chevron-left'};
      if (dr.endDate == null && this.config.dateLimit) {
        const dl = this.config.dateLimit,
              maxLimit = dr.startDate.clone().add(dl.amount, dl.unitOfTime).endOf('day');
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
    if (side === 'right' && !dr.endDate) return;

    let minDate: moment.Moment,
        maxDate = dr.maxDate;

    if (this.config.dateLimit && (!dr.maxDate || dr.startDate.clone().add(dl.amount, dl.unitOfTime).isAfter(dr.maxDate)))
      maxDate = dr.startDate.clone().add(dl.amount, dl.unitOfTime);
    if (side === 'left') {
      this[side].timeSelected = dr.startDate.clone();
      minDate = dr.minDate;
    } else if (side === 'right') {
      this[side].timeSelected = dr.endDate.clone();
      minDate = dr.startDate;
      // Preserve the time already selected
      if (!dr.endDate) {
        let x = false;
        if (this.hourRightValue) {
          x = true;
          this[side].timeSelected.hour = this.hourRightValue;
        }
        if (this.minuteRightValue) {
          x = true;
          this[side].timeSelected.minute = this.minuteRightValue;
        }
        if (this.secondRightValue) {
          x = true;
          this[side].timeSelected.second = this.secondRightValue;
        }
        if (x) {
          const ampm = this.ampmRightValue;
          if (ampm === 'PM' && this[side].timeSelected.hour() < 12)
            this[side].timeSelected.hour(this[side].timeSelected.hour() + 12);
          if (ampm === 'AM' && this[side].timeSelected.hour() === 12)
            this[side].timeSelected.hour(0);
        }
      }
      if (this[side].timeSelected.isBefore(dr.startDate))
        this[side].timeSelected = dr.startDate.clone();
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
    })(this.timePicker24Hour);


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
    })(this.timePickerIncrement);

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
    this.daterangepickerStart = dr.startDate ? dr.startDate.format(this.locale.format) : null;
    this.daterangepickerEnd = dr.endDate ? dr.endDate.format(this.locale.format) : null;
    this.daterangeInputValue = this.daterangepickerStart + ' - ' + (this.daterangepickerEnd !== null ? this.daterangepickerEnd : '');
  }



  showCalendars() {
    this.showCalendarsClass = 'show-calendar';
    // this.move();
    this.showCalendar.emit(this);
  }

  hoverDate(row: number, col: number, side: string) {
    const dr = this.config.dateRange,
          date = this[side].calendar[row][col].date;

    // We update the start/end inputs to match what the date being hovered on
    if (dr.endDate && this.leftInputHasFocus) {
      this.daterangepickerStart = date.format(this.locale.format);
    } else if (!dr.endDate && !this.rightInputHasFocus) {
      this.daterangepickerEnd = date.format(this.locale.format);
    }

    // Whenever a start date is hovered over, we check all days displayed and make days that
    // come after marked as in range.
    let day;
    if (!dr.endDate) {
      for (const r in this[side].calendar) {
        if (Number.isNaN(Number(r))) continue;
        for (const c in this[side].calendar[r]) {
          if (Number.isNaN(Number(c))) continue;
          day = this[side].calendar[r][c].date;
          if (day.isAfter(dr.startDate) && day.isBefore(date) || day.isSame(date, 'day')) {
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
        date = this.daterange.startDate;
        hour = parseInt(this.hourLeftValue, 10);
        minute = parseInt(this.minuteLeftValue, 10);
        second = parseInt(this.secondLeftValue, 10);
        ampm = this.ampmLeftValue;
    } else if (side === 'right') {
        date = this.daterange.endDate;
        hour = parseInt(this.hourRightValue, 10);
        minute = parseInt(this.minuteRightValue, 10);
        second = parseInt(this.secondRightValue, 10);
        ampm = this.ampmRightValue;
    }
    if (!this.timePicker24Hour) {
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
    if (this.timePickerSeconds) {
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

    if (dr.endDate || date.isBefore(dr.startDate, 'day')) { // picking start
      dr.endDate = null;
      this.setStartDate(date.clone());
    } else if (!dr.endDate && date.isBefore(dr.startDate)) {
      // special case: clicking the same date for start/end,
      // but the time of the end date is before the start date
      this.setEndDate(dr.startDate.clone());
    } else {
      this.setEndDate(date.clone());
    }
    if (this.config.options.singleDatePicker) {
        this.setEndDate(dr.startDate);
    }

    this.updateView();
  }

  /**
   * Set the year using dropdown.  If linked calendar option is enabled,
   * then set other calendar side also.
   */
  clickDropdownYear(side: string, year: number) {
    if (this.linkedCalendars) {
      if (side === 'left') {
        this.left.calendar.month.year(year);
        const date = new Date(this.left.calendar.month),
            m = moment(date);
        this.right.calendar.month.set(m.toObject()).add(1, 'month');
      } else {
        this.right.calendar.month.year(year);
        const date = new Date(this.right.calendar.month),
            m = moment(date);
        this.left.calendar.month.set(m.toObject()).subtract(1, 'month');
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
    if (this.linkedCalendars) {
      if (side === 'left') {
        this.left.calendar.month.month(month);
        const date = new Date(this.left.calendar.month),
            m = moment(date);
        this.right.calendar.month.set(m.toObject()).add(1, 'month');
      } else {
        this.right.calendar.month.month(month);
        const date = new Date(this.right.calendar.month),
            m = moment(date);
        this.left.calendar.month.set(m.toObject()).subtract(1, 'month');
      }
    } else {
      this[side].calendar.month.month(month);
    }
    this.updateCalendars();
  }

  clickPrev(side: string) {
    if (this.linkedCalendars) {
      this.left.calendar.month.subtract(1, 'month');
      this.right.calendar.month.subtract(1, 'month');
    } else {
      this[side].calendar.month.subtract(1, 'month');
    }
    this.updateCalendars();
  }

  clickNext(side: string) {
    if (this.linkedCalendars) {
      this.left.calendar.month.add(1, 'month');
      this.right.calendar.month.add(1, 'month');
    } else {
      this[side].calendar.month.add(1, 'month');
    }
    this.updateCalendars();
  }

  clickRange(label: string, range: moment.Moment[]) {
    const dr = this.config.dateRange;
    this.chosenLabel = label;
    if (label === this.locale.customRangeLabel) {
      this.showCalendars();
    } else {
      dr.startDate = range[0];
      dr.endDate = range[1];
      if (!this.timePicker) {
        dr.startDate.startOf('day');
        dr.endDate.startOf('day');
      }
      if (!this.config.options.alwaysShowCalendar) {
        this.showCalendars = () => false;
      }
      this.updateView();
    }
  }

  updateElement() {
    if (!this.config.options.singleDatePicker) {
      this.daterangeInputValue = this.daterange.startDate.format(this.locale.format) +
        this.locale.separator + this.daterange.endDate.format(this.locale.format);
      this.changed.emit(null);
    }
    this.daterangeInputValue = this.daterange.startDate.format(this.locale.format);
  }
}
