import * as moment from 'moment';
import { Daterange as IDaterange } from './core/types';

export class Daterange implements IDaterange {
  public startDate: moment.Moment;
  public endDate: moment.Moment;
  public minDate: moment.Moment;
  public maxDate: moment.Moment;

  constructor(startDate?: moment.Moment, endDate?: moment.Moment, minDate?: moment.Moment, maxDate?: moment.Moment) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.minDate = minDate;
    this.maxDate = maxDate;
  }
}
