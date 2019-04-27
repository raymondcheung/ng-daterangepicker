### Date Range Picker for Angular

### Links:
- [Demo](#demo)
- [Tests](#tests)
- [Installation](#installation)
- [Contributing](#contributing)
- [Licensing](#licensing)

# Demo
https://raymondcheung.github.io/ng-daterangepicker

# Installation
Currently, this is in development.  So, the only way to install it is to either clone it from this repo, or download it as a zip and unpack it to your project.

# Usage
Import `DaterangePickerModule` into `NgModule` in your `app.module.ts` file.
```js
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    DaterangePickerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Pass in configs into the `dp-daterange-picker` component.
```js
@Component({
  selector: 'app-root',
  template: `<dp-daterange-picker [config]="config"></dp-daterange-picker>`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public config = {
    "dateRange": {
      "startDate": "2019-04-23T07:00:00.000Z",
      "endDate": "2019-04-27T07:00:00.000Z",
      "minDate": "2017-04-25T07:00:00.000Z",
      "maxDate": "2021-04-25T07:00:00.000Z"
    },
    "options": {
      "showDropdowns": false,
      "showISOWeekNumbers": false,
      "showWeekNumbers": false,
      "rangesEnabled": true,
      "linkedCalendars": false,
      "alwaysShowCalendars": false
    },
    "timePicker": {
      "show": true,
      "timePicker24Hour": false,
      "timePickerIncrement": 1,
      "timePickerSeconds": true
    },
    "locale": {
      "format": "MM/DD/YYYY HH:mm:ss",
      "direction": "ltr",
      "separator": "",
      "weekLabel": "",
      "customRangeLabel": "",
      "daysOfWeek": [
        "Su",
        "Mo",
        "Tu",
        "We",
        "Th",
        "Fr",
        "Sa"
      ],
      "monthNames": [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ],
      "firstDay": 0
    },
    "dateLimit": {
      "amount": 2,
      "unitOfTime": "years"
    },
    "ranges": {
      "Today": [
        "2019-04-25T07:00:00.000Z",
        "2019-04-26T06:59:59.999Z"
      ],
      "Yesterday": [
        "2019-04-25T04:21:07.517Z",
        "2019-04-25T06:59:59.999Z"
      ],
      "Last 7 Days": [
        "2019-04-19T04:21:07.522Z",
        "2019-04-26T06:59:59.999Z"
      ],
      "Last 30 Days": [
        "2019-03-27T04:21:07.524Z",
        "2019-04-26T06:59:59.999Z"
      ],
      "This Month": [
        "2019-04-01T07:00:00.000Z",
        "2019-05-01T06:59:59.999Z"
      ],
      "Last Month": [
        "2019-03-01T08:00:00.000Z",
        "2019-04-01T06:59:59.999Z"
      ]
    }
  };


```

See [configuration generator](#demo) to generate a configuration object to pass into it.

# Tests
No significant testing yet.

## Dropped(configurations from Bootstrap Daterange Picker that will not be ported)
- parentEl

## Unsupported(no decision yet on whether it will be worked on)
- drops: (string: 'down' or 'up') Whether the picker appears below (default) or above the HTML element it's attached to
- opens: (string: 'left'/'right'/'center') Whether the picker appears aligned to the left, to the right, or centered under the HTML element it's attached to
- autoUpdateInput: (boolean) Indicates whether the date range picker should automatically update the value of an <input> element it's attached to at initialization and when the selected dates change.
- autoApply: (boolean) Hide the apply and cancel buttons, and automatically apply a new date range as soon as two dates or a predefined range is selected
- applyClass: (string) CSS class string that will be added to the apply button
- cancelClass: (string) CSS class string that will be added to the cancel button
- isInvalidDate: (function) A function that is passed each date in the two calendars before they are displayed, and may return true or false to indicate whether that date should be available for selection or not.
- isCustomDate: (function) A function that is passed each date in the two calendars before they are displayed, and may return a string or array of CSS class names to apply to that date's calendar cell.
- singleDatePicker: (boolean) Show only a single calendar to choose one date, instead of a range picker with two calendars; the start and end dates provided to your callback will be the same single date chosen
- buttonClasses: (array) CSS class names that will be added to all buttons in the picker

## Currently functional
- startDate (Date object, moment object or string) The start of the initially selected date range
- endDate: (Date object, moment object or string) The end of the initially selected date range
- minDate: (Date object, moment object or string) The earliest date a user may select
- maxDate: (Date object, moment object or string) The latest date a user may select
- locale: (object) Allows you to provide localized strings for buttons and labels, customize the date format, and change the first day of week for the calendars. Check off "locale (with example settings)" in the configuration generator to see how to customize these options.
- showWeekNumbers: (boolean) Show localized week numbers at the start of each week on the calendars
- showISOWeekNumbers: (boolean) Show ISO week numbers at the start of each week on the calendars
- linkedCalendars: (boolean) When enabled, the two calendars displayed will always be for two sequential months (i.e. January and February), and both will be advanced when clicking the left or right arrows above the calendars. When disabled, the two calendars can be individually advanced and display any month/year.
- ranges: (object) Set predefined date ranges the user can select from. Each key is the label for the range, and its value an array with two dates representing the bounds of the range
- autoUpdateInput
- timePicker: (boolean) Allow selection of dates with times, not just dates
- timePickerIncrement: (number) Increment of the minutes selection list for times (i.e. 30 to allow only selection of times ending in 0 or 30)
- timePicker24Hour: (boolean) Use 24-hour instead of 12-hour times, removing the AM/PM selection
- timePickerSeconds: (boolean) Show seconds in the timePicker
- dateLimit: (object) The maximum span between the selected start and end dates. Can have any property you can add to a moment object (i.e. days, months)
- showDropdowns: (boolean) Show year and month select boxes above calendars to jump to a specific month and year
- showCustomRangeLabel: (boolean) Displays an item labeled "Custom Range" at the end of the list of predefined ranges, when the ranges option is used. 
- alwaysShowCalendars: (boolean) Normally, if you use the ranges option to specify pre-defined date ranges, calendars for choosing a custom date range are not shown until the user clicks "Custom Range". When this option is set to true, the calendars for choosing a custom date range are always shown instead.

# Contributing
I'm always looking for extra help, but currently I am only able to work on this a few hours a week.  Also, there very few unit tests to guarantee against unintended breakage.  So, pull requests will be very carefully and slowly reviewed.  Once I have a more comprehensive unit test suite up, and can run them to verify nothing breaks upon merging, approvals will come faster.