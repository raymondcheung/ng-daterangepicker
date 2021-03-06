import * as moment from 'moment';

export interface Calendar {
  [key: number]: {
    inRange?: string;
    date?: moment.Moment;
  }[];
  firstDay?: moment.Moment;
  lastDay?: moment.Moment;
  month?: moment.Moment;
  disabled?: boolean;
}

// example { unitOfTime: 1, amount: 'd' } if you want to add one day
export interface DateLimit {
  amount: moment.DurationInputArg1;
  unitOfTime: moment.DurationInputArg2;
}

export interface Config {
  readonly options?: Options;
  readonly locale?: any;
  readonly dateLimit?: DateLimit;
           dateRange?: Daterange;
  readonly isInvalidDate?: (d: string) => boolean;
  readonly isCustomDate?: (d: string) => boolean;
  readonly timePicker?: TimePicker;
  readonly ranges?: any;
}

export interface TimePicker {
  show: boolean;
  timePickerSeconds?: boolean;
  timePickerIncrement?: number;
  timePicker24Hour?: boolean;
}

export interface Daterange {
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  minDate?: moment.Moment;
  maxDate?: moment.Moment;
}

export interface Options {
  readonly rangesEnabled?: boolean;
  readonly alwaysShowCalendars?: boolean;
  readonly showDropdowns?: boolean;
  readonly showWeekNumbers?: boolean;
  readonly showISOWeekNumbers?: boolean;
  readonly showCustomRangeLabel?: boolean;
  readonly linkedCalendars?: boolean;
}

export class DefaultLocale implements Locale {
  format = 'MM/DD/YYYY HH:mm:ss';
  direction = 'ltr';
  separator = '';
  weekLabel = '';
  customRangeLabel: '';
  daysOfWeek = moment.weekdaysMin();
  monthNames = moment.monthsShort();
  firstDay = moment.localeData().firstDayOfWeek();
}

export interface Locale {
  format: string;
  direction: string;
  separator: string;
  weekLabel: string;
  customRangeLabel: string;
  daysOfWeek: string[];
  monthNames: string[];
  firstDay: number;
}
